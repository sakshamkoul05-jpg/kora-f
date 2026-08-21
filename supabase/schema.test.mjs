/**
 * Applies the real supabase/setup.sql to an in-process Postgres (PGlite, PG16)
 * and exercises the parts that would actually hurt if they were wrong:
 * the triggers, the exclusion constraint, and the half-open date semantics.
 *
 * PGlite is not Supabase — there is no GoTrue, no PostgREST, no real roles
 * enforcement. So this proves the SCHEMA runs and the CONSTRAINTS bite.
 * It does not prove the RLS policies grant the right things to the right
 * roles; that still needs a real project.
 */
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";

const SQL = readFileSync(new URL("./setup.sql", import.meta.url), "utf8");

const db = await PGlite.create({ extensions: { btree_gist, pgcrypto } });

let pass = 0, fail = 0;
const ok = (n) => { console.log(`  PASS  ${n}`); pass++; };
const no = (n, e) => { console.log(`  FAIL  ${n}\n        ${e}`); fail++; };

async function check(name, fn) {
  try { await fn(); ok(name); } catch (e) { no(name, e.message); }
}
/** Assert a statement is rejected, optionally with a specific SQLSTATE. */
async function rejects(name, sql, params, code) {
  try {
    await db.query(sql, params);
    no(name, "expected a rejection, but it was accepted");
  } catch (e) {
    if (code && e.code !== code) no(name, `expected SQLSTATE ${code}, got ${e.code}: ${e.message}`);
    else ok(`${name}${code ? ` (${code})` : ""}`);
  }
}

// --- Supabase-provided objects that setup.sql assumes already exist ---------
console.log("\nStubbing the Supabase environment (roles, auth schema)...");
await db.exec(`
  create role anon login;
  create role authenticated;
  create role service_role;
  create schema if not exists auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $$;
`);
console.log("  done");

// --- 1. Does the schema actually apply? ------------------------------------
console.log("\nApplying supabase/setup.sql ...");
try {
  await db.exec(SQL);
  console.log("  applied with no errors");
  pass++;
} catch (e) {
  console.log(`  FAILED TO APPLY: ${e.message}`);
  process.exit(1);
}

// --- 2. Structure ----------------------------------------------------------
console.log("\nStructure");
await check("six rooms seeded", async () => {
  const r = await db.query("select count(*)::int n from public.rooms");
  if (r.rows[0].n !== 6) throw new Error(`expected 6 rooms, got ${r.rows[0].n}`);
});
await check("exclusion constraint exists on booking_requests", async () => {
  // Renamed in booking_v2: it now covers accepted holds as well as confirmed
  // stays, so the name no longer says "confirmed".
  const r = await db.query(
    `select count(*)::int n from pg_constraint
      where conname = 'no_overlapping_held_stays' and contype = 'x'`
  );
  if (r.rows[0].n !== 1) throw new Error("exclusion constraint not found");
});
await check("RLS enabled on every public table", async () => {
  const r = await db.query(
    `select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`
  );
  if (r.rows.length) throw new Error(`RLS off on: ${r.rows.map(x => x.relname).join(", ")}`);
});

const roomId = async (slug) =>
  (await db.query("select id from public.rooms where slug = $1", [slug])).rows[0].id;
const ROOM = await roomId((await db.query("select slug from public.rooms order by sort_order limit 1")).rows[0].slug);
const ROOM2 = (await db.query("select id from public.rooms order by sort_order offset 1 limit 1")).rows[0].id;

const insert = (ci, co, room = ROOM, name = "Test Guest") =>
  db.query(
    `insert into public.booking_requests (check_in, check_out, adults, room_id, guest_name, guest_email)
     values ($1,$2,2,$3,$4,'test@example.com') returning id, reference, status`,
    [ci, co, room, name]
  );

// --- 3. Triggers -----------------------------------------------------------
console.log("\nTriggers");
await check("reference is auto-generated as KH-YYYY-NNNN", async () => {
  const r = await insert("2026-10-01", "2026-10-04");
  const ref = r.rows[0].reference;
  if (!/^KH-\d{4}-\d{4}$/.test(ref)) throw new Error(`bad reference format: ${ref}`);
});
await check("references are unique across inserts", async () => {
  const a = await insert("2026-11-01", "2026-11-03");
  const b = await insert("2026-11-05", "2026-11-07");
  if (a.rows[0].reference === b.rows[0].reference) throw new Error("duplicate reference");
});
await check("a crafted insert cannot self-confirm", async () => {
  const r = await db.query(
    `insert into public.booking_requests
       (check_in, check_out, room_id, guest_name, guest_email, status, quoted_total_inr, host_note)
     values ('2027-01-10','2027-01-12',$1,'Attacker','a@example.com','confirmed', 1, 'free stay')
     returning status, quoted_total_inr, host_note`,
    [ROOM]
  );
  const row = r.rows[0];
  if (row.status !== "pending") throw new Error(`status was ${row.status}, expected pending`);
  if (row.quoted_total_inr !== null) throw new Error("quoted_total_inr was not stripped");
  if (row.host_note !== null) throw new Error("host_note was not stripped");
});

// --- 4. Constraints --------------------------------------------------------
console.log("\nConstraints");
// Rejected, but by the generated `stay` daterange column (22000) rather than
// the checkout_after_checkin check (23514) — the generated column is computed
// first, so for a backwards range the check constraint never gets to fire.
// Either way the row cannot exist, which is the property that matters.
await rejects("check_out before check_in is rejected",
  `insert into public.booking_requests (check_in, check_out, room_id, guest_name, guest_email)
   values ('2026-12-10','2026-12-08',$1,'Backwards','b@example.com')`, [ROOM], "22000");
await rejects("same-day check_in/check_out is rejected",
  `insert into public.booking_requests (check_in, check_out, room_id, guest_name, guest_email)
   values ('2026-12-10','2026-12-10',$1,'Zero','z@example.com')`, [ROOM], "23514");
await rejects("a 6-month stay is rejected",
  `insert into public.booking_requests (check_in, check_out, room_id, guest_name, guest_email)
   values ('2026-12-10','2027-06-10',$1,'Forever','f@example.com')`, [ROOM], "23514");
await rejects("a malformed email is rejected",
  `insert into public.booking_requests (check_in, check_out, room_id, guest_name, guest_email)
   values ('2026-12-10','2026-12-12',$1,'Bad','not-an-email')`, [ROOM], "23514");

// --- 5. The double-booking guarantee ---------------------------------------
console.log("\nDouble-booking (the constraint that matters)");
const held = await insert("2027-03-10", "2027-03-15", ROOM, "Confirmed Guest");
await db.query("update public.booking_requests set status = 'confirmed' where id = $1", [held.rows[0].id]);

await check("two PENDING requests may overlap (a request holds nothing)", async () => {
  await insert("2027-03-11", "2027-03-14", ROOM, "Hopeful");
});
await check("confirming an overlapping stay is blocked", async () => {
  const other = await insert("2027-03-12", "2027-03-13", ROOM, "Clash");
  try {
    await db.query("update public.booking_requests set status='confirmed' where id=$1", [other.rows[0].id]);
    throw new Error("overlapping confirm was ALLOWED — double booking is possible");
  } catch (e) {
    if (e.code !== "23P01") throw new Error(`expected 23P01, got ${e.code}: ${e.message}`);
  }
});
await check("check-out day frees the room (half-open ranges)", async () => {
  const back = await insert("2027-03-15", "2027-03-18", ROOM, "Same Day Arrival");
  await db.query("update public.booking_requests set status='confirmed' where id=$1", [back.rows[0].id]);
});
await check("the day before check-in is free", async () => {
  const before = await insert("2027-03-07", "2027-03-10", ROOM, "Departs On Arrival Day");
  await db.query("update public.booking_requests set status='confirmed' where id=$1", [before.rows[0].id]);
});
await check("a DIFFERENT room may be confirmed for the same dates", async () => {
  const other = await insert("2027-03-11", "2027-03-14", ROOM2, "Other Room");
  await db.query("update public.booking_requests set status='confirmed' where id=$1", [other.rows[0].id]);
});
await check("a declined stay releases the room", async () => {
  const a = await insert("2027-08-01", "2027-08-05", ROOM, "Will Decline");
  await db.query("update public.booking_requests set status='confirmed' where id=$1", [a.rows[0].id]);
  await db.query("update public.booking_requests set status='declined' where id=$1", [a.rows[0].id]);
  const b = await insert("2027-08-02", "2027-08-04", ROOM, "Gets The Room");
  await db.query("update public.booking_requests set status='confirmed' where id=$1", [b.rows[0].id]);
});

// --- 6. Availability function ----------------------------------------------
console.log("\nAvailability");
await check("room_availability() marks a confirmed room unavailable", async () => {
  const r = await db.query("select * from public.room_availability('2027-03-11','2027-03-14')");
  if (r.rows.length !== 6) throw new Error(`expected 6 rooms, got ${r.rows.length}`);
  if (!("is_available" in r.rows[0])) throw new Error(`no is_available column; got ${Object.keys(r.rows[0])}`);
  const busy = r.rows.filter((x) => x.is_available === false);
  if (busy.length !== 2) throw new Error(`expected rooms 1 and 2 held, got ${busy.length}`);
});
await check("room_availability() shows everything free on open dates", async () => {
  const r = await db.query("select * from public.room_availability('2029-05-01','2029-05-03')");
  const busy = r.rows.filter((x) => x.is_available === false);
  if (busy.length) throw new Error(`${busy.length} rooms wrongly unavailable`);
});
await check("blocked_dates removes a room from availability", async () => {
  await db.query(
    `insert into public.blocked_dates (room_id, starts_on, ends_on, reason)
     values ($1, '2029-07-01', '2029-07-10', 'family staying')`, [ROOM]);
  const r = await db.query("select * from public.room_availability('2029-07-03','2029-07-05')");
  const busy = r.rows.filter((x) => x.is_available === false);
  if (busy.length !== 1) throw new Error(`expected exactly 1 blocked room, got ${busy.length}`);
});
await check("a site-wide block (room_id null) closes every room", async () => {
  await db.query(
    `insert into public.blocked_dates (room_id, starts_on, ends_on, reason)
     values (null, '2029-09-01', '2029-09-05', 'closed for repairs')`);
  const r = await db.query("select * from public.room_availability('2029-09-02','2029-09-03')");
  const free = r.rows.filter((x) => x.is_available === true);
  if (free.length) throw new Error(`${free.length} rooms still bookable during a full closure`);
});

// --- 7. As the anon role ---------------------------------------------------
// Supabase sets these grants via default privileges; PGlite does not, so they
// are applied here to match what the real project looks like.
await db.exec(`
  grant usage on schema public to anon, authenticated;
  grant select, insert, update, delete on all tables in schema public to anon, authenticated;
  grant execute on all functions in schema public to anon, authenticated;
`);

/** Run fn with the session role set to anon, so RLS actually applies. */
async function asAnon(fn) {
  await db.exec("set role anon");
  try { return await fn(); } finally { await db.exec("reset role"); }
}

console.log("\nAs the anon role (RLS enforced)");
await check("anon cannot read booking_requests", () => asAnon(async () => {
  const r = await db.query("select id from public.booking_requests");
  if (r.rows.length) throw new Error(`GUEST DATA EXPOSED: ${r.rows.length} rows readable`);
}));
await check("anon cannot read the staff allow-list", () => asAnon(async () => {
  const r = await db.query("select * from public.staff");
  if (r.rows.length) throw new Error(`${r.rows.length} staff rows readable`);
}));
await check("anon can read rooms", () => asAnon(async () => {
  const r = await db.query("select slug from public.rooms");
  if (r.rows.length !== 6) throw new Error(`expected 6 rooms, got ${r.rows.length}`);
}));
await check("anon cannot UPDATE a request to confirmed", () => asAnon(async () => {
  const r = await db.query("update public.booking_requests set status='confirmed' returning id");
  if (r.rows.length) throw new Error(`${r.rows.length} rows updated — anon can confirm its own booking`);
}));
await check("anon cannot DELETE a request", () => asAnon(async () => {
  const r = await db.query("delete from public.booking_requests returning id");
  if (r.rows.length) throw new Error(`${r.rows.length} rows deleted`);
}));

// The bug that motivated submit_booking_request(). Kept as a test so nobody
// "simplifies" the RPC back into a plain insert.
console.log("\nWhy submit_booking_request() exists");
await check("INSERT ... RETURNING is refused for anon (no SELECT policy)", () => asAnon(async () => {
  try {
    await db.query(
      `insert into public.booking_requests (check_in, check_out, guest_name, guest_email)
       values ('2028-02-01','2028-02-04','Direct','d@example.com') returning reference`
    );
    throw new Error("RETURNING succeeded — has an anon SELECT policy been added? It must not be.");
  } catch (e) {
    if (e.code !== "42501") throw new Error(`expected 42501, got ${e.code}: ${e.message}`);
  }
}));

console.log("\nsubmit_booking_request()");
const submit = (ci, co, slug = null, name = "RPC Guest") =>
  db.query(
    `select public.submit_booking_request($1,$2,2,0,$3,'rpc@example.com',null,null,null,$4) as reference`,
    [ci, co, name, slug]
  );

await check("anon gets a reference back", () => asAnon(async () => {
  const r = await submit("2028-04-01", "2028-04-04");
  if (!/^KH-\d{4}-\d{4}$/.test(r.rows[0].reference)) throw new Error(`bad reference: ${r.rows[0].reference}`);
}));
await check("the row it wrote is pending, with no host fields set", async () => {
  const r = await db.query(
    `select status, host_note, quoted_total_inr from public.booking_requests
      where guest_email='rpc@example.com' order by created_at desc limit 1`);
  const row = r.rows[0];
  if (row.status !== "pending") throw new Error(`status ${row.status}`);
  if (row.host_note !== null || row.quoted_total_inr !== null) throw new Error("host fields were set");
});
await check("it resolves a room slug", () => asAnon(async () => {
  const slug = (await db.query("select slug from public.rooms order by sort_order limit 1")).rows[0].slug;
  const r = await submit("2028-05-01", "2028-05-03", slug, "Slug Guest");
  if (!r.rows[0].reference) throw new Error("no reference returned");
}));
await check("an unknown room slug does not become someone else's room", async () => {
  // Submit as anon, but verify as superuser — anon cannot read the row back,
  // which is the whole point of the design.
  await asAnon(() => submit("2028-06-01", "2028-06-03", "no-such-room", "Bad Slug"));
  const r = await db.query(
    `select room_id from public.booking_requests where guest_name='Bad Slug'`);
  if (!r.rows.length) throw new Error("the request was not written at all");
  if (r.rows[0].room_id !== null) throw new Error("a bogus slug resolved to a real room");
});
await rejects("a past check-in is refused",
  `select public.submit_booking_request(current_date - 5, current_date + 2, 2, 0, 'Past', 'p@example.com')`,
  [], "22023");
await rejects("check_out before check_in is refused",
  `select public.submit_booking_request('2028-07-10'::date, '2028-07-08'::date, 2, 0, 'Back', 'b@example.com')`,
  [], "22023");
await rejects("a stay beyond 90 nights is refused",
  `select public.submit_booking_request('2028-07-01'::date, '2028-12-01'::date, 2, 0, 'Long', 'l@example.com')`,
  [], "22023");

// --- 8. Booking v2: accepted holds, expiry, money -------------------------
console.log("\nAn accepted request holds the room");
const V2ROOM = ROOM;
const mkPending = async (ci, co, name, rid = V2ROOM) =>
  (await db.query(
    `insert into public.booking_requests (check_in, check_out, guest_name, guest_email, room_id)
     values ($1,$2,$3,'v2@example.com',$4) returning id`, [ci, co, name, rid]
  )).rows[0].id;

const heldId = await mkPending("2028-09-01", "2028-09-05", "Accepted Guest");
await db.query(
  `update public.booking_requests set status='accepted', accepted_at=now(),
     hold_expires_at = now() + interval '24 hours', total_inr=10000, deposit_inr=2500
   where id=$1`, [heldId]);

await check("a second accept for overlapping dates is refused", async () => {
  const clash = await mkPending("2028-09-02", "2028-09-04", "Clashing Guest");
  try {
    await db.query(`update public.booking_requests set status='accepted' where id=$1`, [clash]);
    throw new Error("two guests were quoted the same room at once");
  } catch (e) {
    if (e.code !== "23P01") throw new Error(`expected 23P01, got ${e.code}: ${e.message}`);
  }
});
await check("an accepted hold blocks availability", async () => {
  const r = await db.query(`select public.is_room_taken($1,'2028-09-02','2028-09-04') t`, [V2ROOM]);
  if (r.rows[0].t !== true) throw new Error("accepted hold did not block");
});
await check("a lapsed hold stops blocking even before the sweep", async () => {
  await db.query(
    `update public.booking_requests set hold_expires_at = now() - interval '1 hour' where id=$1`,
    [heldId]);
  const r = await db.query(`select public.is_room_taken($1,'2028-09-02','2028-09-04') t`, [V2ROOM]);
  if (r.rows[0].t !== false) throw new Error("a lapsed hold still blocks the calendar");
});
await check("expire_stale_holds() sweeps a lapsed hold to 'expired'", async () => {
  const n = await db.query("select public.expire_stale_holds() n");
  if (n.rows[0].n < 1) throw new Error("swept nothing");
  const r = await db.query(`select status::text st from public.booking_requests where id=$1`, [heldId]);
  if (r.rows[0].st !== "expired") throw new Error(`status is ${r.rows[0].st}`);
});
await check("a paid hold is never expired, however late", async () => {
  const paid = await mkPending("2028-10-01", "2028-10-03", "Paid Guest");
  await db.query(
    `update public.booking_requests set status='accepted',
       hold_expires_at = now() - interval '5 hours', deposit_paid_at = now() where id=$1`, [paid]);
  await db.query("select public.expire_stale_holds()");
  const r = await db.query(`select status::text st from public.booking_requests where id=$1`, [paid]);
  if (r.rows[0].st !== "accepted") throw new Error(`a paid booking was expired (now ${r.rows[0].st})`);
});
await check("every money and host field is stripped on insert", async () => {
  const r = await db.query(
    `insert into public.booking_requests
       (check_in, check_out, guest_name, guest_email, status, total_inr, deposit_inr,
        subtotal_inr, accepted_at, hold_expires_at, deposit_paid_at, nightly_rates, host_note)
     values ('2028-11-01','2028-11-03','Cheeky','c@example.com','confirmed', 1, 1, 1,
             now(), now() + interval '99 days', now(), '[]'::jsonb, 'free')
     returning status::text st, total_inr, deposit_inr, subtotal_inr, accepted_at,
               hold_expires_at, deposit_paid_at, nightly_rates, host_note`);
  const b = r.rows[0];
  if (b.st !== "pending") throw new Error(`status came back as ${b.st}`);
  const leaked = Object.entries(b).filter(([k, v]) => k !== "st" && v !== null).map(([k]) => k);
  if (leaked.length) throw new Error(`not stripped: ${leaked.join(", ")}`);
});
await check("settings and payments exist with RLS on", async () => {
  const r = await db.query(
    `select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and relname in ('settings','payments','rate_overrides')`);
  if (r.rows.length !== 3) throw new Error(`expected 3 tables, got ${r.rows.length}`);
  const off = r.rows.filter((x) => !x.relrowsecurity).map((x) => x.relname);
  if (off.length) throw new Error(`RLS off on ${off.join(", ")}`);
});
await check("anon cannot read payments", () => asAnon(async () => {
  const r = await db.query("select * from public.payments");
  if (r.rows.length) throw new Error(`${r.rows.length} payment rows readable by anon`);
}));
await check("anon can read settings and rates (prices are not secret)", () => asAnon(async () => {
  const s = await db.query("select deposit_percent from public.settings");
  if (s.rows.length !== 1) throw new Error("settings not readable");
}));

console.log(`\n${"=".repeat(52)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(52)}`);
process.exit(fail ? 1 : 0);

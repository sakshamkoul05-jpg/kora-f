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
  create role anon;
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
  const r = await db.query(
    `select count(*)::int n from pg_constraint
      where conname = 'no_overlapping_confirmed_stays' and contype = 'x'`
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

console.log(`\n${"=".repeat(52)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(52)}`);
process.exit(fail ? 1 : 0);

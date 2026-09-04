/**
 * The guest-facing booking lookup, tested against a real Postgres.
 *
 * Kept separate from schema.test.mjs because its whole subject is one
 * function, and because the security property it checks — that a guessed
 * reference is worthless without the matching email — deserves to fail loudly
 * on its own rather than as item forty-something in a longer list.
 */
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";

const db = await PGlite.create({ extensions: { btree_gist, pgcrypto } });
await db.exec(`
  create role anon login; create role authenticated login; create role service_role;
  create schema if not exists auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create or replace function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid; $$;
`);
await db.exec(readFileSync(new URL("./setup.sql", import.meta.url), "utf8"));
await db.exec(`
  grant usage on schema public to anon, authenticated;
  grant select, insert, update, delete on all tables in schema public to anon, authenticated;
  grant execute on all functions in schema public to anon, authenticated;
`);

let pass = 0, fail = 0;
const ok = (m) => { console.log(`  PASS  ${m}`); pass++; };
const no = (m, d) => { console.log(`  FAIL  ${m}\n        ${d}`); fail++; };
const check = async (m, fn) => { try { await fn(); ok(m); } catch (e) { no(m, e.message); } };

const asAnon = async (fn) => {
  await db.exec("set role anon");
  try { return await fn(); } finally { await db.exec("reset role"); }
};

const ROOM = (await db.query("select id from public.rooms order by sort_order limit 1")).rows[0].id;
const look = (ref, email) => db.query("select * from public.booking_status_for($1,$2)", [ref, email]);

let day = 1;
async function makeBooking(email, status) {
  // Distinct nights each time: the exclusion constraint is real, and two
  // accepted stays in one room on the same nights is what it exists to refuse.
  const from = `2029-03-${String(day).padStart(2, "0")}`;
  const to = `2029-03-${String(day + 2).padStart(2, "0")}`;
  day += 4;
  const r = await db.query(
    `insert into public.booking_requests (check_in, check_out, room_id, guest_name, guest_email)
     values ($3,$4,$1,'Lookup Guest',$2) returning id, reference`,
    [ROOM, email, from, to]
  );
  if (status !== "pending") {
    await db.query(
      `update public.booking_requests set status=$2, total_inr=6000, deposit_inr=1500,
         accepted_at=now(), hold_expires_at=now()+interval '24 hours' where id=$1`,
      [r.rows[0].id, status]
    );
  }
  return r.rows[0];
}

console.log("\nFinding your own booking");
const booking = await makeBooking("guest@example.com", "accepted");
await db.query(
  `insert into public.payments (booking_request_id, amount_inr, status, payment_url)
   values ($1, 1500, 'created', 'https://rzp.io/rzp/REAL')`,
  [booking.id]
);

await check("reference and email together return the booking", () => asAnon(async () => {
  const r = await look(booking.reference, "guest@example.com");
  if (!r.rows.length) throw new Error("not found");
  if (r.rows[0].total_inr !== 6000) throw new Error("wrong total");
  if (!r.rows[0].room_name) throw new Error("room name missing");
}));

await check("capitals and stray spaces do not turn a real guest away", () => asAnon(async () => {
  const r = await look(`  ${booking.reference.toLowerCase()} `, " GUEST@Example.com ");
  if (!r.rows.length) throw new Error("rejected over formatting");
}));

await check("the payment link comes back when a deposit is due", () => asAnon(async () => {
  const r = await look(booking.reference, "guest@example.com");
  if (r.rows[0].payment_url !== "https://rzp.io/rzp/REAL") throw new Error("no link");
}));

console.log("\nA guessed reference is worthless on its own");
await check("the wrong email returns nothing at all", () => asAnon(async () => {
  const r = await look(booking.reference, "attacker@example.com");
  if (r.rows.length) throw new Error("GUEST DATA LEAKED to a guessed reference");
}));
await check("an empty email matches nothing", () => asAnon(async () => {
  if ((await look(booking.reference, "")).rows.length) throw new Error("blank email matched");
}));
await check("a reference that does not exist returns nothing", () => asAnon(async () => {
  if ((await look("KH-2029-9999", "guest@example.com")).rows.length) throw new Error("phantom booking");
}));

console.log("\nA link is only offered when payment is actually due");
await check("nothing to pay while a request is still pending", async () => {
  const p = await makeBooking("pending@example.com", "pending");
  const r = await asAnon(() => look(p.reference, "pending@example.com"));
  if (r.rows[0].payment_url !== null) throw new Error("asked for money before accepting");
  if (r.rows[0].status !== "pending") throw new Error(`status is ${r.rows[0].status}`);
});
await check("a paid booking is never offered a second payment", async () => {
  await db.query(
    "update public.booking_requests set deposit_paid_at=now(), status='confirmed' where id=$1",
    [booking.id]
  );
  const r = await asAnon(() => look(booking.reference, "guest@example.com"));
  if (r.rows[0].payment_url !== null) throw new Error("offered payment twice");
  if (!r.rows[0].deposit_paid_at) throw new Error("paid timestamp missing");
});
await check("a lapsed hold offers no link", async () => {
  const e = await makeBooking("lapsed@example.com", "accepted");
  await db.query(
    `insert into public.payments (booking_request_id, amount_inr, status, payment_url)
     values ($1, 1500, 'created', 'https://rzp.io/rzp/OLD')`,
    [e.id]
  );
  await db.query(
    "update public.booking_requests set hold_expires_at = now() - interval '1 hour' where id=$1",
    [e.id]
  );
  const r = await asAnon(() => look(e.reference, "lapsed@example.com"));
  if (r.rows[0].payment_url !== null) throw new Error("offered payment on an expired hold");
});

console.log("\nNothing else comes with it");
await check("no host notes, no internal ids, no other bookings", () => asAnon(async () => {
  const r = await look(booking.reference, "guest@example.com");
  for (const banned of ["host_note", "id", "decided_by", "message", "guest_phone"]) {
    if (banned in r.rows[0]) throw new Error(`${banned} exposed to the guest`);
  }
  if (r.rows.length !== 1) throw new Error("returned more than one booking");
}));
await check("anon still cannot read booking_requests directly", () => asAnon(async () => {
  const r = await db.query("select id from public.booking_requests");
  if (r.rows.length) throw new Error(`${r.rows.length} rows readable`);
}));

console.log(`\n${"=".repeat(52)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(52)}`);
process.exit(fail ? 1 : 0);

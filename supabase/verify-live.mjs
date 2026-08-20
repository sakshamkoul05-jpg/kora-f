/**
 * Verifies a LIVE Supabase project — the half that schema.test.mjs cannot
 * reach, because PGlite runs as superuser and superusers bypass row security.
 *
 * This runs as the anon role over real HTTP, so it proves the thing that
 * actually matters: that a stranger with the publishable key can submit a
 * booking request and can never read one back.
 *
 *   node supabase/verify-live.mjs           read-only checks
 *   node supabase/verify-live.mjs --write   also submits one test request
 *
 * --write leaves a real row behind, clearly named so you can delete it from
 * /admin. It is opt-in for that reason.
 */
import { readFileSync } from "node:fs";

const envPath = new URL("../.env.local", import.meta.url);
let env;
try {
  env = Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
  );
} catch {
  console.error("No .env.local found. Copy .env.example and fill it in.");
  process.exit(1);
}

const BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!BASE || !KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY missing from .env.local");
  process.exit(1);
}

// Credentials go in headers. Never in the URL — query strings end up in logs.
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

let pass = 0, fail = 0;
const ok = (m) => { console.log(`  PASS  ${m}`); pass++; };
const no = (m, d) => { console.log(`  FAIL  ${m}\n        ${d}`); fail++; };

const req = async (path, init = {}) => {
  const r = await fetch(`${BASE}${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  const text = await r.text();
  let json; try { json = JSON.parse(text); } catch { json = null; }
  return { status: r.status, text, json };
};

console.log(`\nVerifying ${BASE}\n`);

// --- Schema present --------------------------------------------------------
console.log("Schema");
const rooms = await req("/rest/v1/rooms?select=slug,name,room_number&order=sort_order");
if (rooms.status === 404) {
  console.log("  FAIL  the schema has not been created yet");
  console.log("        Run supabase/setup.sql in the SQL editor first.");
  process.exit(1);
}
if (rooms.status === 200 && Array.isArray(rooms.json) && rooms.json.length === 6) {
  ok(`six rooms readable by anon (${rooms.json.map((r) => r.slug).join(", ")})`);
} else {
  no("rooms readable by anon", `${rooms.status} ${rooms.text.slice(0, 200)}`);
}

// --- The security property -------------------------------------------------
console.log("\nRow Level Security (the check PGlite cannot do)");
const leak = await req("/rest/v1/booking_requests?select=id,guest_name,guest_email");
if (leak.status === 200 && Array.isArray(leak.json) && leak.json.length === 0) {
  ok("anon reads booking_requests: 0 rows — guest data is not exposed");
} else if (leak.status === 401 || leak.status === 403) {
  ok(`anon reads booking_requests: denied (${leak.status})`);
} else if (leak.status === 200 && leak.json?.length) {
  no("ANON CAN READ GUEST DATA", `${leak.json.length} rows returned — RLS is not protecting this table. Check that 20260819120100_rls.sql ran.`);
} else {
  no("anon read of booking_requests", `${leak.status} ${leak.text.slice(0, 200)}`);
}

const staffLeak = await req("/rest/v1/staff?select=email");
if (staffLeak.status === 200 && staffLeak.json?.length) {
  no("anon can read the staff list", `${staffLeak.json.length} rows`);
} else ok("anon cannot read the staff allow-list");

// --- Availability ----------------------------------------------------------
console.log("\nAvailability");
const avail = await req("/rest/v1/rpc/room_availability", {
  method: "POST",
  body: JSON.stringify({ from_date: "2026-12-01", to_date: "2026-12-03" }),
});
if (avail.status === 200 && Array.isArray(avail.json) && avail.json.length === 6) {
  const free = avail.json.filter((r) => r.is_available).length;
  ok(`room_availability() callable by anon — ${free}/6 free on 1–3 Dec 2026`);
} else {
  no("room_availability() callable by anon", `${avail.status} ${avail.text.slice(0, 200)}`);
}

// --- Write path ------------------------------------------------------------
if (process.argv.includes("--write")) {
  console.log("\nSubmitting a test request (--write)");
  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");

  // The production path: the SECURITY DEFINER RPC, not a direct insert.
  const rpc = await req("/rest/v1/rpc/submit_booking_request", {
    method: "POST",
    body: JSON.stringify({
      p_check_in: "2027-11-02", p_check_out: "2027-11-05",
      p_adults: 2, p_children: 0,
      p_guest_name: `DELETE ME — automated test ${stamp}`,
      p_guest_email: "verify@example.com",
      p_message: "Created by supabase/verify-live.mjs. Safe to delete.",
    }),
  });
  if (rpc.status === 200 && typeof rpc.json === "string" && /^KH-/.test(rpc.json)) {
    ok(`anon may submit via submit_booking_request() — reference ${rpc.json}`);
    console.log("        NOTE: delete this row from /admin when you are done.");
  } else {
    no("anon may submit a booking request", `${rpc.status} ${rpc.text.slice(0, 250)}`);
  }

  // Still refused, and must stay refused — this is what the RPC exists for.
  const direct = await req("/rest/v1/booking_requests", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      check_in: "2027-11-20", check_out: "2027-11-22",
      guest_name: "should not exist", guest_email: "x@example.com",
    }),
  });
  if (direct.status >= 400) ok(`a direct insert asking for the row back is refused (${direct.status})`);
  else no("anon can read a row back from booking_requests", "an anon SELECT policy has been added — remove it");

  // Every call below sends the complete required parameter set. Omitting one
  // makes PostgREST answer 404 PGRST202 ("no function with those parameters"),
  // which looks like a rejection and is not one — an earlier version of this
  // file passed for exactly that wrong reason.
  const base = { p_adults: 2, p_children: 0, p_guest_email: "verify@example.com" };
  const rpcCall = (extra) =>
    req("/rest/v1/rpc/submit_booking_request", {
      method: "POST",
      body: JSON.stringify({ ...base, ...extra }),
    });

  // There is no p_status parameter, so status cannot be smuggled in at all.
  // PostgREST cannot match an overload and refuses before reaching Postgres.
  const craft = await rpcCall({
    p_check_in: "2027-12-01", p_check_out: "2027-12-03",
    p_guest_name: "DELETE ME — self-confirm attempt", p_status: "confirmed",
  });
  if (craft.status === 404 && craft.json?.code === "PGRST202") {
    ok("status='confirmed' cannot be smuggled in — no such parameter exists");
  } else if (craft.status >= 400) {
    ok(`a payload carrying status='confirmed' is rejected (${craft.status})`);
  } else {
    no("SELF-CONFIRM PAYLOAD ACCEPTED", craft.text.slice(0, 200));
  }

  // Past dates must be refused by the database, not merely by the form.
  const past = await rpcCall({
    p_check_in: "2020-01-01", p_check_out: "2020-01-03", p_guest_name: "time traveller",
  });
  if (past.json?.code === "22023" && /past/i.test(past.json?.message ?? "")) {
    ok(`a past check-in is refused by the database ("${past.json.message}")`);
  } else {
    no("past check-in", `expected 22023 'check_in is in the past', got ${past.status} ${past.text.slice(0, 160)}`);
  }

  const backwards = await rpcCall({
    p_check_in: "2028-07-10", p_check_out: "2028-07-08", p_guest_name: "backwards",
  });
  if (backwards.json?.code === "22023") ok(`check_out before check_in is refused ("${backwards.json.message}")`);
  else no("backwards dates", `${backwards.status} ${backwards.text.slice(0, 160)}`);

  const tooLong = await rpcCall({
    p_check_in: "2028-07-01", p_check_out: "2028-12-01", p_guest_name: "very long stay",
  });
  if (tooLong.json?.code === "22023") ok(`a stay beyond 90 nights is refused ("${tooLong.json.message}")`);
  else no("over-long stay", `${tooLong.status} ${tooLong.text.slice(0, 160)}`);
} else {
  console.log("\n(skipping the write test — pass --write to include it)");
}

console.log(`\n${"=".repeat(52)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(52)}\n`);
process.exit(fail ? 1 : 0);

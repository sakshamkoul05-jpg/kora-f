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
  const ins = await req("/rest/v1/booking_requests", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      check_in: "2027-11-02", check_out: "2027-11-05", adults: 2, children: 0,
      guest_name: `DELETE ME — automated test ${stamp}`,
      guest_email: "verify@example.com",
      message: "Created by supabase/verify-live.mjs. Safe to delete.",
    }),
  });
  if (ins.status === 201 && ins.json?.[0]?.reference) {
    ok(`anon may submit a request — reference ${ins.json[0].reference}`);
    if (ins.json[0].status === "pending") ok("it landed as pending, not confirmed");
    else no("status on insert", `expected pending, got ${ins.json[0].status}`);
    console.log("        NOTE: delete this row from /admin when you are done.");
  } else {
    no("anon may submit a booking request", `${ins.status} ${ins.text.slice(0, 250)}`);
  }

  const selfConfirm = await req("/rest/v1/booking_requests", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      check_in: "2027-11-20", check_out: "2027-11-22",
      guest_name: "DELETE ME — self-confirm attempt", guest_email: "attack@example.com",
      status: "confirmed",
    }),
  });
  if (selfConfirm.status === 201 && selfConfirm.json?.[0]?.status === "pending") {
    ok("a crafted 'confirmed' payload is forced back to pending");
    console.log("        NOTE: delete this row too.");
  } else if (selfConfirm.status >= 400) {
    ok(`a crafted 'confirmed' payload is rejected outright (${selfConfirm.status})`);
  } else {
    no("SELF-CONFIRM SUCCEEDED", `status came back as ${selfConfirm.json?.[0]?.status}`);
  }
} else {
  console.log("\n(skipping the write test — pass --write to include it)");
}

console.log(`\n${"=".repeat(52)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(52)}\n`);
process.exit(fail ? 1 : 0);

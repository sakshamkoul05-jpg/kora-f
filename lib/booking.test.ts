import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_NIGHTS,
  bookingRequestSchema,
  fieldErrors,
  nightsBetween,
  parseDate,
  rangesOverlap,
} from "./booking.ts";

/** A valid payload some way in the future, so "in the past" never fires. */
function validPayload(over: Record<string, unknown> = {}) {
  const inDays = (n: number) =>
    new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
  return {
    checkIn: inDays(30),
    checkOut: inDays(34),
    adults: 2,
    children: 0,
    name: "Ananya Rao",
    email: "ananya@example.com",
    phone: "+91 98765 43210",
    country: "India",
    message: "Arriving late.",
    website: "",
    ...over,
  };
}

test("parseDate rejects impossible calendar dates", () => {
  assert.ok(parseDate("2026-02-28"));
  assert.equal(parseDate("2026-02-31"), null, "31 February was accepted");
  assert.equal(parseDate("2026-13-01"), null, "month 13 was accepted");
  assert.equal(parseDate("26-01-01"), null);
  assert.equal(parseDate("not a date"), null);
});

test("parseDate is timezone-safe", () => {
  // Built at UTC midnight, so the day never shifts under a negative offset.
  const d = parseDate("2026-03-01")!;
  assert.equal(d.getUTCDate(), 1);
  assert.equal(d.getUTCMonth(), 2);
});

test("nightsBetween counts nights, not days", () => {
  assert.equal(nightsBetween("2026-03-01", "2026-03-05"), 4);
  assert.equal(nightsBetween("2026-03-01", "2026-03-02"), 1);
  assert.equal(nightsBetween("2026-03-01", "2026-03-01"), 0);
});

// The one that stops a room being sold twice.
test("overlap is half-open: check-out day frees the room", () => {
  // Guest A leaves on the 5th, guest B arrives on the 5th. Not a clash.
  assert.equal(rangesOverlap("2026-03-01", "2026-03-05", "2026-03-05", "2026-03-09"), false);
  // Genuine overlaps
  assert.equal(rangesOverlap("2026-03-01", "2026-03-06", "2026-03-05", "2026-03-09"), true);
  assert.equal(rangesOverlap("2026-03-05", "2026-03-09", "2026-03-01", "2026-03-06"), true);
  // One entirely inside the other
  assert.equal(rangesOverlap("2026-03-01", "2026-03-20", "2026-03-05", "2026-03-06"), true);
  // Identical stays clash
  assert.equal(rangesOverlap("2026-03-01", "2026-03-05", "2026-03-01", "2026-03-05"), true);
  // Adjacent the other way round
  assert.equal(rangesOverlap("2026-03-05", "2026-03-09", "2026-03-01", "2026-03-05"), false);
});

test("accepts a well-formed request", () => {
  const r = bookingRequestSchema.safeParse(validPayload());
  assert.ok(r.success, JSON.stringify(r.success ? {} : r.error.issues));
});

test("rejects check-out on or before check-in", () => {
  const same = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const r = bookingRequestSchema.safeParse(validPayload({ checkIn: same, checkOut: same }));
  assert.equal(r.success, false);
  assert.match(fieldErrors(r.error!).checkOut, /after check-in/i);
});

test("rejects dates in the past", () => {
  const past = new Date(Date.now() - 5 * 86_400_000).toISOString().slice(0, 10);
  const later = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
  const r = bookingRequestSchema.safeParse(validPayload({ checkIn: past, checkOut: later }));
  assert.equal(r.success, false);
  assert.match(fieldErrors(r.error!).checkIn, /already passed/i);
});

test("rejects a stay longer than the cap", () => {
  const start = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const end = new Date(Date.now() + (30 + MAX_NIGHTS + 1) * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const r = bookingRequestSchema.safeParse(validPayload({ checkIn: start, checkOut: end }));
  assert.equal(r.success, false);
});

test("rejects a bad email", () => {
  const r = bookingRequestSchema.safeParse(validPayload({ email: "ananya-at-example" }));
  assert.equal(r.success, false);
  assert.ok(fieldErrors(r.error!).email);
});

test("honeypot: a filled hidden field is rejected", () => {
  const r = bookingRequestSchema.safeParse(validPayload({ website: "http://spam.example" }));
  assert.equal(r.success, false, "bot submission was accepted");
});

test("normalises email to lowercase and trims whitespace", () => {
  const r = bookingRequestSchema.safeParse(
    validPayload({ email: "  Ananya@Example.COM  ", name: "  Ananya Rao  " })
  );
  assert.ok(r.success);
  assert.equal(r.data.email, "ananya@example.com");
  assert.equal(r.data.name, "Ananya Rao");
});

test("guest counts are bounded", () => {
  assert.equal(bookingRequestSchema.safeParse(validPayload({ adults: 0 })).success, false);
  assert.equal(bookingRequestSchema.safeParse(validPayload({ adults: 99 })).success, false);
  assert.equal(bookingRequestSchema.safeParse(validPayload({ children: -1 })).success, false);
});

test("optional fields may be omitted entirely", () => {
  const p = validPayload();
  delete (p as Record<string, unknown>).phone;
  delete (p as Record<string, unknown>).country;
  delete (p as Record<string, unknown>).message;
  delete (p as Record<string, unknown>).website;
  assert.ok(bookingRequestSchema.safeParse(p).success);
});

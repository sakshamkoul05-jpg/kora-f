import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_SETTINGS,
  eachNight,
  formatInr,
  minNightsFor,
  overrideForNight,
  percentOf,
  quoteStay,
  type RateOverride,
} from "./pricing.ts";

const ROOM = "room-1";
const OTHER = "room-2";

const override = (o: Partial<RateOverride>): RateOverride => ({
  roomId: null,
  startsOn: "2027-04-01",
  endsOn: "2027-04-10",
  nightlyRateInr: 4000,
  minNights: null,
  priority: 0,
  label: null,
  ...o,
});

test("percentOf is exact where floats are not", () => {
  // 2400 * 0.125 is 299.99999999999994 in IEEE 754.
  assert.equal(percentOf(2400, 12.5), 300);
  assert.equal(percentOf(10_000, 25), 2500);
  assert.equal(percentOf(0, 25), 0);
  assert.equal(percentOf(9999, 0), 0);
});

test("percentOf rounds half a rupee up, consistently", () => {
  assert.equal(percentOf(10, 25), 3); // 2.5 -> 3
  assert.equal(percentOf(30, 25), 8); // 7.5 -> 8
});

test("eachNight excludes the check-out day", () => {
  assert.deepEqual(eachNight("2027-04-01", "2027-04-04"), [
    "2027-04-01",
    "2027-04-02",
    "2027-04-03",
  ]);
});

test("eachNight crosses a month and a leap day", () => {
  assert.deepEqual(eachNight("2028-02-28", "2028-03-01"), ["2028-02-28", "2028-02-29"]);
});

test("eachNight returns nothing for a reversed or empty range", () => {
  assert.deepEqual(eachNight("2027-04-04", "2027-04-01"), []);
  assert.deepEqual(eachNight("2027-04-04", "2027-04-04"), []);
});

test("a stay with no rate anywhere is on request, not free", () => {
  const q = quoteStay({ roomId: ROOM, baseRateInr: null, checkIn: "2027-04-01", checkOut: "2027-04-04" });
  assert.equal(q.kind, "on-request");
  if (q.kind === "on-request") assert.equal(q.nightCount, 3);
});

test("ONE unpriced night makes the whole stay on request", () => {
  // The override covers the 1st and 2nd; the 3rd falls back to a null base.
  const q = quoteStay({
    roomId: ROOM,
    baseRateInr: null,
    checkIn: "2027-04-01",
    checkOut: "2027-04-04",
    overrides: [override({ startsOn: "2027-04-01", endsOn: "2027-04-03", nightlyRateInr: 3000 })],
  });
  assert.equal(q.kind, "on-request", "a partial total would understate the stay");
});

test("a flat-rate stay totals correctly with deposit", () => {
  const q = quoteStay({
    roomId: ROOM,
    baseRateInr: 2500,
    checkIn: "2027-04-01",
    checkOut: "2027-04-04",
  });
  assert.equal(q.kind, "priced");
  if (q.kind !== "priced") return;
  assert.equal(q.nightCount, 3);
  assert.equal(q.subtotalInr, 7500);
  assert.equal(q.taxInr, 0);
  assert.equal(q.totalInr, 7500);
  assert.equal(q.depositInr, 1875); // 25%
  assert.equal(q.balanceInr, 5625);
  assert.equal(q.flatRate, true);
});

test("deposit plus balance always equals the total", () => {
  for (const rate of [999, 1000, 1001, 2333, 7777]) {
    for (const nights of [1, 2, 3, 5, 11]) {
      const checkOut = new Date(Date.UTC(2027, 3, 1 + nights)).toISOString().slice(0, 10);
      const q = quoteStay({ roomId: ROOM, baseRateInr: rate, checkIn: "2027-04-01", checkOut });
      if (q.kind !== "priced") throw new Error("expected a price");
      assert.equal(
        q.depositInr + q.balanceInr,
        q.totalInr,
        `${rate} x ${nights} split does not reconcile`
      );
    }
  }
});

test("tax is applied to the subtotal and included before the deposit", () => {
  const q = quoteStay({
    roomId: ROOM,
    baseRateInr: 5000,
    checkIn: "2027-04-01",
    checkOut: "2027-04-03",
    settings: { ...DEFAULT_SETTINGS, taxPercent: 12, depositPercent: 50 },
  });
  if (q.kind !== "priced") throw new Error("expected a price");
  assert.equal(q.subtotalInr, 10_000);
  assert.equal(q.taxInr, 1200);
  assert.equal(q.totalInr, 11_200);
  assert.equal(q.depositInr, 5600);
});

test("a seasonal override replaces the base rate for the nights it covers", () => {
  const q = quoteStay({
    roomId: ROOM,
    baseRateInr: 2000,
    checkIn: "2027-03-30",
    checkOut: "2027-04-03",
    overrides: [override({ startsOn: "2027-04-01", endsOn: "2027-04-10", nightlyRateInr: 5000, label: "Peak" })],
  });
  if (q.kind !== "priced") throw new Error("expected a price");
  assert.deepEqual(
    q.nights.map((n) => n.rateInr),
    [2000, 2000, 5000, 5000]
  );
  assert.equal(q.subtotalInr, 14_000);
  assert.equal(q.flatRate, false);
  assert.equal(q.nights[2].label, "Peak");
});

test("an override for another room does not touch this one", () => {
  const q = quoteStay({
    roomId: ROOM,
    baseRateInr: 2000,
    checkIn: "2027-04-01",
    checkOut: "2027-04-03",
    overrides: [override({ roomId: OTHER, nightlyRateInr: 9999 })],
  });
  if (q.kind !== "priced") throw new Error("expected a price");
  assert.equal(q.subtotalInr, 4000);
});

test("higher priority wins when overrides overlap", () => {
  const winner = overrideForNight("2027-04-05", ROOM, [
    override({ nightlyRateInr: 4000, priority: 0, label: "Season" }),
    override({ nightlyRateInr: 8000, priority: 10, label: "Festival" }),
  ]);
  assert.equal(winner?.label, "Festival");
});

test("at equal priority a room-specific rule beats a blanket one", () => {
  const winner = overrideForNight("2027-04-05", ROOM, [
    override({ roomId: null, nightlyRateInr: 4000, label: "All rooms" }),
    override({ roomId: ROOM, nightlyRateInr: 6000, label: "This room" }),
  ]);
  assert.equal(winner?.label, "This room");
});

test("override selection does not depend on input order", () => {
  const a = override({ nightlyRateInr: 4000, priority: 0, label: "Season" });
  const b = override({ roomId: ROOM, nightlyRateInr: 6000, priority: 0, label: "This room" });
  const c = override({ nightlyRateInr: 8000, priority: 5, label: "Festival" });
  const orders = [
    [a, b, c],
    [c, b, a],
    [b, a, c],
    [a, c, b],
  ];
  const picks = orders.map((o) => overrideForNight("2027-04-05", ROOM, o)?.label);
  assert.deepEqual(picks, ["Festival", "Festival", "Festival", "Festival"]);
});

test("a stay shorter than the minimum is unbookable, and says so", () => {
  const q = quoteStay({
    roomId: ROOM,
    baseRateInr: 2000,
    checkIn: "2027-04-01",
    checkOut: "2027-04-02",
    overrides: [override({ minNights: 3, label: "Peak" })],
  });
  assert.equal(q.kind, "unbookable");
  if (q.kind === "unbookable") {
    assert.equal(q.minNights, 3);
    assert.match(q.reason, /3 nights/);
  }
});

test("the strictest minimum across the stay is the one that applies", () => {
  const min = minNightsFor("2027-04-01", "2027-04-06", ROOM, [
    override({ startsOn: "2027-04-01", endsOn: "2027-04-03", minNights: 2 }),
    override({ startsOn: "2027-04-03", endsOn: "2027-04-08", minNights: 5 }),
  ], DEFAULT_SETTINGS);
  assert.equal(min, 5);
});

test("check-out before check-in is unbookable, not a negative price", () => {
  const q = quoteStay({ roomId: ROOM, baseRateInr: 2000, checkIn: "2027-04-05", checkOut: "2027-04-01" });
  assert.equal(q.kind, "unbookable");
});

test("formatInr groups in the Indian style", () => {
  assert.equal(formatInr(999), "₹999");
  assert.equal(formatInr(1000), "₹1,000");
  assert.equal(formatInr(100_000), "₹1,00,000");
  assert.equal(formatInr(250_000), "₹2,50,000");
  assert.equal(formatInr(10_000_000), "₹1,00,00,000");
});

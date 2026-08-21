import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildMonthGrid,
  daysInMonth,
  monthDates,
  occupancy,
  shiftDate,
  stepMonth,
  type CalendarBooking,
} from "./calendar.ts";

const ROOMS = [
  { id: "r1", name: "Zangskar", number: 1 },
  { id: "r2", name: "Deodar", number: 2 },
];

const booking = (b: Partial<CalendarBooking>): CalendarBooking => ({
  id: "b1",
  reference: "KH-2027-0001",
  roomId: "r1",
  checkIn: "2027-04-10",
  checkOut: "2027-04-13",
  status: "confirmed",
  guestName: "A Guest",
  ...b,
});

const grid = (bookings: CalendarBooking[] = [], blocks: Parameters<typeof buildMonthGrid>[0]["blocks"] = []) =>
  buildMonthGrid({ year: 2027, month: 4, rooms: ROOMS, bookings, blocks });

const cell = (rows: ReturnType<typeof grid>, room: number, day: number) =>
  rows[room].days[day - 1];

test("month length, including February in a leap year", () => {
  assert.equal(daysInMonth(2027, 4), 30);
  assert.equal(daysInMonth(2027, 2), 28);
  assert.equal(daysInMonth(2028, 2), 29);
  assert.equal(daysInMonth(2027, 12), 31);
});

test("monthDates covers the whole month and nothing else", () => {
  const d = monthDates(2027, 4);
  assert.equal(d.length, 30);
  assert.equal(d[0], "2027-04-01");
  assert.equal(d[29], "2027-04-30");
});

test("a confirmed stay fills its nights and NOT the departure day", () => {
  const rows = grid([booking({ checkIn: "2027-04-10", checkOut: "2027-04-13" })]);
  assert.equal(cell(rows, 0, 9).state, "free", "the night before is free");
  assert.equal(cell(rows, 0, 10).state, "confirmed");
  assert.equal(cell(rows, 0, 11).state, "confirmed");
  assert.equal(cell(rows, 0, 12).state, "confirmed");
  assert.equal(
    cell(rows, 0, 13).state,
    "free",
    "the guest leaves on the 13th — that night is sellable"
  );
});

test("arrival and last night are marked, for drawing the run", () => {
  const rows = grid([booking({ checkIn: "2027-04-10", checkOut: "2027-04-13" })]);
  assert.equal(cell(rows, 0, 10).isArrival, true);
  assert.equal(cell(rows, 0, 11).isArrival, false);
  assert.equal(cell(rows, 0, 12).isLastNight, true);
  assert.equal(cell(rows, 0, 11).isLastNight, false);
});

test("a booking only touches its own room", () => {
  const rows = grid([booking({ roomId: "r1" })]);
  assert.equal(cell(rows, 0, 11).state, "confirmed");
  assert.equal(cell(rows, 1, 11).state, "free");
});

test("an accepted stay shows as held, not confirmed", () => {
  const rows = grid([booking({ status: "accepted" })]);
  assert.equal(cell(rows, 0, 11).state, "held");
});

test("declined, cancelled and expired do not occupy anything", () => {
  for (const status of ["declined", "cancelled", "expired"]) {
    const rows = grid([booking({ status })]);
    assert.equal(cell(rows, 0, 11).state, "free", `${status} should not fill a night`);
  }
});

test("pending requests are counted, not treated as occupancy", () => {
  const rows = grid([
    booking({ id: "p1", status: "pending" }),
    booking({ id: "p2", status: "pending" }),
  ]);
  const c = cell(rows, 0, 11);
  assert.equal(c.state, "pending");
  assert.equal(c.pendingCount, 2, "several people may ask for the same nights");
  assert.equal(c.bookingId, null, "a pending request is not attached as the booking");
});

test("a confirmed stay outranks pending requests on the same night", () => {
  const rows = grid([
    booking({ id: "p1", status: "pending" }),
    booking({ id: "c1", status: "confirmed" }),
  ]);
  const c = cell(rows, 0, 11);
  assert.equal(c.state, "confirmed");
  assert.equal(c.pendingCount, 1, "the pending one is still counted underneath");
});

test("a block closes a room, and a null room closes every room", () => {
  const oneRoom = grid([], [{ roomId: "r1", startsOn: "2027-04-05", endsOn: "2027-04-08", reason: "repairs" }]);
  assert.equal(cell(oneRoom, 0, 6).state, "blocked");
  assert.equal(cell(oneRoom, 1, 6).state, "free");

  const wholeHouse = grid([], [{ roomId: null, startsOn: "2027-04-05", endsOn: "2027-04-08", reason: "closed" }]);
  assert.equal(cell(wholeHouse, 0, 6).state, "blocked");
  assert.equal(cell(wholeHouse, 1, 6).state, "blocked");
});

test("a confirmed booking still shows through a block", () => {
  // A double-booked-looking night is information the host needs, not something
  // to hide behind the block.
  const rows = grid(
    [booking({ checkIn: "2027-04-05", checkOut: "2027-04-08" })],
    [{ roomId: "r1", startsOn: "2027-04-05", endsOn: "2027-04-08", reason: "repairs" }]
  );
  assert.equal(cell(rows, 0, 6).state, "confirmed");
});

test("a stay spilling in from the previous month fills from day one", () => {
  const rows = grid([booking({ checkIn: "2027-03-28", checkOut: "2027-04-03" })]);
  assert.equal(cell(rows, 0, 1).state, "confirmed");
  assert.equal(cell(rows, 0, 1).isArrival, false, "it did not start this month");
  assert.equal(cell(rows, 0, 2).state, "confirmed");
  assert.equal(cell(rows, 0, 3).state, "free");
});

test("a stay running past month end fills to the last day", () => {
  const rows = grid([booking({ checkIn: "2027-04-29", checkOut: "2027-05-04" })]);
  assert.equal(cell(rows, 0, 29).state, "confirmed");
  assert.equal(cell(rows, 0, 30).state, "confirmed");
  assert.equal(cell(rows, 0, 30).isLastNight, false, "it ends in May, not here");
});

test("a booking with no room assigned occupies nothing", () => {
  const rows = grid([booking({ roomId: null })]);
  assert.equal(cell(rows, 0, 11).state, "free");
  assert.equal(cell(rows, 1, 11).state, "free");
});

test("stepMonth wraps the year in both directions", () => {
  assert.deepEqual(stepMonth(2027, 12, 1), { year: 2028, month: 1 });
  assert.deepEqual(stepMonth(2027, 1, -1), { year: 2026, month: 12 });
  assert.deepEqual(stepMonth(2027, 6, 0), { year: 2027, month: 6 });
  assert.deepEqual(stepMonth(2027, 1, -13), { year: 2025, month: 12 });
});

test("shiftDate crosses month and year boundaries", () => {
  assert.equal(shiftDate("2027-04-30", 1), "2027-05-01");
  assert.equal(shiftDate("2027-01-01", -1), "2026-12-31");
  assert.equal(shiftDate("2028-02-28", 1), "2028-02-29");
});

test("occupancy counts held and confirmed nights only", () => {
  const rows = grid([
    booking({ id: "a", checkIn: "2027-04-01", checkOut: "2027-04-04", status: "confirmed" }),
    booking({ id: "b", roomId: "r2", checkIn: "2027-04-01", checkOut: "2027-04-03", status: "accepted" }),
    booking({ id: "c", roomId: "r2", checkIn: "2027-04-20", checkOut: "2027-04-25", status: "pending" }),
  ]);
  const o = occupancy(rows);
  assert.equal(o.total, 60, "2 rooms x 30 nights");
  assert.equal(o.sold, 5, "3 confirmed nights + 2 held; pending sells nothing");
  assert.equal(o.percent, 8);
});

test("an empty month is 0% and does not divide by zero", () => {
  assert.deepEqual(occupancy([]), { sold: 0, total: 0, percent: 0 });
});

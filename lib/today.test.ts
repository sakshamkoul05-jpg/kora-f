import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDayBoard, todayInIndia, type StayLike } from "./today.ts";

const stay = (s: Partial<StayLike>): StayLike => ({
  id: "s1",
  reference: "KH-2027-0001",
  status: "confirmed",
  checkIn: "2027-05-10",
  checkOut: "2027-05-13",
  guestName: "A Guest",
  guestPhone: null,
  adults: 2,
  children: 0,
  roomId: "r1",
  roomName: "Zangskar",
  ...s,
});

const TODAY = "2027-05-10";

test("someone arriving today is arriving, and is in the house tonight", () => {
  const b = buildDayBoard([stay({ checkIn: "2027-05-10", checkOut: "2027-05-13" })], TODAY);
  assert.equal(b.arriving.length, 1);
  assert.equal(b.staying.length, 1, "they sleep here tonight");
  assert.equal(b.departing.length, 0);
});

test("someone leaving today is departing, and is NOT in the house tonight", () => {
  const b = buildDayBoard([stay({ checkIn: "2027-05-07", checkOut: "2027-05-10" })], TODAY);
  assert.equal(b.departing.length, 1);
  assert.equal(b.staying.length, 0, "the room is free tonight");
  assert.equal(b.arriving.length, 0);
});

test("someone mid-stay is only staying", () => {
  const b = buildDayBoard([stay({ checkIn: "2027-05-08", checkOut: "2027-05-14" })], TODAY);
  assert.equal(b.staying.length, 1);
  assert.equal(b.arriving.length, 0);
  assert.equal(b.departing.length, 0);
});

test("a stay entirely in the past or future shows nowhere", () => {
  const past = buildDayBoard([stay({ checkIn: "2027-05-01", checkOut: "2027-05-04" })], TODAY);
  const future = buildDayBoard([stay({ checkIn: "2027-05-20", checkOut: "2027-05-24" })], TODAY);
  for (const b of [past, future]) {
    assert.equal(b.arriving.length + b.departing.length + b.staying.length, 0);
  }
});

test("a one-night stay both arrives and departs across two days", () => {
  const s = stay({ checkIn: "2027-05-10", checkOut: "2027-05-11" });
  const day1 = buildDayBoard([s], "2027-05-10");
  assert.equal(day1.arriving.length, 1);
  assert.equal(day1.staying.length, 1);
  assert.equal(day1.departing.length, 0);

  const day2 = buildDayBoard([s], "2027-05-11");
  assert.equal(day2.departing.length, 1);
  assert.equal(day2.staying.length, 0);
});

test("a turnaround is flagged when a room empties and refills the same day", () => {
  const b = buildDayBoard(
    [
      stay({ id: "out", checkIn: "2027-05-07", checkOut: "2027-05-10", guestName: "Leaving" }),
      stay({ id: "in", checkIn: "2027-05-10", checkOut: "2027-05-12", guestName: "Arriving" }),
    ],
    TODAY
  );
  assert.equal(b.turnarounds.length, 1);
  assert.equal(b.turnarounds[0].out.guestName, "Leaving");
  assert.equal(b.turnarounds[0].in.guestName, "Arriving");
  assert.equal(b.turnarounds[0].roomName, "Zangskar");
});

test("a departure and an arrival in DIFFERENT rooms is not a turnaround", () => {
  const b = buildDayBoard(
    [
      stay({ id: "out", roomId: "r1", checkIn: "2027-05-07", checkOut: "2027-05-10" }),
      stay({ id: "in", roomId: "r2", roomName: "Deodar", checkIn: "2027-05-10", checkOut: "2027-05-12" }),
    ],
    TODAY
  );
  assert.equal(b.turnarounds.length, 0);
});

test("a room-less booking never produces a turnaround", () => {
  const b = buildDayBoard(
    [
      stay({ id: "out", roomId: null, roomName: null, checkIn: "2027-05-07", checkOut: "2027-05-10" }),
      stay({ id: "in", roomId: null, roomName: null, checkIn: "2027-05-10", checkOut: "2027-05-12" }),
    ],
    TODAY
  );
  assert.equal(b.turnarounds.length, 0);
});

test("only committed stays appear — a pending request is not a guest", () => {
  const b = buildDayBoard(
    [
      stay({ id: "p", status: "pending" }),
      stay({ id: "d", status: "declined" }),
      stay({ id: "x", status: "expired" }),
      stay({ id: "c", status: "cancelled" }),
    ],
    TODAY
  );
  assert.equal(b.arriving.length, 0, "nobody here has actually booked");
  assert.equal(b.staying.length, 0);
});

test("an accepted stay counts — the room is held and they are expected", () => {
  const b = buildDayBoard([stay({ status: "accepted" })], TODAY);
  assert.equal(b.arriving.length, 1);
});

test("lists are ordered by room so the board reads like the building", () => {
  const b = buildDayBoard(
    [
      stay({ id: "a", roomName: "Mani", guestName: "Zoe" }),
      stay({ id: "b", roomName: "Chorten", guestName: "Adam" }),
      stay({ id: "c", roomName: "Chorten", guestName: "Bea" }),
    ],
    TODAY
  );
  assert.deepEqual(b.arriving.map((s) => `${s.roomName}/${s.guestName}`), [
    "Chorten/Adam",
    "Chorten/Bea",
    "Mani/Zoe",
  ]);
});

test("todayInIndia is the date in McLeodganj, not the server's", () => {
  // 20:00 UTC on the 9th is already 01:30 on the 10th in India.
  assert.equal(todayInIndia(new Date("2027-05-09T20:00:00Z")), "2027-05-10");
  // 18:00 UTC is 23:30 the same day.
  assert.equal(todayInIndia(new Date("2027-05-09T18:00:00Z")), "2027-05-09");
});

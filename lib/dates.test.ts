import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatDate,
  formatDateLong,
  formatNight,
  formatRange,
  guestsLabel,
  nightsLabel,
} from "./dates.ts";

test("formatDate reads as a person would write it", () => {
  assert.equal(formatDate("2027-04-01"), "1 Apr 2027");
  assert.equal(formatDate("2027-12-25"), "25 Dec 2027");
});

test("formatNight carries the weekday, which is what a guest is checking", () => {
  // 1 April 2027 is a Thursday.
  assert.equal(formatNight("2027-04-01"), "Thu 1 Apr");
  assert.equal(formatNight("2027-04-04"), "Sun 4 Apr");
});

test("formatDateLong spells everything out", () => {
  assert.equal(formatDateLong("2027-04-01"), "Thursday 1 April 2027");
});

test("a range within one month states the month once", () => {
  assert.equal(formatRange("2027-04-01", "2027-04-04"), "1 – 4 April 2027");
});

test("a range across months keeps both, and the year once", () => {
  assert.equal(formatRange("2027-04-28", "2027-05-02"), "28 April – 2 May 2027");
});

test("a range across new year keeps both years", () => {
  assert.equal(formatRange("2027-12-28", "2028-01-02"), "28 Dec 2027 – 2 Jan 2028");
});

test("dates never shift by a timezone", () => {
  // The bug this guards: parsing as local time turns 1 April into 31 March
  // for anyone east of UTC. Every formatter must read UTC fields.
  assert.equal(formatDate("2027-01-01"), "1 Jan 2027");
  assert.equal(formatDate("2027-12-31"), "31 Dec 2027");
});

test("a leap day formats correctly", () => {
  assert.equal(formatDate("2028-02-29"), "29 Feb 2028");
  assert.equal(formatNight("2028-02-29"), "Tue 29 Feb");
});

test("unparseable input yields an empty string, never 'Invalid Date'", () => {
  assert.equal(formatDate("not-a-date"), "");
  assert.equal(formatDate("2027-02-31"), "");
  assert.equal(formatRange("2027-04-01", "nope"), "");
  assert.equal(formatNight(""), "");
});

test("nightsLabel pluralises", () => {
  assert.equal(nightsLabel(1), "1 night");
  assert.equal(nightsLabel(3), "3 nights");
});

test("guestsLabel never says '1 childs' or trails a zero", () => {
  assert.equal(guestsLabel(2, 0), "2 adults");
  assert.equal(guestsLabel(1, 0), "1 adult");
  assert.equal(guestsLabel(2, 1), "2 adults, 1 child");
  assert.equal(guestsLabel(2, 3), "2 adults, 3 children");
});

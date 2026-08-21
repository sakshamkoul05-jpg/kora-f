import assert from "node:assert/strict";
import { test } from "node:test";
import { phaseForInstant } from "./daylight.ts";

/** A UTC instant, so the test says nothing about where it is being run. */
const utc = (h: number, m = 0) => new Date(Date.UTC(2027, 3, 1, h, m));

test("phase follows McLeodganj time, not the machine's timezone", () => {
  // 06:00 UTC is 11:30 IST — the middle of the day there.
  assert.equal(phaseForInstant(utc(6)), "day");
  // 20:00 UTC is 01:30 IST — night there, evening in London.
  assert.equal(phaseForInstant(utc(20)), "night");
});

test("each boundary lands on the right side", () => {
  // IST = UTC + 5:30, so subtract 5:30 to get the UTC instant.
  assert.equal(phaseForInstant(utc(23, 29)), "night", "04:59 IST");
  assert.equal(phaseForInstant(utc(23, 30)), "dawn", "05:00 IST");
  assert.equal(phaseForInstant(utc(2, 29)), "dawn", "07:59 IST");
  assert.equal(phaseForInstant(utc(2, 30)), "day", "08:00 IST");
  assert.equal(phaseForInstant(utc(11, 29)), "day", "16:59 IST");
  assert.equal(phaseForInstant(utc(11, 30)), "dusk", "17:00 IST");
  assert.equal(phaseForInstant(utc(14, 29)), "dusk", "19:59 IST");
  assert.equal(phaseForInstant(utc(14, 30)), "night", "20:00 IST");
});

test("wrapping past midnight UTC does not produce a gap", () => {
  // The offset pushes IST past 24:00; the modulo has to bring it back.
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const p = phaseForInstant(utc(h, m));
      assert.ok(
        ["dawn", "day", "dusk", "night"].includes(p),
        `no phase for ${h}:${m} UTC — got ${p}`
      );
    }
  }
});

test("every phase is reachable across a day", () => {
  const seen = new Set<string>();
  for (let h = 0; h < 24; h++) seen.add(phaseForInstant(utc(h)));
  assert.deepEqual([...seen].sort(), ["dawn", "day", "dusk", "night"]);
});

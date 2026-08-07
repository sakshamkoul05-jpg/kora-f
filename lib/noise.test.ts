import assert from "node:assert/strict";
import test from "node:test";
import { makeNoise } from "./noise.ts";

test("stays within 0..1", () => {
  const n = makeNoise(8, 3, 2);
  for (let t = 0; t < 200; t += 0.037) {
    const v = n(t);
    assert.ok(v >= 0 && v <= 1, `noise left the unit range at t=${t}: ${v}`);
  }
});

test("loops over its period, so it can run indefinitely without drift", () => {
  const period = 8;
  const n = makeNoise(period, 5, 2);
  for (let t = 0; t < period; t += 0.25) {
    assert.ok(
      Math.abs(n(t) - n(t + period)) < 1e-9,
      `not periodic at t=${t}: ${n(t)} vs ${n(t + period)}`
    );
  }
});

test("is continuous — no visible jumps between frames", () => {
  const n = makeNoise(8, 7, 2);
  const dt = 1 / 60;
  let maxJump = 0;
  for (let t = 0; t < 40; t += dt) {
    maxJump = Math.max(maxJump, Math.abs(n(t + dt) - n(t)));
  }
  assert.ok(maxJump < 0.08, `noise jumped ${maxJump.toFixed(3)} in one frame — would read as a stutter`);
});

// The point of using noise at all.
test("is not a sine — gusts are irregular, not periodic", () => {
  const n = makeNoise(8, 11, 2);
  // Compare successive peaks: a sine has evenly spaced, equal-height peaks.
  const peaks: { t: number; v: number }[] = [];
  let prev = n(0);
  let rising = true;
  for (let t = 0.01; t < 24; t += 0.01) {
    const v = n(t);
    if (rising && v < prev) {
      peaks.push({ t, v: prev });
      rising = false;
    } else if (!rising && v > prev) {
      rising = true;
    }
    prev = v;
  }
  assert.ok(peaks.length >= 4, `expected several peaks, found ${peaks.length}`);

  const heights = peaks.map((p) => p.v);
  const spread = Math.max(...heights) - Math.min(...heights);
  assert.ok(spread > 0.08, `peak heights varied by only ${spread.toFixed(3)} — too regular, reads as machinery`);
});

test("different seeds never fall into sync", () => {
  const a = makeNoise(8, 1, 2);
  const b = makeNoise(8, 2, 2);
  let identical = 0;
  for (let t = 0; t < 40; t += 0.1) {
    if (Math.abs(a(t) - b(t)) < 1e-6) identical++;
  }
  assert.ok(identical < 5, `two seeds tracked each other at ${identical} sample points`);
});

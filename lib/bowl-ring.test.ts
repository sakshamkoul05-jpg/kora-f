import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RING_COUNT,
  RING_LIFE,
  RING_STAGGER,
  STRIKE_DURATION,
  reachFrom,
  ringOpacity,
  ringProgress,
  ringRadius,
} from "./bowl-ring.ts";

test("a ring has not left the strike point before its turn", () => {
  assert.equal(ringProgress(0, 0), 0);
  assert.equal(ringProgress(RING_STAGGER - 1, 1), 0);
  assert.equal(ringProgress(0, 2), 0);
});

test("progress is clamped to 0..1 at every input, including absurd ones", () => {
  for (const t of [-9999, -1, 0, 1, 500, RING_LIFE, RING_LIFE * 10, 1e9]) {
    for (let i = 0; i < RING_COUNT; i++) {
      const p = ringProgress(t, i);
      assert.ok(p >= 0 && p <= 1, `progress ${p} out of range at t=${t}, ring ${i}`);
    }
  }
});

test("progress never goes backwards as time moves forward", () => {
  for (let i = 0; i < RING_COUNT; i++) {
    let previous = -1;
    for (let t = 0; t <= STRIKE_DURATION + 200; t += 16) {
      const p = ringProgress(t, i);
      assert.ok(p >= previous, `ring ${i} went backwards at ${t}ms`);
      previous = p;
    }
  }
});

test("rings decelerate — a bowl, not a splash", () => {
  // Cubic ease-out: the first half of the life covers well over half the
  // distance. Constant speed would put it at exactly 0.5.
  const halfway = ringProgress(RING_LIFE / 2, 0);
  assert.ok(halfway > 0.8, `expected strong deceleration, got ${halfway}`);
});

test("every ring is silent at both ends", () => {
  for (let i = 0; i < RING_COUNT; i++) {
    assert.equal(ringOpacity(0, i), 0);
    assert.equal(ringOpacity(1, i), 0);
  }
});

test("opacity is never negative, whatever the ring index", () => {
  for (let i = 0; i < RING_COUNT + 3; i++) {
    for (let p = 0; p <= 1; p += 0.02) {
      assert.ok(ringOpacity(p, i) >= 0, `negative opacity at ring ${i}, p=${p}`);
    }
  }
});

test("later rings are quieter, like overtones", () => {
  const at = (i: number) => ringOpacity(0.3, i);
  assert.ok(at(0) > at(1), "second ring should be quieter than the first");
  assert.ok(at(1) > at(2), "third ring should be quieter than the second");
});

test("the whole strike is silent once it is over", () => {
  for (let i = 0; i < RING_COUNT; i++) {
    assert.equal(ringOpacity(ringProgress(STRIKE_DURATION + 1, i), i), 0);
  }
});

test("radius grows from nothing to the full reach", () => {
  assert.equal(ringRadius(0, 200), 0);
  assert.equal(ringRadius(1, 200), 200);
  assert.ok(ringRadius(0.5, 200) > 0 && ringRadius(0.5, 200) < 200);
});

test("reach is the distance to the furthest corner", () => {
  // Struck dead centre of a 100x100 box: half the diagonal.
  assert.equal(Math.round(reachFrom(50, 50, 100, 100)), 71);
  // Struck in a corner: the full diagonal, so the rings still clear the box.
  assert.equal(Math.round(reachFrom(0, 0, 100, 100)), 141);
  assert.equal(Math.round(reachFrom(100, 100, 100, 100)), 141);
});

test("a strike outside the element still produces a finite reach", () => {
  // Defensive: pointer coordinates can land outside on a fast drag.
  const r = reachFrom(-40, 130, 100, 40);
  assert.ok(Number.isFinite(r) && r > 0);
});

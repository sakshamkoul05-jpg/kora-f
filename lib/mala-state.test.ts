import assert from "node:assert/strict";
import test from "node:test";
import { completeTurn, initialRailState, railTransition, type RailState } from "./mala-state.ts";

const LAST = 5; // six sections

test("advances outward without changing pass", () => {
  let s = initialRailState;
  for (let i = 1; i < LAST; i++) {
    const t = railTransition(s, i, LAST);
    s = t.state;
    assert.equal(s.active, i);
    assert.equal(s.pass, "outward", `pass flipped early at index ${i}`);
    assert.equal(t.scheduleTurn, false);
  }
});

test("pauses at the guru bead, then reverses", () => {
  let s: RailState = { active: LAST - 1, pass: "outward", turning: false };
  const t = railTransition(s, LAST, LAST);
  assert.equal(t.scheduleTurn, true, "should schedule the guru-bead pause");
  assert.equal(t.state.turning, true, "should be visibly turning during the pause");
  assert.equal(t.state.pass, "outward", "pass must not flip until the pause elapses");

  s = completeTurn(t.state);
  assert.equal(s.pass, "return");
  assert.equal(s.turning, false);
});

test("returns along the strand and starts a fresh circuit at the origin", () => {
  let s: RailState = { active: LAST, pass: "return", turning: false };
  for (let i = LAST - 1; i > 0; i--) {
    s = railTransition(s, i, LAST).state;
    assert.equal(s.pass, "return", `pass flipped early on the return at ${i}`);
  }
  s = railTransition(s, 0, LAST).state;
  assert.equal(s.active, 0);
  assert.equal(s.pass, "outward", "reaching the origin should begin a new circuit");
});

// The one that matters.
test("NEVER wraps: the guru bead is not crossed in either direction", () => {
  let s = initialRailState;
  const visited: number[] = [s.active];

  // Two full circuits, driven the way scrolling actually drives it.
  const script = [1, 2, 3, 4, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5];
  for (const idx of script) {
    const t = railTransition(s, idx, LAST);
    s = t.state;
    if (t.scheduleTurn) s = completeTurn(s);
    visited.push(s.active);
  }

  for (let i = 1; i < visited.length; i++) {
    const from = visited[i - 1];
    const to = visited[i];
    const wrapped = (from === LAST && to === 0) || (from === 0 && to === LAST);
    assert.equal(wrapped, false, `strand wrapped ${from} -> ${to}; the guru bead was crossed`);
    assert.ok(Math.abs(to - from) <= 1, `strand jumped ${from} -> ${to} instead of stepping`);
  }
});

test("re-entering the same section is a no-op", () => {
  const s: RailState = { active: 3, pass: "outward", turning: false };
  const t = railTransition(s, 3, LAST);
  assert.equal(t.state, s, "identical index should not produce a new state");
  assert.equal(t.scheduleTurn, false);
});

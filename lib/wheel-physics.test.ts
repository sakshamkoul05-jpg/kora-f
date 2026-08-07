import assert from "node:assert/strict";
import test from "node:test";
import {
  ANTICLOCKWISE_RESISTANCE,
  MAX_OMEGA,
  REST_OMEGA,
  clampSpin,
  decayOmega,
  resolveDrag,
  timeToRest,
} from "./wheel-physics.ts";

test("a firm spin coasts for several seconds", () => {
  const t = timeToRest(900);
  assert.ok(t > 3, `firm spin rested after only ${t.toFixed(2)}s — too abrupt`);
  assert.ok(t < 8, `firm spin took ${t.toFixed(2)}s — it should not drift forever`);
});

test("a light nudge settles quickly", () => {
  const t = timeToRest(120);
  assert.ok(t > 0.5 && t < 4, `light nudge rested after ${t.toFixed(2)}s`);
});

test("the drum actually reaches rest, so the loop can stop", () => {
  let omega = MAX_OMEGA;
  let elapsed = 0;
  const dt = 1 / 60;
  let frames = 0;
  while (omega >= REST_OMEGA && frames < 60 * 60) {
    omega = decayOmega(omega, dt);
    elapsed += dt;
    frames++;
  }
  assert.ok(omega < REST_OMEGA, "never fell below the rest threshold — would idle-spin forever");
  assert.ok(elapsed < 10, `took ${elapsed.toFixed(2)}s to rest from max velocity`);
});

// The one that matters.
test("CLOCKWISE ONLY: negative velocity is never imparted", () => {
  for (const v of [-2000, -900, -50, -1, -0.001]) {
    assert.equal(clampSpin(v), 0, `anticlockwise velocity ${v} was allowed through`);
  }
  assert.equal(clampSpin(700), 700);
  assert.equal(clampSpin(99999), MAX_OMEGA, "velocity should be clamped at the ceiling");
});

test("decay never flips the direction of rotation", () => {
  let omega = 1200;
  for (let i = 0; i < 600; i++) {
    omega = decayOmega(omega, 1 / 60);
    assert.ok(omega >= 0, `friction drove omega negative (${omega})`);
  }
});

test("dragging anticlockwise of the gesture origin is resisted", () => {
  // Pulling back past where the drag started.
  const resisted = resolveDrag(-10, 0, 0);
  assert.equal(resisted, -10 * ANTICLOCKWISE_RESISTANCE);
  assert.ok(Math.abs(resisted) < 10, "anticlockwise drag was not damped");

  // Clockwise motion passes through untouched.
  assert.equal(resolveDrag(10, 0, 0), 10);

  // Unwinding slack that is still clockwise of the origin is not resisted.
  assert.equal(resolveDrag(-5, 40, 0), -5);
});

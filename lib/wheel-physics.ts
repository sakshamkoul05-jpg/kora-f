/**
 * Prayer wheel physics, extracted so the constraints the brief cares about can
 * be tested rather than asserted: that a firm spin coasts for several seconds,
 * that the drum actually comes to rest (so the rAF loop can stop), and that it
 * only ever turns clockwise.
 *
 * See lib/wheel-physics.test.ts.
 */

export const DECAY = 0.9; // exponential friction, per second
export const REST_OMEGA = 8; // deg/s below which the drum is at rest
export const MAX_OMEGA = 1500; // deg/s
export const ANTICLOCKWISE_RESISTANCE = 0.22;

/** One integration step of angular velocity under friction. */
export function decayOmega(omega: number, dt: number): number {
  return omega * Math.exp(-DECAY * dt);
}

/** Seconds for a spin to fall below the rest threshold. */
export function timeToRest(omega0: number): number {
  if (omega0 <= REST_OMEGA) return 0;
  return Math.log(omega0 / REST_OMEGA) / DECAY;
}

/**
 * CLOCKWISE ONLY. Negative velocity is never imparted — the wheel cannot be
 * made to spin backwards, whatever the gesture. This is a correctness rule.
 */
export function clampSpin(velocity: number): number {
  return Math.min(Math.max(velocity, 0), MAX_OMEGA);
}

/**
 * Resolve a drag increment. Motion that would carry the drum anticlockwise of
 * where the gesture began meets heavy resistance; it is damped, not blocked,
 * so the drum feels sprung rather than stuck.
 */
export function resolveDrag(delta: number, angle: number, dragStartAngle: number): number {
  return angle + delta < dragStartAngle ? delta * ANTICLOCKWISE_RESISTANCE : delta;
}

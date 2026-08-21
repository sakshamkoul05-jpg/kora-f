/**
 * The physics of a struck singing bowl, as far as a ring on a page needs it.
 *
 * Pure, so it can be tested — the rendering that uses it cannot be, because
 * rAF never fires in this environment (see MOTION.md).
 *
 * A struck bowl is not a splash. Its rings leave the point of contact fast,
 * then slow as they widen, and the sound decays smoothly rather than being
 * cut off. Material Design's ripple does the opposite — constant speed, hard
 * stop — which is why it reads as a button press and this should not.
 */

export const RING_COUNT = 3;
/** How long one ring lives, in ms. Long: this is a bowl, not a click. */
export const RING_LIFE = 1600;
/** Gap between successive rings leaving the strike point. */
export const RING_STAGGER = 260;

/** Total time from strike to silence. */
export const STRIKE_DURATION = RING_LIFE + RING_STAGGER * (RING_COUNT - 1);

/**
 * Eased progress of a single ring, 0 → 1.
 *
 * Cubic ease-out: quick away from the strike, slowing as it widens. Clamped at
 * both ends so a ring can never render inside-out or overshoot its radius.
 */
export function ringProgress(elapsedMs: number, index: number): number {
  const local = elapsedMs - index * RING_STAGGER;
  if (local <= 0) return 0;
  if (local >= RING_LIFE) return 1;
  const t = local / RING_LIFE;
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Opacity of a ring at a given progress.
 *
 * Rises fast — the strike is instant — then decays. Later rings are quieter
 * than earlier ones, the way overtones are, so the group reads as one event
 * rather than three separate ones.
 */
export function ringOpacity(progress: number, index: number): number {
  if (progress <= 0 || progress >= 1) return 0;
  const attack = Math.min(1, progress / 0.08);
  const decay = Math.pow(1 - progress, 1.6);
  const overtone = 1 - index * 0.22;
  return Math.max(0, attack * decay * overtone);
}

/** Radius in px at a given progress, from the strike point outward. */
export function ringRadius(progress: number, maxRadius: number): number {
  return progress * maxRadius;
}

/**
 * How far the rings need to travel to leave the element from where it was
 * struck — the distance to the furthest corner. Striking a corner therefore
 * throws wider rings than striking the middle, which is correct: it is the
 * same bowl, hit somewhere else.
 */
export function reachFrom(
  x: number,
  y: number,
  width: number,
  height: number
): number {
  const dx = Math.max(x, width - x);
  const dy = Math.max(y, height - y);
  return Math.sqrt(dx * dx + dy * dy);
}

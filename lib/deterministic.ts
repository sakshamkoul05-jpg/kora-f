/**
 * SSR-safe deterministic pseudo-randomness.
 *
 * Anything that varies "randomly" but is server-rendered has to produce
 * byte-identical output on Node and in the browser. Two traps, both of which
 * have already bitten this codebase once:
 *
 *   - `Math.random()` is obviously non-deterministic.
 *   - `Math.sin`, `Math.atan2` and the other transcendentals are
 *     implementation-defined to the last ULP, so Node and V8-in-Chrome can
 *     legitimately disagree. That produced a real hydration mismatch in the
 *     prayer flags (37.11221408841084 vs 37.11221408849815).
 *
 * So: integer ops only for the hash, and round anything that reaches the DOM.
 */

/** Integer avalanche hash. Math.imul/xor/shift are exact on every engine. */
export function hash(n: number): number {
  let x = n >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 2246822519);
  x ^= x >>> 13;
  x = Math.imul(x, 3266489917);
  x ^= x >>> 16;
  return x >>> 0;
}

/** Deterministic 0..1 from an index and a seed. */
export function jitter(index: number, seed: number): number {
  return hash(Math.imul(index + 1, 73856093) ^ Math.imul(seed + 1, 19349663)) / 4294967296;
}

/** Deterministic value in [min, max). */
export function jitterRange(index: number, seed: number, min: number, max: number): number {
  return min + jitter(index, seed) * (max - min);
}

/** Round to 3dp. Use on every number that ends up in an attribute or style. */
export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

// Explicit .ts specifier so Node's --experimental-strip-types loader can
// resolve this in the unit tests; tsconfig sets allowImportingTsExtensions.
import { hash } from "./deterministic.ts";

/**
 * Small looping value-noise, for wind gusts and flame flicker.
 *
 * Flame and wind are not sine waves. A sine reads as machinery — the eye
 * catches the period immediately. Value noise interpolated with smoothstep
 * gives an irregular signal that never quite repeats within the window the
 * viewer is watching, which is what makes it read as physical.
 *
 * The signal LOOPS over `period` seconds so it can run indefinitely without
 * drifting or accumulating error, and it is seeded, so two elements driven
 * from different seeds never fall into visible sync.
 */
export function makeNoise(period = 8, seed = 1, octaves = 2) {
  const at = (i: number, oct: number) => {
    const wrapped = ((i % period) + period) % period;
    return hash(Math.imul(wrapped + 1, 374761393) ^ Math.imul(seed * (oct + 1) + 1, 668265263)) / 4294967296;
  };

  return (t: number): number => {
    let value = 0;
    let amplitude = 1;
    let total = 0;
    let freq = 1;

    for (let oct = 0; oct < octaves; oct++) {
      const x = t * freq;
      const i = Math.floor(x);
      const f = x - i;
      const u = f * f * (3 - 2 * f); // smoothstep
      const a = at(i, oct);
      const b = at(i + 1, oct);
      value += (a + (b - a) * u) * amplitude;
      total += amplitude;
      amplitude *= 0.5;
      freq *= 2;
    }

    return value / total; // 0..1
  };
}

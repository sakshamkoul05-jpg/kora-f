/**
 * Which part of the day it is in McLeodganj.
 *
 * Pure and separate from the component that applies it, both because that is
 * how everything else behavioural in this codebase is built, and because a
 * .tsx file cannot be imported by `node --experimental-strip-types` — the test
 * runner used here.
 */

export type Phase = "dawn" | "day" | "dusk" | "night";

/** IST is UTC+5:30 all year. India has no daylight saving, so this is exact. */
export const IST_OFFSET_MINUTES = 5 * 60 + 30;

/**
 * Boundaries chosen for the Dhauladhar, not for a generic clock: the range
 * sits at roughly 32°N, where first light is early and the sun drops behind
 * the ridge well before it sets on the plain.
 */
export function phaseForInstant(now: Date): Phase {
  const istMinutes =
    (now.getUTCHours() * 60 + now.getUTCMinutes() + IST_OFFSET_MINUTES) % 1440;
  const hour = istMinutes / 60;

  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}

/** Readable label, for the small line in the footer. */
export function phaseLabel(phase: Phase): string {
  return {
    dawn: "first light in McLeodganj",
    day: "daytime in McLeodganj",
    dusk: "dusk in McLeodganj",
    night: "night in McLeodganj",
  }[phase];
}

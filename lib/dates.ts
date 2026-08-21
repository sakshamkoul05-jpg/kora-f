import { parseDate } from "./booking.ts";

/**
 * Dates, for reading.
 *
 * Formatted by hand rather than through `toLocaleDateString`. That is not
 * pedantry: these strings are rendered on the server and again in the browser,
 * and Intl output can differ between the two — a different ICU build, a
 * different default locale, a narrow no-break space instead of a normal one —
 * and every one of those differences is a hydration mismatch. Building the
 * string from arrays is identical everywhere, always.
 *
 * Everything works in UTC for the same reason the rest of the codebase does: a
 * stay is a pair of calendar dates, not an instant, and running them through a
 * local timezone is how "1 April" becomes "31 March" for a guest in Auckland.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_SHORT = DAYS.map((d) => d.slice(0, 3));

/** `2027-04-01` → `1 Apr 2027`. Empty string for anything unparseable. */
export function formatDate(iso: string): string {
  const d = parseDate(iso);
  if (!d) return "";
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** `2027-04-01` → `Thu 1 Apr`. For per-night lines, where the year is noise. */
export function formatNight(iso: string): string {
  const d = parseDate(iso);
  if (!d) return "";
  return `${DAYS_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

/** `2027-04-01` → `Thursday 1 April 2027`. */
export function formatDateLong(iso: string): string {
  const d = parseDate(iso);
  if (!d) return "";
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * A stay as one phrase, collapsing whatever the two dates share.
 *
 *   1 – 4 April 2027          same month
 *   28 April – 2 May 2027     same year
 *   28 Dec 2027 – 2 Jan 2028  neither
 */
export function formatRange(fromIso: string, toIso: string): string {
  const a = parseDate(fromIso);
  const b = parseDate(toIso);
  if (!a || !b) return "";

  const sameYear = a.getUTCFullYear() === b.getUTCFullYear();
  const sameMonth = sameYear && a.getUTCMonth() === b.getUTCMonth();

  if (sameMonth) {
    return `${a.getUTCDate()} – ${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  }
  if (sameYear) {
    return `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]} – ${b.getUTCDate()} ${MONTHS[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  }
  return `${formatDate(fromIso)} – ${formatDate(toIso)}`;
}

/** "3 nights", "1 night". */
export function nightsLabel(n: number): string {
  return `${n} night${n === 1 ? "" : "s"}`;
}

/** "2 adults, 1 child" — never "1 childs", never a trailing ", 0 children". */
export function guestsLabel(adults: number, childCount: number): string {
  const a = `${adults} adult${adults === 1 ? "" : "s"}`;
  if (childCount <= 0) return a;
  return `${a}, ${childCount} ${childCount === 1 ? "child" : "children"}`;
}

import { z } from "zod";

/**
 * Booking request validation and date logic.
 *
 * Kept pure and separate from the route handler so it can be unit tested —
 * the database isn't reachable from the build environment, so this is the part
 * whose correctness can actually be proven rather than assumed.
 *
 * Mirrors the CHECK constraints in the migrations on purpose. The database is
 * the real authority; this layer exists to give a guest a decent error message
 * instead of a 500.
 */

export const MAX_NIGHTS = 90;
export const MAX_ADULTS = 12;
export const MAX_CHILDREN = 12;
export const BOOKING_HORIZON_YEARS = 2;

/** `YYYY-MM-DD` → UTC midnight. Avoids the local-timezone off-by-one-day trap. */
export function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Rejects things like 2026-02-31, which Date would silently roll over.
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return date;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parseDate(checkIn);
  const b = parseDate(checkOut);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Half-open overlap, `[start, end)`. Check-out day is free for the next guest,
 * so a stay ending on the 5th does NOT clash with one starting on the 5th.
 * Matches the `daterange(..., '[)')` used in the schema.
 */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

const dateString = z
  .string()
  .refine((v) => parseDate(v) !== null, "Use a real date in YYYY-MM-DD form");

export const bookingRequestSchema = z
  .object({
    checkIn: dateString,
    checkOut: dateString,
    adults: z.coerce.number().int().min(1).max(MAX_ADULTS),
    children: z.coerce.number().int().min(0).max(MAX_CHILDREN),
    roomSlug: z.string().max(60).optional().nullable(),
    name: z.string().trim().min(2, "Please give us your name").max(120),
    email: z.string().trim().toLowerCase().email("That email doesn't look right").max(200),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    country: z.string().trim().max(80).optional().or(z.literal("")),
    message: z.string().trim().max(2000).optional().or(z.literal("")),
    /** Honeypot. Real people leave it empty; bots fill everything in. */
    couponCode: z
      .string()
      .trim()
      .max(24, "That code is too long")
      .transform((v) => (v ? v.toUpperCase() : ""))
      .optional(),
    website: z.string().max(0, "Rejected").optional().or(z.literal("")),
  })
  .superRefine((v, ctx) => {
    const nights = nightsBetween(v.checkIn, v.checkOut);

    if (nights <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["checkOut"],
        message: "Check-out has to be after check-in",
      });
      return;
    }
    if (nights > MAX_NIGHTS) {
      ctx.addIssue({
        code: "custom",
        path: ["checkOut"],
        message: `That is over ${MAX_NIGHTS} nights — message us directly for a long stay`,
      });
    }

    const checkIn = parseDate(v.checkIn)!;
    const today = new Date();
    const todayUtc = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );
    if (checkIn < todayUtc) {
      ctx.addIssue({
        code: "custom",
        path: ["checkIn"],
        message: "That date has already passed",
      });
    }

    const horizon = new Date(todayUtc);
    horizon.setUTCFullYear(horizon.getUTCFullYear() + BOOKING_HORIZON_YEARS);
    if (checkIn > horizon) {
      ctx.addIssue({
        code: "custom",
        path: ["checkIn"],
        message: "That is further ahead than we take bookings",
      });
    }
  });

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

/** Field-keyed errors, for rendering next to the input that caused them. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

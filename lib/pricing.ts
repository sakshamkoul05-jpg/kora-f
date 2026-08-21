import { nightsBetween, parseDate } from "./booking.ts";

/**
 * Pricing.
 *
 * Two rules run through everything here.
 *
 * MONEY IS NEVER A FLOAT. Every amount is an integer number of rupees, and
 * percentages are applied via `percentOf`, which converts to basis points
 * first. `subtotal * 0.125` is a bug waiting to happen; `percentOf(subtotal,
 * 12.5)` is not.
 *
 * A PARTIAL PRICE IS NO PRICE. If any single night of a stay has no rate, the
 * whole quote is "on request" rather than a total that quietly omits a night.
 * The hosts have not set rates yet, so this is the live path today, not a
 * theoretical edge case — the site must stay usable with every rate null.
 */

export type RateOverride = {
  /** Null means the override applies to every room. */
  roomId: string | null;
  startsOn: string;
  /** Exclusive, like every other date range in this codebase. */
  endsOn: string;
  nightlyRateInr: number;
  minNights: number | null;
  priority: number;
  label: string | null;
};

export type PricingSettings = {
  depositPercent: number;
  taxPercent: number;
  minNights: number;
  currency: string;
};

export const DEFAULT_SETTINGS: PricingSettings = {
  depositPercent: 25,
  taxPercent: 0,
  minNights: 1,
  currency: "INR",
};

export type NightRate = {
  date: string;
  rateInr: number;
  /** Which override supplied this rate, for showing "Peak season" in the breakdown. */
  label: string | null;
};

export type Quote =
  | {
      kind: "priced";
      nights: NightRate[];
      nightCount: number;
      subtotalInr: number;
      taxInr: number;
      totalInr: number;
      depositInr: number;
      balanceInr: number;
      currency: string;
      /** True when every night cost the same — lets the UI say "₹2,500 × 3 nights". */
      flatRate: boolean;
      /** Set only once a discount has been applied. */
      discountInr?: number;
      /** What the subtotal was before the discount, so the UI can strike it. */
      fullSubtotalInr?: number;
    }
  | {
      kind: "on-request";
      nightCount: number;
      /** Why there is no price, in words a guest can read. */
      reason: string;
    }
  | {
      kind: "unbookable";
      reason: string;
      /** Set when the stay is simply too short, so the UI can say how short. */
      minNights?: number;
    };

/**
 * Percentage of an integer amount, exact to the rupee.
 *
 * Converts the percentage to basis points before multiplying, so 12.5% of
 * 2400 is 300 and not 299.99999999999994. Half-rupees round up, consistently.
 */
export function percentOf(amountInr: number, percent: number): number {
  const basisPoints = Math.round(percent * 100);
  return Math.round((amountInr * basisPoints) / 10_000);
}

/** Every night of a stay: check-in inclusive, check-out exclusive. */
export function eachNight(checkIn: string, checkOut: string): string[] {
  const start = parseDate(checkIn);
  const end = parseDate(checkOut);
  if (!start || !end || end <= start) return [];
  const out: string[] = [];
  for (let t = start.getTime(); t < end.getTime(); t += 86_400_000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/**
 * Which override wins for a given night.
 *
 * Deterministic by construction, because two overrides covering the same night
 * is normal — a broad season with a festival week sitting on top of it. Order:
 * highest priority, then a room-specific rule over an all-rooms one, then the
 * later start date, then the id. Never rely on database row order for this.
 */
export function overrideForNight(
  date: string,
  roomId: string,
  overrides: readonly RateOverride[]
): RateOverride | null {
  const candidates = overrides.filter(
    (o) =>
      (o.roomId === null || o.roomId === roomId) &&
      date >= o.startsOn &&
      date < o.endsOn
  );
  if (candidates.length === 0) return null;

  return candidates.reduce((best, o) => {
    if (o.priority !== best.priority) return o.priority > best.priority ? o : best;
    // A rule written for this room beats a blanket one at the same priority.
    const oSpecific = o.roomId !== null;
    const bestSpecific = best.roomId !== null;
    if (oSpecific !== bestSpecific) return oSpecific ? o : best;
    if (o.startsOn !== best.startsOn) return o.startsOn > best.startsOn ? o : best;
    return o.nightlyRateInr >= best.nightlyRateInr ? o : best;
  });
}

/** The strictest minimum-nights rule touching this stay. */
export function minNightsFor(
  checkIn: string,
  checkOut: string,
  roomId: string,
  overrides: readonly RateOverride[],
  settings: PricingSettings
): number {
  let min = Math.max(1, settings.minNights);
  for (const date of eachNight(checkIn, checkOut)) {
    const o = overrideForNight(date, roomId, overrides);
    if (o?.minNights && o.minNights > min) min = o.minNights;
  }
  return min;
}

export type QuoteInput = {
  roomId: string;
  /** The room's standing rate. Null while the hosts have not set one. */
  baseRateInr: number | null;
  checkIn: string;
  checkOut: string;
  overrides?: readonly RateOverride[];
  settings?: PricingSettings;
};

export function quoteStay({
  roomId,
  baseRateInr,
  checkIn,
  checkOut,
  overrides = [],
  settings = DEFAULT_SETTINGS,
}: QuoteInput): Quote {
  const nightCount = nightsBetween(checkIn, checkOut);
  if (nightCount <= 0) {
    return { kind: "unbookable", reason: "Check-out must be after check-in." };
  }

  const required = minNightsFor(checkIn, checkOut, roomId, overrides, settings);
  if (nightCount < required) {
    return {
      kind: "unbookable",
      reason: `These dates need a minimum stay of ${required} night${required === 1 ? "" : "s"}.`,
      minNights: required,
    };
  }

  const nights: NightRate[] = [];
  for (const date of eachNight(checkIn, checkOut)) {
    const override = overrideForNight(date, roomId, overrides);
    const rate = override ? override.nightlyRateInr : baseRateInr;
    if (rate === null || rate === undefined) {
      // Deliberately no partial total. See the note at the top of this file.
      return {
        kind: "on-request",
        nightCount,
        reason: "We haven't published a rate for these dates yet — ask and we'll quote you.",
      };
    }
    nights.push({ date, rateInr: rate, label: override?.label ?? null });
  }

  const subtotalInr = nights.reduce((sum, n) => sum + n.rateInr, 0);
  const taxInr = percentOf(subtotalInr, settings.taxPercent);
  const totalInr = subtotalInr + taxInr;
  const depositInr = percentOf(totalInr, settings.depositPercent);

  return {
    kind: "priced",
    nights,
    nightCount,
    subtotalInr,
    taxInr,
    totalInr,
    depositInr,
    balanceInr: totalInr - depositInr,
    currency: settings.currency,
    flatRate: nights.every((n) => n.rateInr === nights[0].rateInr),
  };
}

/**
 * Applies a discount to a priced quote.
 *
 * Deliberately takes a rupee amount rather than a coupon: what a code is worth
 * is decided by the database (`validate_coupon`), never here and never in the
 * browser. This only does the arithmetic, so there is one place that knows how
 * a discount interacts with tax and the deposit.
 *
 * The discount comes off the SUBTOTAL, before tax — tax is owed on what is
 * actually paid, not on a price nobody was charged. The deposit is then taken
 * from the discounted total, so a coupon reduces what is due today as well as
 * overall.
 *
 * Anything but a priced quote is returned untouched: there is nothing to
 * discount, and inventing a total would be worse than showing none.
 */
export function applyDiscount(
  quote: Quote,
  discountInr: number,
  settings: PricingSettings = DEFAULT_SETTINGS
): Quote {
  if (quote.kind !== "priced") return quote;
  const discount = Math.max(0, Math.min(Math.round(discountInr), quote.subtotalInr));
  if (discount === 0) return quote;

  const subtotalInr = quote.subtotalInr - discount;
  const taxInr = percentOf(subtotalInr, settings.taxPercent);
  const totalInr = subtotalInr + taxInr;
  const depositInr = percentOf(totalInr, settings.depositPercent);

  return {
    ...quote,
    subtotalInr,
    taxInr,
    totalInr,
    depositInr,
    balanceInr: totalInr - depositInr,
    discountInr: discount,
    fullSubtotalInr: quote.subtotalInr,
  };
}

/** `250000` → `"₹2,50,000"`. Indian digit grouping, not thousands. */
export function formatInr(amountInr: number): string {
  const negative = amountInr < 0;
  const digits = String(Math.abs(Math.round(amountInr)));
  let grouped: string;
  if (digits.length <= 3) {
    grouped = digits;
  } else {
    const last3 = digits.slice(-3);
    const rest = digits.slice(0, -3);
    grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  }
  return `${negative ? "-" : ""}₹${grouped}`;
}

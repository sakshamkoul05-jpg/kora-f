import { quoteStay, type Quote } from "@/lib/pricing";
import { loadPricingContext } from "@/lib/pricing-data";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Rooms plus prices for a date range.
 *
 * Shared by the /book page and /api/availability so the two can never drift
 * into disagreeing about what a stay costs — the page renders this, the API
 * serialises this, and there is one implementation.
 */

export type RoomAvailability = {
  slug: string;
  name: string;
  number: number;
  hasKitchenette: boolean;
  maxOccupancy: number | null;
  available: boolean;
  quote: Quote;
};

export type AvailabilityResult =
  | { configured: false }
  | { configured: true; error: string }
  | {
      configured: true;
      error: null;
      from: string;
      to: string;
      nights: number;
      depositPercent: number;
      currency: string;
      rooms: RoomAvailability[];
    };

type Row = {
  room_id: string;
  slug: string;
  name: string;
  room_number: number;
  has_kitchenette: boolean;
  base_rate_inr: number | null;
  max_occupancy: number | null;
  is_available: boolean;
};

export async function getAvailability(
  from: string,
  to: string
): Promise<AvailabilityResult> {
  if (!isSupabaseConfigured) return { configured: false };
  const supabase = await createClient();
  if (!supabase) return { configured: false };

  // Release any hold whose clock ran out before reading the calendar, so an
  // unpaid request can never keep a room off the market indefinitely. Failure
  // here is not fatal — is_room_taken() also discounts lapsed holds on read.
  const { error: sweepError } = await supabase.rpc("expire_stale_holds");
  if (sweepError) {
    console.error("[availability] hold sweep failed:", sweepError.message);
  }

  const [{ data, error }, pricing] = await Promise.all([
    supabase.rpc("room_availability", { from_date: from, to_date: to }),
    loadPricingContext(),
  ]);

  if (error) {
    console.error("[availability] rpc failed:", error.message);
    return { configured: true, error: "lookup_failed" };
  }

  const { settings, overrides } = pricing;

  return {
    configured: true,
    error: null,
    from,
    to,
    nights: Math.round(
      (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000
    ),
    depositPercent: settings.depositPercent,
    currency: settings.currency,
    rooms: ((data ?? []) as Row[]).map((r) => ({
      slug: r.slug,
      name: r.name,
      number: r.room_number,
      hasKitchenette: r.has_kitchenette,
      maxOccupancy: r.max_occupancy,
      available: r.is_available,
      quote: quoteStay({
        roomId: r.room_id,
        baseRateInr: r.base_rate_inr,
        checkIn: from,
        checkOut: to,
        overrides,
        settings,
      }),
    })),
  };
}

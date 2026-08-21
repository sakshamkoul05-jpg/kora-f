import { NextResponse } from "next/server";
import { MAX_NIGHTS, nightsBetween, parseDate } from "@/lib/booking";
import { quoteStay } from "@/lib/pricing";
import { loadPricingContext } from "@/lib/pricing-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Which rooms are free between two dates.
 *
 * Backed by the `room_availability` SQL function, which never reveals who holds
 * a room or why one is blocked.
 *
 * A room is held by an ACCEPTED request (a host said yes; the guest is paying)
 * or a CONFIRMED one. A pending request holds nothing — several guests may ask
 * for the same dates, and a flood of speculative requests must not be able to
 * lock the calendar.
 *
 * Each room comes back with a quote for the requested dates. Where no rate is
 * set the quote is `on-request` rather than zero.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  if (!parseDate(from) || !parseDate(to)) {
    return NextResponse.json(
      { error: "invalid_dates", message: "Pass ?from=YYYY-MM-DD&to=YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const nights = nightsBetween(from, to);
  if (nights <= 0) {
    return NextResponse.json(
      { error: "invalid_range", message: "The second date must be after the first." },
      { status: 400 }
    );
  }
  // Bound the window so this can't be used to sweep the whole calendar cheaply.
  if (nights > MAX_NIGHTS) {
    return NextResponse.json(
      { error: "range_too_long", message: `Ask for ${MAX_NIGHTS} nights or fewer.` },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured) {
    // Not an error: the site works without a database, the form just falls
    // back to WhatsApp. Say so plainly rather than 500-ing.
    return NextResponse.json({ configured: false, rooms: [] }, { status: 200 });
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ configured: false, rooms: [] }, { status: 200 });

  const { data, error } = await supabase.rpc("room_availability", {
    from_date: from,
    to_date: to,
  });

  if (error) {
    console.error("[availability] rpc failed:", error.message);
    return NextResponse.json(
      { error: "lookup_failed", message: "Couldn't check availability just now." },
      { status: 502 }
    );
  }

  // Price every room in the same response. One round trip for settings and
  // overrides, then pure computation — the results page should not have to
  // make a request per room.
  const { settings, overrides } = await loadPricingContext();

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

  return NextResponse.json(
    {
      configured: true,
      from,
      to,
      nights,
      depositPercent: settings.depositPercent,
      currency: settings.currency,
      rooms: (data ?? []).map((r: Row) => ({
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
    },
    // Availability changes rarely; a short cache spares the database.
    { status: 200, headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } }
  );
}

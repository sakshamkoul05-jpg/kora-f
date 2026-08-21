import { NextResponse } from "next/server";
import { MAX_NIGHTS, nightsBetween, parseDate } from "@/lib/booking";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * What a discount code is worth for a given stay.
 *
 * Advisory only. This tells the checkout page what to display; the figure that
 * is actually honoured is recomputed server-side when a host accepts, from the
 * coupon row as it stands then. A code that expires between browsing and
 * accepting is simply not applied, and nothing here can be edited into a
 * cheaper booking.
 *
 * Rate limited, because a coupon endpoint is exactly what someone would point
 * a script at to guess codes. The underlying function also answers "not valid"
 * identically for a missing code and a switched-off one, so guessing tells you
 * nothing either way.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ valid: false, reason: "Codes aren't available yet." }, { status: 200 });
  }

  const limit = rateLimit(`coupon:${clientKey(request.headers)}`, {
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { valid: false, reason: "Too many tries. Wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: {
    code?: string;
    checkIn?: string;
    checkOut?: string;
    subtotalInr?: number;
    roomSlug?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, reason: "Malformed request." }, { status: 400 });
  }

  const code = String(body.code ?? "").trim();
  const checkIn = String(body.checkIn ?? "");
  const checkOut = String(body.checkOut ?? "");
  const subtotalInr = Math.max(0, Math.round(Number(body.subtotalInr) || 0));

  if (!code) {
    return NextResponse.json({ valid: false, reason: "Enter a code." }, { status: 200 });
  }
  if (!parseDate(checkIn) || !parseDate(checkOut)) {
    return NextResponse.json({ valid: false, reason: "Pick your dates first." }, { status: 200 });
  }
  const nights = nightsBetween(checkIn, checkOut);
  if (nights <= 0 || nights > MAX_NIGHTS) {
    return NextResponse.json({ valid: false, reason: "Check your dates." }, { status: 200 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ valid: false, reason: "Codes aren't available yet." }, { status: 200 });
  }

  const { data, error } = await supabase.rpc("validate_coupon", {
    p_code: code,
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_subtotal_inr: subtotalInr,
    p_room_slug: body.roomSlug ?? null,
  });

  if (error) {
    console.error("[coupon] validate failed:", error.message);
    return NextResponse.json({ valid: false, reason: "Couldn't check that code." }, { status: 200 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.valid) {
    return NextResponse.json(
      { valid: false, reason: row?.reason ?? "That code is not valid" },
      { status: 200 }
    );
  }

  return NextResponse.json({
    valid: true,
    code: row.code,
    description: row.description,
    discountInr: row.discount_inr,
  });
}

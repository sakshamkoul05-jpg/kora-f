import { NextResponse } from "next/server";
import { bookingRequestSchema, fieldErrors } from "@/lib/booking";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lodge a booking REQUEST. It does not reserve anything.
 *
 * The hosts read every request and decide — that is how this house works, and
 * the database enforces it: a BEFORE INSERT trigger forces status='pending'
 * and strips host-only columns, so a crafted payload cannot self-confirm.
 *
 * Validation runs here rather than in the browser so it cannot be skipped, and
 * the response deliberately never echoes any row but the caller's own.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      {
        error: "unconfigured",
        message:
          "Online requests aren't switched on yet. Please message us on WhatsApp and we'll reply the same day.",
      },
      { status: 503 }
    );
  }

  // Cheap flood protection before doing any work.
  const limit = rateLimit(`booking:${clientKey(request.headers)}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "That's a few requests in a short time. Try again shortly, or message us on WhatsApp.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json", message: "Malformed request." }, { status: 400 });
  }

  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    // The honeypot must not tell a bot why it failed.
    if (errors.website) {
      return NextResponse.json({ ok: true, reference: null }, { status: 202 });
    }
    return NextResponse.json(
      { error: "invalid", message: "Please check the highlighted fields.", errors },
      { status: 422 }
    );
  }

  const input = parsed.data;
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  }

  // Submitted through a SECURITY DEFINER function rather than a plain insert.
  //
  // A direct `insert(...).select("reference")` is refused by RLS: RETURNING
  // needs a SELECT privilege, and anon deliberately has none on this table.
  // The function returns a single text reference and can yield nothing else,
  // so the reference comes back without opening any read path to guest data.
  // It also resolves the room slug internally — no room id crosses the wire.
  const { data, error } = await supabase.rpc("submit_booking_request", {
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_adults: input.adults,
    p_children: input.children,
    p_guest_name: input.name,
    p_guest_email: input.email,
    p_guest_phone: input.phone || null,
    p_guest_country: input.country || null,
    p_message: input.message || null,
    p_room_slug: input.roomSlug || null,
    p_coupon_code: input.couponCode || null,
  });

  if (error) {
    // Log server-side; never hand a database message to the browser, since it
    // can disclose schema details.
    console.error("[booking-requests] insert failed:", error.message);
    return NextResponse.json(
      {
        error: "insert_failed",
        message:
          "We couldn't save that just now. Please try again, or message us on WhatsApp and we'll sort it.",
      },
      { status: 502 }
    );
  }

  // The function returns the reference as a bare string.
  return NextResponse.json({ ok: true, reference: data as string }, { status: 201 });
}

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

  // Resolve the room slug server-side. Never trust a client-supplied room id.
  let roomId: string | null = null;
  if (input.roomSlug) {
    const { data: room } = await supabase
      .from("rooms")
      .select("id")
      .eq("slug", input.roomSlug)
      .eq("is_active", true)
      .maybeSingle();
    roomId = room?.id ?? null;
  }

  const { data, error } = await supabase
    .from("booking_requests")
    .insert({
      check_in: input.checkIn,
      check_out: input.checkOut,
      adults: input.adults,
      children: input.children,
      room_id: roomId,
      guest_name: input.name,
      guest_email: input.email,
      guest_phone: input.phone || null,
      guest_country: input.country || null,
      message: input.message || null,
      source: "website",
    })
    // Only the caller's own reference comes back — nothing else, and no other row.
    .select("reference")
    .single();

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

  return NextResponse.json({ ok: true, reference: data.reference }, { status: 201 });
}

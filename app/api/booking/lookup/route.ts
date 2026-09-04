import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where does my booking stand, and can I pay for it?
 *
 * Requires BOTH the reference and the email it was made with. A reference on
 * its own is KH-YYYY-NNNN — ten thousand a year and trivially enumerable — so
 * accepting it alone would hand a stranger's dates and room to anyone with a
 * loop. Requiring the address means an attacker already needs the thing they
 * were trying to steal.
 *
 * Rate limited harder than the rest of the site for the same reason: this is
 * the one endpoint worth pointing a script at.
 *
 * The answer is identical whether the reference does not exist or the email
 * does not match, so nothing here confirms that a booking is real.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { found: false, message: "Booking lookup isn't available yet." },
      { status: 200 }
    );
  }

  const limit = rateLimit(`lookup:${clientKey(request.headers)}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { found: false, message: "Too many tries. Wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: { reference?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ found: false, message: "Malformed request." }, { status: 400 });
  }

  const reference = String(body.reference ?? "").trim();
  const email = String(body.email ?? "").trim();

  if (!reference || !email) {
    return NextResponse.json(
      { found: false, message: "We need both the reference and the email you booked with." },
      { status: 200 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ found: false, message: "Not available just now." }, { status: 200 });
  }

  const { data, error } = await supabase.rpc("booking_status_for", {
    p_reference: reference,
    p_email: email,
  });

  if (error) {
    console.error("[lookup] failed:", error.message);
    return NextResponse.json(
      { found: false, message: "Couldn't look that up just now." },
      { status: 200 }
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    // Deliberately one message for both "no such reference" and "wrong email".
    return NextResponse.json(
      {
        found: false,
        message:
          "We couldn't find a booking with that reference and email. Check both, or message us and we'll find it.",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    found: true,
    booking: {
      reference: row.reference,
      status: row.status,
      checkIn: row.check_in,
      checkOut: row.check_out,
      roomName: row.room_name,
      guestName: row.guest_name,
      adults: row.adults,
      children: row.children,
      totalInr: row.total_inr,
      depositInr: row.deposit_inr,
      discountInr: row.discount_inr,
      holdExpiresAt: row.hold_expires_at,
      depositPaidAt: row.deposit_paid_at,
      paymentPreference: row.payment_preference ?? "deposit",
      paymentUrl: row.payment_url,
    },
  });
}

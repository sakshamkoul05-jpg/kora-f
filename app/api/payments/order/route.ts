import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { RAZORPAY_KEY_ID, createOrder, isRazorpayConfigured, toPaise } from "@/lib/razorpay";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Opens a Razorpay order for a deposit.
 *
 * THE AMOUNT IS NOT TAKEN FROM THE REQUEST. Razorpay's integration guide shows
 * the browser posting `{ amount }`; wired that way, a guest edits one number in
 * devtools and pays a rupee for a fifteen-hundred-rupee deposit. The figure
 * here comes from the booking row, found by reference and email, and the body
 * carries nothing but those two identifiers.
 *
 * Every other guard is for the same reason — a request is only payable when a
 * host has accepted it, nobody has paid yet, and the hold has not lapsed. Each
 * of those is checked against the database, not against what the page happened
 * to be showing.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured || !isRazorpayConfigured) {
    return NextResponse.json(
      { error: "unavailable", message: "Online payment isn't switched on yet." },
      { status: 503 }
    );
  }

  const limit = rateLimit(`order:${clientKey(request.headers)}`, {
    limit: 12,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many attempts. Wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: { reference?: string; email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const reference = String(body.reference ?? "").trim();
  const email = String(body.email ?? "").trim();
  if (!reference || !email) {
    return NextResponse.json(
      { error: "missing_fields", message: "We need the reference and the email you booked with." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  // Same definer function the lookup page uses: it requires both identifiers
  // and returns nothing at all when either is wrong.
  const { data, error } = await supabase.rpc("booking_status_for", {
    p_reference: reference,
    p_email: email,
  });
  if (error) {
    console.error("[order] lookup failed:", error.message);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }

  const booking = Array.isArray(data) ? data[0] : data;
  if (!booking) {
    // Identical answer to a wrong email, so this cannot confirm a booking exists.
    return NextResponse.json(
      { error: "not_found", message: "We couldn't find that booking." },
      { status: 404 }
    );
  }

  if (booking.status !== "accepted") {
    return NextResponse.json(
      {
        error: "not_payable",
        message:
          booking.status === "confirmed"
            ? "That deposit is already paid."
            : "There's nothing to pay on this booking yet.",
      },
      { status: 409 }
    );
  }
  if (booking.deposit_paid_at) {
    return NextResponse.json(
      { error: "already_paid", message: "That deposit is already paid." },
      { status: 409 }
    );
  }
  if (booking.hold_expires_at && new Date(booking.hold_expires_at) < new Date()) {
    return NextResponse.json(
      {
        error: "expired",
        message: "The hold on this room has run out. Message us and we'll see if it's still free.",
      },
      { status: 409 }
    );
  }

  const depositInr = Number(booking.deposit_inr ?? 0);
  if (!Number.isFinite(depositInr) || depositInr <= 0) {
    return NextResponse.json(
      { error: "no_amount", message: "No deposit has been set on this booking yet." },
      { status: 409 }
    );
  }

  const created = await createOrder({
    amountInr: depositInr,
    receipt: booking.reference,
    notes: { booking_reference: booking.reference },
  });
  if (!created.ok) {
    return NextResponse.json(
      { error: "order_failed", message: created.error },
      { status: created.status }
    );
  }

  // Record the order so the verify step can tie a payment back to a booking
  // without trusting anything the browser sends it. Writing to `payments`
  // needs the service role, exactly as the webhook does — and, as there, it
  // happens only after the request has been validated above.
  if (isServiceRoleConfigured) {
    const admin = createAdminClient();
    if (admin) {
      // payments.booking_request_id is NOT NULL, and booking_status_for
      // deliberately does not return the internal id — it is guest-facing. So
      // fetch it here, matching on BOTH identifiers again rather than trusting
      // that the check above and this query are looking at the same row.
      const { data: row } = await admin
        .from("booking_requests")
        .select("id")
        .eq("reference", booking.reference)
        .ilike("guest_email", email)
        .maybeSingle();

      if (row?.id) {
        const { error: writeError } = await admin.from("payments").insert({
          booking_request_id: row.id,
          razorpay_order_id: created.order.id,
          amount_inr: depositInr,
          status: "created",
        });
        if (writeError) {
          // Not fatal: the order carries the booking reference in its notes,
          // so both the webhook and the verify step can still find their way
          // home. Worth knowing about, though.
          console.error("[order] could not record order:", writeError.message);
        }
      }
    }
  }

  return NextResponse.json({
    orderId: created.order.id,
    amount: created.order.amountPaise,
    currency: created.order.currency,
    keyId: RAZORPAY_KEY_ID,
    // Echoed back so the modal can be prefilled without the page holding a
    // second copy of the guest's details.
    name: booking.guest_name,
    email,
    reference: booking.reference,
    // For the caller to display; identical to `amount / 100`.
    amountInr: depositInr,
    expectedPaise: toPaise(depositInr),
  });
}

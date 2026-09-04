import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { isRazorpayConfigured, verifyPaymentSignature } from "@/lib/razorpay";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Confirms a payment made through Standard Checkout.
 *
 * Order of operations, and it is not negotiable:
 *
 *   1. every field present;
 *   2. verify HMAC-SHA256(order_id|payment_id) against the key secret —
 *      timing-safe, and nothing is read from the payload before it passes;
 *   3. only then touch the database.
 *
 * A failed signature returns 400 and marks NOTHING as paid. That is the whole
 * point of this endpoint: the browser saying "I paid" means nothing on its
 * own, and Razorpay's signature is the only thing that does.
 *
 * The webhook does the same job independently, and either may arrive first —
 * a guest on hotel wifi may lose the browser round trip entirely. Both are
 * idempotent and both refuse to move a booking that is not awaiting payment,
 * so whichever lands second changes nothing.
 */
export async function POST(request: Request) {
  if (!isRazorpayConfigured) {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  const limit = rateLimit(`verify:${clientKey(request.headers)}`, {
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    reference?: string;
    email?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const orderId = String(body.razorpay_order_id ?? "");
  const paymentId = String(body.razorpay_payment_id ?? "");
  const signature = String(body.razorpay_signature ?? "");

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { ok: false, error: "missing_fields", message: "Payment details incomplete." },
      { status: 400 }
    );
  }

  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    console.warn("[verify] rejected a payment with a bad signature", { orderId, paymentId });
    return NextResponse.json(
      {
        ok: false,
        error: "bad_signature",
        message: "We couldn't verify that payment. Nothing has been marked as paid — message us and we'll check.",
      },
      { status: 400 }
    );
  }

  // Signature is good. Confirming a booking is a privileged write with no user
  // session behind it, so it runs with the service role — safe BECAUSE of the
  // check above and only because of it.
  if (!isServiceRoleConfigured) {
    console.error("[verify] verified a payment but SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.json(
      {
        ok: false,
        error: "not_configured",
        message: "Your payment went through but we couldn't record it. Message us with your reference and we'll sort it out.",
      },
      { status: 500 }
    );
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 500 });

  // Find the booking from the order we recorded, falling back to the reference
  // the caller supplied — but only ever as a lookup key, never as authority.
  const { data: payment } = await admin
    .from("payments")
    .select("id, booking_request_id, amount_inr")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  let bookingId = payment?.booking_request_id ?? null;

  if (!bookingId && body.reference && body.email) {
    const { data: row } = await admin
      .from("booking_requests")
      .select("id")
      .eq("reference", String(body.reference).trim())
      .ilike("guest_email", String(body.email).trim())
      .maybeSingle();
    bookingId = row?.id ?? null;
  }

  if (!bookingId) {
    console.error("[verify] no booking for order", orderId);
    return NextResponse.json(
      {
        ok: false,
        error: "unknown_order",
        message: "Your payment went through but we couldn't match it to a booking. Message us and we'll sort it out.",
      },
      { status: 500 }
    );
  }

  // razorpay_payment_id is unique, so a replay updates the same row.
  const { error: payError } = await admin.from("payments").upsert(
    {
      booking_request_id: bookingId,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      amount_inr: payment?.amount_inr ?? 1,
      status: "captured",
    },
    { onConflict: "razorpay_payment_id" }
  );
  if (payError) console.error("[verify] payment row:", payError.message);

  // Only ever moves forward. A late duplicate for a booking someone already
  // cancelled must not silently resurrect it.
  const { data: updated, error } = await admin
    .from("booking_requests")
    .update({ status: "confirmed", deposit_paid_at: new Date().toISOString() })
    .eq("id", bookingId)
    .in("status", ["accepted", "pending"])
    .select("reference, coupon_code")
    .maybeSingle();

  if (error) {
    console.error("[verify] confirm failed:", error.message);
    return NextResponse.json(
      {
        ok: false,
        error: "update_failed",
        message: "Your payment went through but we couldn't update the booking. Message us and we'll fix it.",
      },
      { status: 500 }
    );
  }

  // A coupon is only spent once a stay is actually confirmed, never when a
  // code is typed. If the webhook got here first `updated` is null and the
  // count has already moved — which is exactly why this sits inside the guard.
  if (updated?.coupon_code) {
    const { error: redeemError } = await admin.rpc("redeem_coupon", {
      p_code: updated.coupon_code,
    });
    if (redeemError) console.error("[verify] redeem failed:", redeemError.message);
  }

  return NextResponse.json({ ok: true, reference: updated?.reference ?? body.reference ?? null });
}

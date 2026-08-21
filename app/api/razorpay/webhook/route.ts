import { NextResponse } from "next/server";
import { isRazorpayWebhookConfigured, verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay webhook — the only thing that may mark a booking paid.
 *
 * Order of operations matters and is not negotiable:
 *
 *   1. read the RAW body. Parsing and re-serialising changes the bytes and the
 *      signature will never match;
 *   2. verify the HMAC. Nothing is read from the payload before this — an
 *      unverified body is an attacker's text, not Razorpay's;
 *   3. only then touch the database.
 *
 * Confirming a booking is a privileged write, so it runs with the service-role
 * key. That is safe *because* of step 2 and only because of it. Never move the
 * database work above the signature check.
 *
 * Idempotent by construction: Razorpay retries until it gets a 2xx, and
 * razorpay_payment_id is unique, so a replayed event updates the same row
 * instead of creating a second payment.
 */
export async function POST(request: Request) {
  if (!isRazorpayWebhookConfigured) {
    // 200 rather than an error: an unconfigured site should not make Razorpay
    // retry forever, and there is nothing to do.
    return NextResponse.json({ ok: true, ignored: "webhook_not_configured" });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature)) {
    console.warn("[razorpay] rejected a webhook with a bad signature");
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: Record<string, unknown> };
      payment_link?: { entity?: Record<string, unknown> };
    };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const kind = event.event ?? "";
  const payment = event.payload?.payment?.entity ?? {};
  const link = event.payload?.payment_link?.entity ?? {};

  // The booking reference travels as the payment link's reference_id, with
  // notes as a fallback for events that don't carry the link entity.
  const reference =
    (link.reference_id as string | undefined) ??
    ((payment.notes as Record<string, string> | undefined)?.booking_reference ?? null);

  if (!reference) {
    // Nothing of ours. Acknowledge so Razorpay stops retrying.
    return NextResponse.json({ ok: true, ignored: "no_reference" });
  }

  if (!isServiceRoleConfigured) {
    console.error("[razorpay] verified webhook but SUPABASE_SERVICE_ROLE_KEY is not set");
    // 500 so Razorpay retries once the key is configured, rather than dropping
    // a real payment on the floor.
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 500 });

  const { data: booking } = await supabase
    .from("booking_requests")
    .select("id, status, deposit_inr")
    .eq("reference", reference)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ ok: true, ignored: "unknown_reference" });
  }

  const paidPaise = Number(payment.amount ?? link.amount_paid ?? 0);
  const amountInr = Math.round(paidPaise / 100);
  const paymentId = (payment.id as string | undefined) ?? null;
  const orderId = (link.id as string | undefined) ?? (payment.order_id as string | undefined) ?? null;

  const succeeded = kind === "payment_link.paid" || kind === "payment.captured";
  const failed = kind === "payment.failed";

  if (paymentId) {
    await supabase
      .from("payments")
      .upsert(
        {
          booking_request_id: booking.id,
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          amount_inr: amountInr > 0 ? amountInr : (booking.deposit_inr ?? 1),
          status: succeeded ? "captured" : failed ? "failed" : "authorized",
          method: (payment.method as string | undefined) ?? null,
          error_code: (payment.error_code as string | undefined) ?? null,
          error_description: (payment.error_description as string | undefined) ?? null,
          raw: event as unknown as Record<string, unknown>,
        },
        { onConflict: "razorpay_payment_id" }
      );
  }

  if (succeeded) {
    // Only ever moves forward. A late duplicate for a booking someone already
    // cancelled must not silently resurrect it.
    const { error } = await supabase
      .from("booking_requests")
      .update({
        status: "confirmed",
        deposit_paid_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .in("status", ["accepted", "pending"]);

    if (error) {
      console.error("[razorpay] confirm failed:", error.message);
      // Retry-able: Razorpay will send it again.
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

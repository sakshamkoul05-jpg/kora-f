"use server";

import { revalidatePath } from "next/cache";
import { percentOf, quoteStay } from "@/lib/pricing";
import { loadPricingContext } from "@/lib/pricing-data";
import { createDepositLink, isRazorpayConfigured } from "@/lib/razorpay";
import { SITE_URL } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

/**
 * Host decisions on a booking request.
 *
 * Authorisation is NOT re-implemented here. Every write runs through the
 * host's own session against RLS, where `is_staff()` decides. A signed-in
 * non-staff user simply updates zero rows. One source of truth for who may do
 * this — the database — rather than a second copy in application code that can
 * drift out of step with it.
 */

type Decision = "declined" | "cancelled" | "confirmed";

export async function decideBooking(
  id: string,
  decision: Decision,
  hostNote?: string
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Supabase isn't configured." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data, error } = await supabase
    .from("booking_requests")
    .update({
      status: decision,
      host_note: hostNote?.trim() || null,
      decided_by: user.id,
      // Declining or cancelling releases the room immediately; leaving a stale
      // clock behind would keep it looking held in the admin.
      ...(decision === "declined" || decision === "cancelled"
        ? { hold_expires_at: null }
        : {}),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23P01") {
      return {
        ok: false,
        message: "That room is already held for dates that overlap this stay.",
      };
    }
    console.error("[admin] decide failed:", error.message);
    return { ok: false, message: "Couldn't save that." };
  }
  if (!data) return { ok: false, message: "You don't have permission to change that." };

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Accept a request: quote it, hold the room, and ask for the deposit.
 *
 * The price is settled HERE, server-side, from the room's rates — never from
 * anything the browser sent. `totalInrOverride` exists because no rate is
 * configured for any room yet, so today a host types the figure in; it is also
 * how you'd honour a quoted discount later. It is a host's number either way,
 * and a host is already trusted with this row.
 *
 * Accepting is what holds the room, so this is where the exclusion constraint
 * bites. If two hosts accept overlapping stays at the same moment, one of them
 * loses with 23P01 and is told plainly.
 */
export async function acceptBooking(
  id: string,
  opts: { totalInrOverride?: number | null; hostNote?: string } = {}
): Promise<{ ok: boolean; message?: string; paymentUrl?: string; depositInr?: number }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Supabase isn't configured." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data: booking, error: loadError } = await supabase
    .from("booking_requests")
    .select(
      "id, reference, room_id, check_in, check_out, guest_name, guest_email, guest_phone, status, coupon_code"
    )
    .eq("id", id)
    .maybeSingle();

  if (loadError || !booking) {
    return { ok: false, message: "Couldn't load that request." };
  }
  if (booking.status === "confirmed") {
    return { ok: false, message: "That booking is already paid and confirmed." };
  }
  if (!booking.room_id) {
    return { ok: false, message: "Assign a room before accepting, so the dates can be held." };
  }

  const [{ data: room }, pricing] = await Promise.all([
    supabase.from("rooms").select("base_rate_inr, name").eq("id", booking.room_id).maybeSingle(),
    loadPricingContext(),
  ]);

  const quote = quoteStay({
    roomId: booking.room_id,
    baseRateInr: room?.base_rate_inr ?? null,
    checkIn: booking.check_in,
    checkOut: booking.check_out,
    overrides: pricing.overrides,
    settings: pricing.settings,
  });

  const override = opts.totalInrOverride;
  const hasOverride = typeof override === "number" && Number.isFinite(override) && override > 0;

  if (!hasOverride && quote.kind !== "priced") {
    return {
      ok: false,
      message:
        quote.kind === "on-request"
          ? "No rate is set for these dates — enter a total to quote this guest."
          : quote.reason,
    };
  }

  // Re-validate the coupon HERE, from the row as it stands now. Whatever the
  // guest saw at checkout was advisory: a code can expire, be switched off, or
  // hit its redemption limit between browsing and accepting, and in every one
  // of those cases the honest answer is that it no longer applies.
  let discountInr = 0;
  let couponNote = "";
  if (booking.coupon_code) {
    const baseForCoupon =
      quote.kind === "priced" ? quote.subtotalInr : hasOverride ? Math.round(override) : 0;
    const { data: cv } = await supabase.rpc("validate_coupon", {
      p_code: booking.coupon_code,
      p_check_in: booking.check_in,
      p_check_out: booking.check_out,
      p_subtotal_inr: baseForCoupon,
      p_room_slug: null,
    });
    const row = Array.isArray(cv) ? cv[0] : cv;
    if (row?.valid) {
      discountInr = row.discount_inr ?? 0;
    } else {
      couponNote = ` Note: code ${booking.coupon_code} no longer applies (${row?.reason ?? "not valid"}).`;
    }
  }

  const grossInr = hasOverride ? Math.round(override) : (quote as { totalInr: number }).totalInr;
  const totalInr = Math.max(0, grossInr - discountInr);
  const depositInr = percentOf(totalInr, pricing.settings.depositPercent);
  const holdExpiresAt = new Date(Date.now() + pricing.holdHours * 3_600_000);

  const { data: updated, error } = await supabase
    .from("booking_requests")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      hold_expires_at: holdExpiresAt.toISOString(),
      decided_by: user.id,
      host_note: opts.hostNote?.trim() || null,
      nightly_rates: quote.kind === "priced" ? quote.nights : null,
      subtotal_inr: quote.kind === "priced" && !hasOverride ? quote.subtotalInr : totalInr,
      tax_inr: quote.kind === "priced" && !hasOverride ? quote.taxInr : 0,
      total_inr: totalInr,
      deposit_inr: depositInr,
      discount_inr: discountInr > 0 ? discountInr : null,
    })
    .eq("id", id)
    .select("id, reference")
    .maybeSingle();

  if (error) {
    if (error.code === "23P01") {
      return {
        ok: false,
        message:
          "That room is already held for overlapping dates — someone else was accepted first.",
      };
    }
    console.error("[admin] accept failed:", error.message);
    return { ok: false, message: "Couldn't accept that." };
  }
  if (!updated) return { ok: false, message: "You don't have permission to change that." };

  // No Razorpay keys yet: the booking is accepted and the room is held, the
  // host just sends payment details themselves. Say so rather than pretending.
  if (!isRazorpayConfigured) {
    revalidatePath("/admin");
    return {
      ok: true,
      depositInr,
      message: `Accepted and the room is held. Razorpay isn't connected yet — send payment details yourself.${couponNote}`,
    };
  }

  const link = await createDepositLink({
    reference: booking.reference,
    amountInr: depositInr,
    description: `Deposit — Kora House, ${room?.name ?? "room"}, ${booking.check_in} to ${booking.check_out}`,
    guestName: booking.guest_name,
    guestEmail: booking.guest_email,
    guestPhone: booking.guest_phone,
    expiresAt: holdExpiresAt,
    callbackUrl: `${SITE_URL}/book/paid?ref=${encodeURIComponent(booking.reference)}`,
  });

  if (!link.ok) {
    // The acceptance stands — the room is held and that is the important part.
    // Only the link failed, and a host can still take payment another way.
    revalidatePath("/admin");
    return {
      ok: true,
      depositInr,
      message: `Accepted and held, but the payment link failed: ${link.error}`,
    };
  }

  const { error: payError } = await supabase.from("payments").insert({
    booking_request_id: id,
    razorpay_order_id: link.link.id,
    amount_inr: depositInr,
    status: "created",
  });
  if (payError) {
    console.error("[admin] payment row insert failed:", payError.message);
  }

  revalidatePath("/admin");
  return { ok: true, paymentUrl: link.link.url, depositInr };
}

/** House settings a host can change without a redeploy. */
export async function updateSettings(input: {
  depositPercent: number;
  holdHours: number;
  taxPercent: number;
  minNights: number;
}): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Supabase isn't configured." };

  const clamp = (n: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, Math.round(n)));

  const { error } = await supabase
    .from("settings")
    .update({
      deposit_percent: clamp(input.depositPercent, 0, 100),
      hold_hours: clamp(input.holdHours, 1, 168),
      tax_percent: Math.min(50, Math.max(0, input.taxPercent)),
      min_nights: clamp(input.minNights, 1, 30),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) {
    console.error("[admin] settings update failed:", error.message);
    return { ok: false, message: "Couldn't save settings." };
  }
  revalidatePath("/admin");
  return { ok: true };
}

/** Set or clear a room's standing nightly rate. */
export async function updateRoomRate(
  roomId: string,
  rateInr: number | null
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Supabase isn't configured." };

  const value =
    rateInr === null || !Number.isFinite(rateInr) || rateInr <= 0 ? null : Math.round(rateInr);

  const { data, error } = await supabase
    .from("rooms")
    .update({ base_rate_inr: value })
    .eq("id", roomId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[admin] rate update failed:", error.message);
    return { ok: false, message: "Couldn't save that rate." };
  }
  if (!data) return { ok: false, message: "You don't have permission to change rates." };

  revalidatePath("/admin");
  revalidatePath("/book");
  return { ok: true };
}

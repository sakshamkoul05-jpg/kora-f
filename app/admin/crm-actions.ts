"use server";

import { revalidatePath } from "next/cache";
import { nightsBetween, parseDate } from "@/lib/booking";
import { percentOf, quoteStay } from "@/lib/pricing";
import { loadPricingContext } from "@/lib/pricing-data";
import { createClient } from "@/lib/supabase/server";

/**
 * Running the house: bookings taken off the website, dates closed off, rooms
 * and site copy edited.
 *
 * Every write goes through the host's own session against RLS. The database
 * decides who may do this; nothing here re-implements that decision.
 */

type Result = { ok: boolean; message?: string; reference?: string };

const client = async () => {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user ? supabase : null;
};

const refresh = () => {
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/guests");
  revalidatePath("/book");
};

function readable(error: { code?: string; message: string }, fallback: string): string {
  if (error.code === "23P01") {
    return "That room is already taken for dates that overlap this stay.";
  }
  if (error.code === "23505") return "That already exists.";
  if (error.code === "23514") return "One of those values is out of range.";
  if (error.code === "42501") return "You don't have permission to do that.";
  if (error.code === "22023" || error.code === "P0001") return error.message;
  console.error("[crm]", fallback, error.message);
  return fallback;
}

// ------------------------------------------------------------ manual booking

export async function createManualBooking(input: {
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  childCount: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountry: string;
  message: string;
  source: "phone" | "whatsapp" | "walk-in" | "email" | "other";
  status: "confirmed" | "accepted" | "pending";
  totalInr: number | null;
}): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };

  if (!parseDate(input.checkIn) || !parseDate(input.checkOut)) {
    return { ok: false, message: "Check those dates." };
  }
  const nights = nightsBetween(input.checkIn, input.checkOut);
  if (nights <= 0) return { ok: false, message: "Check-out has to be after check-in." };
  if (nights > 90) return { ok: false, message: "That's over 90 nights — split it into two bookings." };
  if (input.guestName.trim().length < 2) return { ok: false, message: "Give the guest's name." };
  if (!input.roomId) return { ok: false, message: "Pick a room — otherwise the dates aren't held." };

  // Price it from the rate card unless the host typed a figure. A phone
  // booking is often a negotiated number, so the override is the normal case
  // rather than the exception.
  const [{ data: room }, pricing] = await Promise.all([
    supabase.from("rooms").select("base_rate_inr").eq("id", input.roomId).maybeSingle(),
    loadPricingContext(),
  ]);

  const quote = quoteStay({
    roomId: input.roomId,
    baseRateInr: room?.base_rate_inr ?? null,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    overrides: pricing.overrides,
    settings: pricing.settings,
  });

  const hasOverride =
    typeof input.totalInr === "number" && Number.isFinite(input.totalInr) && input.totalInr > 0;
  const totalInr = hasOverride
    ? Math.round(input.totalInr as number)
    : quote.kind === "priced"
      ? quote.totalInr
      : null;

  const depositInr = totalInr === null ? null : percentOf(totalInr, pricing.settings.depositPercent);

  // A guest email is required by the schema. A walk-in may genuinely not have
  // one, so synthesise a unique placeholder rather than refusing the booking
  // or inventing something that could reach a real stranger.
  const email = input.guestEmail.trim().toLowerCase() ||
    `no-email+${Date.now().toString(36)}@kora.invalid`;

  const { data, error } = await supabase
    .from("booking_requests")
    .insert({
      room_id: input.roomId,
      check_in: input.checkIn,
      check_out: input.checkOut,
      adults: Math.max(1, Math.round(input.adults) || 1),
      children: Math.max(0, Math.round(input.childCount) || 0),
      guest_name: input.guestName.trim(),
      guest_email: email,
      guest_phone: input.guestPhone.trim() || null,
      guest_country: input.guestCountry.trim() || null,
      message: input.message.trim() || null,
      source: input.source,
      status: input.status,
      total_inr: totalInr,
      subtotal_inr: totalInr,
      tax_inr: 0,
      deposit_inr: depositInr,
      nightly_rates: quote.kind === "priced" && !hasOverride ? quote.nights : null,
      accepted_at: input.status === "pending" ? null : new Date().toISOString(),
      deposit_paid_at: input.status === "confirmed" ? new Date().toISOString() : null,
      hold_expires_at:
        input.status === "accepted"
          ? new Date(Date.now() + pricing.holdHours * 3_600_000).toISOString()
          : null,
    })
    .select("reference")
    .maybeSingle();

  if (error) return { ok: false, message: readable(error, "Couldn't save that booking.") };
  if (!data) return { ok: false, message: "You don't have permission to add bookings." };

  refresh();
  return { ok: true, reference: data.reference };
}

// ------------------------------------------------------------- blocked dates

export async function createBlock(input: {
  roomId: string | null;
  startsOn: string;
  endsOn: string;
  reason: string;
}): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };
  if (!input.startsOn || !input.endsOn || input.endsOn <= input.startsOn) {
    return { ok: false, message: "The end date has to be after the start date." };
  }
  const { error } = await supabase.from("blocked_dates").insert({
    room_id: input.roomId,
    starts_on: input.startsOn,
    ends_on: input.endsOn,
    reason: input.reason.trim() || null,
  });
  if (error) return { ok: false, message: readable(error, "Couldn't block those dates.") };
  refresh();
  return { ok: true };
}

export async function deleteBlock(id: string): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };
  const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
  if (error) return { ok: false, message: readable(error, "Couldn't remove that block.") };
  refresh();
  return { ok: true };
}

// -------------------------------------------------------------------- rooms

export async function updateRoom(
  roomId: string,
  input: {
    name: string;
    maxOccupancy: number | null;
    hasKitchenette: boolean;
    isActive: boolean;
  }
): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };
  if (input.name.trim().length < 2) return { ok: false, message: "A room needs a name." };

  const { data, error } = await supabase
    .from("rooms")
    .update({
      name: input.name.trim(),
      max_occupancy:
        input.maxOccupancy && input.maxOccupancy > 0 ? Math.round(input.maxOccupancy) : null,
      has_kitchenette: input.hasKitchenette,
      is_active: input.isActive,
    })
    .eq("id", roomId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, message: readable(error, "Couldn't save that room.") };
  if (!data) return { ok: false, message: "You don't have permission to edit rooms." };
  refresh();
  revalidatePath("/rooms");
  return { ok: true };
}

// ------------------------------------------------------------- site content

export async function updateSiteContent(entries: Record<string, string>): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };

  const keys = Object.keys(entries);
  if (keys.length === 0) return { ok: true };

  // One statement per key: upsert would need the label and kind columns too,
  // and inventing those from the client is how a stray key ends up in the
  // table with no label.
  for (const key of keys) {
    const { error } = await supabase
      .from("site_content")
      .update({ value: entries[key] ?? "" })
      .eq("key", key);
    if (error) return { ok: false, message: readable(error, "Couldn't save that.") };
  }

  refresh();
  revalidatePath("/", "layout");
  return { ok: true };
}

// --------------------------------------------------------------------- FAQs

export async function createFaq(question: string, answer: string): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };
  if (question.trim().length < 3 || answer.trim().length < 3) {
    return { ok: false, message: "Both a question and an answer, please." };
  }
  const { error } = await supabase
    .from("faqs")
    .insert({ question: question.trim(), answer: answer.trim() });
  if (error) return { ok: false, message: readable(error, "Couldn't save that question.") };
  refresh();
  revalidatePath("/faq");
  return { ok: true };
}

export async function setFaqActive(id: string, active: boolean): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };
  const { error } = await supabase.from("faqs").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, message: readable(error, "Couldn't change that.") };
  refresh();
  revalidatePath("/faq");
  return { ok: true };
}

export async function deleteFaq(id: string): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) return { ok: false, message: readable(error, "Couldn't remove that.") };
  refresh();
  revalidatePath("/faq");
  return { ok: true };
}

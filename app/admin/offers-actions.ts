"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Everything a host manages that is not a booking: seasonal rates, discount
 * codes, packages, and who else can get in.
 *
 * As with booking decisions, authorisation is NOT re-implemented here. Writes
 * go through the host's own session against RLS. The two staff functions are
 * the exception — they must reach auth.users, so they are SECURITY DEFINER and
 * check `is_admin()` inside the database, which is the right place for it.
 */

type Result = { ok: boolean; message?: string };

const client = async () => {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user ? supabase : null;
};

const refresh = () => {
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/book");
};

/** Turn a Postgres error into something a host can act on. */
function readable(error: { code?: string; message: string }, fallback: string): string {
  if (error.code === "23505") return "Something with that code or slug already exists.";
  if (error.code === "23514") return "One of those values is out of range.";
  if (error.code === "42501") return "You don't have permission to do that.";
  // Messages raised by our own functions are written for hosts; pass them on.
  if (error.code === "22023" || error.code === "P0001") return error.message;
  console.error("[admin]", fallback, error.message);
  return fallback;
}

// ------------------------------------------------------------ seasonal rates

export async function createRateOverride(input: {
  label: string;
  startsOn: string;
  endsOn: string;
  nightlyRateInr: number;
  roomId: string | null;
  minNights: number | null;
  priority: number;
}): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };

  if (!input.startsOn || !input.endsOn || input.endsOn <= input.startsOn) {
    return { ok: false, message: "The end date has to be after the start date." };
  }
  if (!Number.isFinite(input.nightlyRateInr) || input.nightlyRateInr <= 0) {
    return { ok: false, message: "Give a nightly rate." };
  }

  const { error } = await supabase.from("rate_overrides").insert({
    label: input.label.trim() || null,
    starts_on: input.startsOn,
    ends_on: input.endsOn,
    nightly_rate_inr: Math.round(input.nightlyRateInr),
    room_id: input.roomId,
    min_nights: input.minNights && input.minNights > 1 ? Math.round(input.minNights) : null,
    priority: Math.round(input.priority) || 0,
  });
  if (error) return { ok: false, message: readable(error, "Couldn't save that season.") };

  refresh();
  return { ok: true };
}

export async function deleteRateOverride(id: string): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };
  const { error } = await supabase.from("rate_overrides").delete().eq("id", id);
  if (error) return { ok: false, message: readable(error, "Couldn't remove that season.") };
  refresh();
  return { ok: true };
}

// -------------------------------------------------------------------- coupons

export async function createCoupon(input: {
  code: string;
  kind: "percent" | "amount";
  value: number;
  description: string;
  isPublic: boolean;
  startsOn: string | null;
  endsOn: string | null;
  minNights: number | null;
  maxRedemptions: number | null;
  roomId: string | null;
}): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };

  const code = input.code.trim().toUpperCase();
  if (code.length < 3 || code.length > 24) {
    return { ok: false, message: "A code is between 3 and 24 characters." };
  }
  if (!/^[A-Z0-9-]+$/.test(code)) {
    return { ok: false, message: "Use letters, numbers and hyphens only — guests have to type this." };
  }
  if (!Number.isFinite(input.value) || input.value <= 0) {
    return { ok: false, message: "Give a discount value." };
  }
  if (input.kind === "percent" && input.value > 100) {
    return { ok: false, message: "A percentage can't be over 100." };
  }

  const { error } = await supabase.from("coupons").insert({
    code,
    kind: input.kind,
    value: input.value,
    description: input.description.trim() || null,
    is_public: input.isPublic,
    starts_on: input.startsOn || null,
    ends_on: input.endsOn || null,
    min_nights: input.minNights && input.minNights > 1 ? Math.round(input.minNights) : null,
    max_redemptions:
      input.maxRedemptions && input.maxRedemptions > 0 ? Math.round(input.maxRedemptions) : null,
    room_id: input.roomId,
  });
  if (error) return { ok: false, message: readable(error, "Couldn't create that code.") };

  refresh();
  return { ok: true };
}

export async function setCouponActive(id: string, active: boolean): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };
  const { error } = await supabase.from("coupons").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, message: readable(error, "Couldn't change that code.") };
  refresh();
  return { ok: true };
}

export async function deleteCoupon(id: string): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return { ok: false, message: readable(error, "Couldn't remove that code.") };
  refresh();
  return { ok: true };
}

// ------------------------------------------------------------------- packages

export async function createPackage(input: {
  name: string;
  description: string;
  inclusions: string[];
  minNights: number | null;
  couponCode: string | null;
}): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };

  const name = input.name.trim();
  if (name.length < 3) return { ok: false, message: "Give the package a name." };

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  const { error } = await supabase.from("packages").insert({
    slug,
    name,
    description: input.description.trim() || null,
    inclusions: input.inclusions.map((i) => i.trim()).filter(Boolean),
    min_nights: input.minNights && input.minNights > 1 ? Math.round(input.minNights) : null,
    coupon_code: input.couponCode ? input.couponCode.trim().toUpperCase() : null,
  });
  if (error) return { ok: false, message: readable(error, "Couldn't create that package.") };

  refresh();
  return { ok: true };
}

export async function setPackageActive(id: string, active: boolean): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };
  const { error } = await supabase.from("packages").update({ is_active: active }).eq("id", id);
  if (error) return { ok: false, message: readable(error, "Couldn't change that package.") };
  refresh();
  return { ok: true };
}

export async function deletePackage(id: string): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };
  const { error } = await supabase.from("packages").delete().eq("id", id);
  if (error) return { ok: false, message: readable(error, "Couldn't remove that package.") };
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------------- staff

export async function addStaffMember(email: string, role: "host" | "admin"): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };

  const { error } = await supabase.rpc("add_staff", {
    p_email: email.trim().toLowerCase(),
    p_role: role,
  });
  if (error) return { ok: false, message: readable(error, "Couldn't add that person.") };
  refresh();
  return { ok: true };
}

export async function removeStaffMember(userId: string): Promise<Result> {
  const supabase = await client();
  if (!supabase) return { ok: false, message: "Not signed in." };
  const { error } = await supabase.rpc("remove_staff", { p_user_id: userId });
  if (error) return { ok: false, message: readable(error, "Couldn't remove that person.") };
  refresh();
  return { ok: true };
}

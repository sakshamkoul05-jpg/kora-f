"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Host decisions on a booking request.
 *
 * Authorisation is NOT re-implemented here. The update runs through the user's
 * own session against RLS, where `is_staff()` decides. A signed-in non-staff
 * user simply updates zero rows. That keeps one source of truth for who may do
 * this — the database — rather than a second copy in application code that can
 * drift out of step with it.
 */

type Decision = "confirmed" | "declined" | "cancelled";

export async function decideBooking(
  id: string,
  decision: Decision,
  hostNote?: string
): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, message: "Supabase isn't configured." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not signed in." };

  const { data, error } = await supabase
    .from("booking_requests")
    .update({
      status: decision,
      host_note: hostNote?.trim() || null,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    // The exclusion constraint fires here when confirming a stay that overlaps
    // one already confirmed for the same room. That is the database refusing to
    // double-book, and it is worth saying so plainly rather than "error".
    if (error.code === "23P01") {
      return {
        ok: false,
        message: "That room is already confirmed for dates that overlap this stay.",
      };
    }
    console.error("[admin] decide failed:", error.message);
    return { ok: false, message: "Couldn't save that." };
  }

  if (!data) {
    // RLS matched no row — either it doesn't exist or this account isn't staff.
    return { ok: false, message: "You don't have permission to change that." };
  }

  revalidatePath("/admin");
  return { ok: true };
}

import type { PublicOffer, PublicPackage } from "@/components/Offers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * The offers a guest is allowed to see.
 *
 * RLS already limits the coupons table to rows flagged public and active, so
 * this cannot return a private code even if the query asked for one. The
 * filters below are belt and braces, and they also drop anything whose window
 * has closed — a coupon can be public and active and simply out of date.
 */
export async function loadPublicOffers(): Promise<{
  offers: PublicOffer[];
  packages: PublicPackage[];
}> {
  if (!isSupabaseConfigured) return { offers: [], packages: [] };
  const supabase = await createClient();
  if (!supabase) return { offers: [], packages: [] };

  const today = new Date().toISOString().slice(0, 10);

  const [couponsRes, packagesRes] = await Promise.all([
    supabase
      .from("coupons")
      .select("code, kind, value, description, min_nights, ends_on, starts_on, max_redemptions, redeemed_count"),
    supabase
      .from("packages")
      .select("name, description, inclusions, min_nights, coupon_code")
      .order("sort_order"),
  ]);

  if (couponsRes.error) console.error("[offers] coupons:", couponsRes.error.message);
  if (packagesRes.error) console.error("[offers] packages:", packagesRes.error.message);

  const offers: PublicOffer[] = (couponsRes.data ?? [])
    .filter((c) => {
      if (c.ends_on && c.ends_on < today) return false;
      if (c.max_redemptions !== null && c.redeemed_count >= c.max_redemptions) return false;
      return true;
    })
    .map((c) => ({
      code: c.code,
      kind: c.kind as "percent" | "amount",
      value: Number(c.value),
      description: c.description,
      minNights: c.min_nights,
      endsOn: c.ends_on,
    }));

  const packages: PublicPackage[] = (packagesRes.data ?? []).map((p) => ({
    name: p.name,
    description: p.description,
    inclusions: p.inclusions ?? [],
    minNights: p.min_nights,
    couponCode: p.coupon_code,
  }));

  return { offers, packages };
}

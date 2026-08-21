import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_SETTINGS, type PricingSettings, type RateOverride } from "@/lib/pricing";

/**
 * Loads the two things pricing depends on: the house settings and any seasonal
 * rate overrides.
 *
 * Both fall back to defaults rather than throwing. A missing settings row must
 * not take the booking page down — it should quote at the documented default
 * and keep working.
 */

type Loaded = {
  settings: PricingSettings;
  overrides: RateOverride[];
  /** Kept out of PricingSettings — the pure pricing module has no use for it. */
  holdHours: number;
  configured: boolean;
};

const DEFAULT_HOLD_HOURS = 24;

export async function loadPricingContext(): Promise<Loaded> {
  if (!isSupabaseConfigured) {
    return { settings: DEFAULT_SETTINGS, overrides: [], holdHours: DEFAULT_HOLD_HOURS, configured: false };
  }
  const supabase = await createClient();
  if (!supabase) return { settings: DEFAULT_SETTINGS, overrides: [], holdHours: DEFAULT_HOLD_HOURS, configured: false };

  const [settingsRes, overridesRes] = await Promise.all([
    supabase
      .from("settings")
      .select("deposit_percent, tax_percent, min_nights, currency, hold_hours")
      .maybeSingle(),
    supabase
      .from("rate_overrides")
      .select("room_id, starts_on, ends_on, nightly_rate_inr, min_nights, priority, label"),
  ]);

  if (settingsRes.error) {
    console.error("[pricing] settings load failed:", settingsRes.error.message);
  }
  if (overridesRes.error) {
    console.error("[pricing] rate overrides load failed:", overridesRes.error.message);
  }

  const s = settingsRes.data;
  return {
    configured: true,
    holdHours: s?.hold_hours ?? DEFAULT_HOLD_HOURS,
    settings: s
      ? {
          depositPercent: s.deposit_percent ?? DEFAULT_SETTINGS.depositPercent,
          taxPercent: Number(s.tax_percent ?? DEFAULT_SETTINGS.taxPercent),
          minNights: s.min_nights ?? DEFAULT_SETTINGS.minNights,
          currency: s.currency ?? DEFAULT_SETTINGS.currency,
        }
      : DEFAULT_SETTINGS,
    overrides: (overridesRes.data ?? []).map((o) => ({
      roomId: o.room_id,
      startsOn: o.starts_on,
      endsOn: o.ends_on,
      nightlyRateInr: o.nightly_rate_inr,
      minNights: o.min_nights,
      priority: o.priority ?? 0,
      label: o.label,
    })),
  };
}

import { site } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Site copy a host can edit, with the built-in values as the floor.
 *
 * Every getter falls back to what is in lib/site.ts. That matters because the
 * admin panel writes these rows and the public site reads them, and the two
 * were previously not connected at all — a host could edit the phone number
 * and nothing on the site would change. A write-only settings screen is worse
 * than none, because it quietly lies about having worked.
 *
 * Falling back rather than showing an empty string means an unfilled row never
 * blanks out a real detail, and the site still renders correctly if Supabase
 * is unreachable.
 */

export type SiteCopy = {
  phone: string;
  email: string;
  address: string;
  checkIn: string;
  checkOut: string;
  bookingIntro: string;
  houseRules: string;
};

const FALLBACK: SiteCopy = {
  phone: site.phone,
  email: "",
  address: "",
  checkIn: "",
  checkOut: "",
  bookingIntro: "",
  houseRules: "",
};

export async function loadSiteCopy(): Promise<SiteCopy> {
  if (!isSupabaseConfigured) return FALLBACK;
  const supabase = await createClient();
  if (!supabase) return FALLBACK;

  const { data, error } = await supabase.from("site_content").select("key, value");
  if (error) {
    console.error("[content] site_content load failed:", error.message);
    return FALLBACK;
  }

  const map = new Map((data ?? []).map((r) => [r.key, (r.value ?? "").trim()]));
  const pick = (key: string, fallback: string) => map.get(key) || fallback;

  return {
    phone: pick("contact_phone", FALLBACK.phone),
    email: pick("contact_email", FALLBACK.email),
    address: pick("address_line", FALLBACK.address),
    checkIn: pick("checkin_window", FALLBACK.checkIn),
    checkOut: pick("checkout_window", FALLBACK.checkOut),
    bookingIntro: pick("booking_intro", FALLBACK.bookingIntro),
    houseRules: pick("house_rules", FALLBACK.houseRules),
  };
}

export type Faq = { question: string; answer: string };

/**
 * Questions a host has written, if any.
 *
 * Returns an empty array rather than throwing when the table is missing or
 * unreachable, so the page can fall back to its built-in list. The built-in
 * answers cover the awkward things — the stairs, the market, housekeeping —
 * and losing those to a database hiccup would be a real regression.
 */
export async function loadFaqs(): Promise<Faq[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("faqs")
    .select("question, answer")
    .order("sort_order");

  if (error) {
    console.error("[content] faqs load failed:", error.message);
    return [];
  }
  return (data ?? []).map((f) => ({ question: f.question, answer: f.answer }));
}

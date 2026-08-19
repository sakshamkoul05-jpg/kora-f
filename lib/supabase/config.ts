/**
 * Supabase configuration.
 *
 * The site must build and serve correctly with NO Supabase project attached —
 * the marketing pages are the bulk of it and cannot be held hostage by a
 * missing env var. So configuration is optional at build time and checked at
 * the point of use: the booking form degrades to WhatsApp, which is how the
 * house took bookings before any of this existed.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True only when both values are present and look real. */
export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20;

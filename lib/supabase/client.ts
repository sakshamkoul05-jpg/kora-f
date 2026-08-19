"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Browser Supabase client. Used only for host sign-in on /admin.
 *
 * Guest booking requests deliberately do NOT go through this — they post to a
 * route handler instead, so validation, the honeypot and rate limiting run on
 * the server where a visitor cannot skip them.
 */
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

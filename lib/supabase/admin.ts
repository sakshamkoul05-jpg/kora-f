import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * There is exactly one legitimate caller: the Razorpay webhook, which arrives
 * with no user session but is authenticated by an HMAC signature over the raw
 * body. It has to move a booking to confirmed, and no anonymous role can be
 * allowed to do that — granting anon the ability to mark a booking paid would
 * hand it to anyone who can guess a reference.
 *
 * Rules for this file:
 *   - never import it into a client component, or anything reachable from one;
 *   - never use it to serve a request on behalf of a guest;
 *   - verify the caller BEFORE reaching for it, not after.
 *
 * The key deliberately has no NEXT_PUBLIC_ prefix, so Next will not inline it
 * into the browser bundle even by accident.
 */

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isServiceRoleConfigured = Boolean(URL_ && SERVICE_KEY);

export function createAdminClient(): SupabaseClient | null {
  if (!isServiceRoleConfigured) return null;
  return createSupabaseClient(URL_, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Small in-memory rate limiter for the public booking endpoint.
 *
 * HONEST LIMITATION: this is per-instance memory. On a single Vercel instance
 * it stops the obvious flood; across a scaled or serverless deployment each
 * instance keeps its own counter, so the effective limit is (limit × instances)
 * and a cold start resets it. It is a speed bump, not a guarantee.
 *
 * For a six-room guesthouse taking a handful of enquiries a day, a speed bump
 * plus the honeypot is proportionate. If this ever needs to be real, move the
 * counter to Postgres or Upstash — do not just raise the number here.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 60 * 60 * 1000 } = {}
): { ok: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();

  // Opportunistic sweep so the map cannot grow without bound.
  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    if (buckets.size > MAX_KEYS) buckets.clear();
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  return {
    ok: existing.count <= limit,
    remaining,
    retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

/**
 * Best-effort client IP. `x-forwarded-for` is client-controllable in general,
 * but on Vercel and similar proxies the left-most entry is set by the edge and
 * is trustworthy enough for rate limiting. It is never used for authorisation.
 */
export function clientKey(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

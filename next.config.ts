import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * Vercel already sends HSTS. Everything below was missing, and each one closes
 * a real hole rather than ticking a scanner box.
 *
 * Content-Security-Policy is deliberately ABSENT. A useful CSP here needs a
 * per-request nonce threaded through proxy.ts and onto Next's inline bootstrap
 * script; the shortcut of allowing 'unsafe-inline' produces a header that
 * passes a scanner and stops nothing. It is worth doing properly, as its own
 * change, with the whole site re-tested — not bolted on here. See BACKEND.md.
 */
const securityHeaders = [
  // Stops a browser second-guessing a Content-Type — the vector where an
  // uploaded "image" gets sniffed as HTML and executed.
  { key: "X-Content-Type-Options", value: "nosniff" },

  // No one has any business framing a booking form. Clickjacking a booking
  // request is cheap and the page has no legitimate embedded use.
  { key: "X-Frame-Options", value: "DENY" },

  // Send the full URL to ourselves, only the origin to third parties. Booking
  // URLs carry dates and a room; the referrer should not leak a guest's plans
  // to every asset host they touch.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Nothing here needs a camera, a microphone, or a location. Denying them
  // outright means a future dependency cannot quietly start asking.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },

  // Keeps this origin out of other pages' process, which is what makes the
  // stricter cross-origin isolation available later if it is ever wanted.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  images: {
    // AVIF first. On the photography here it lands roughly 20-30% under WebP
    // at the same quality, and the browser falls back on its own if it cannot
    // take AVIF. Source photographs are 300KB-1.3MB, so this is the single
    // biggest weight saving available without touching the originals.
    formats: ["image/avif", "image/webp"],

    // The optimiser was answering `max-age=0, must-revalidate`, so every
    // visitor re-fetched every photograph. These are static images of a
    // building that does not change; 30 days is not aggressive.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // The admin holds guests' names, emails and phone numbers. It must
        // never sit in a shared cache or a browser's back-forward cache.
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // The image optimiser inherits cache-control from the source file, and
        // without this it answered `max-age=0, must-revalidate` — so a repeat
        // visitor re-downloaded every photograph on every page view. The CDN
        // was caching them, which protected the origin and did nothing at all
        // for the person on hotel wifi in McLeodganj.
        //
        // These files are content-addressed by name and only ever replaced by
        // a deploy, so a year is safe.
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;

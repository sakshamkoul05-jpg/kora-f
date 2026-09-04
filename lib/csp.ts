/**
 * Content-Security-Policy.
 *
 * Two policies, because this site is two things.
 *
 * The marketing pages are statically generated, and a nonce cannot exist on a
 * static page — it is baked at build time, when there is no request. Forcing
 * all 22 of them dynamic to earn a nonce would trade away static rendering,
 * CDN caching and the cost profile of the whole site, to defend pages that
 * render no user input at all. That is a bad trade, and pretending otherwise
 * by shipping `'unsafe-inline'` beside a nonce — which silently disables the
 * nonce in modern browsers — would be worse than either.
 *
 * So: the pages that handle guest data and credentials are already dynamic
 * (/admin, /book), and those get a real nonce with 'strict-dynamic'. The
 * static pages get a policy without one, which still forbids loading script
 * from any other origin, framing, base-uri hijacking, and posting a form
 * anywhere but back here.
 *
 * `style-src` allows 'unsafe-inline' in both. React's `style={{}}` compiles to
 * inline style attributes, which CSP3 blocks under style-src, and they are all
 * over this codebase — the header's flag colours, the honeypot's positioning.
 * An inline style cannot exfiltrate data the way an inline script can, so this
 * is the trade worth making rather than rewriting every one of them.
 */

const SUPABASE_ORIGIN = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "";
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
})();

/** Routes that are server-rendered per request, and can therefore carry a nonce. */
const NONCE_ROUTES = ["/admin", "/book", "/booking"];

/**
 * Razorpay Standard Checkout, which needs four separate allowances:
 * the script itself, the iframe the modal renders into, the endpoints it calls
 * (including lumberjack, its telemetry — blocked, it retries and slows
 * checkout), and its card-network artwork.
 *
 * On nonce routes `'strict-dynamic'` makes the script-src host list moot, since
 * a script inserted by an already-trusted script is trusted. It stays for the
 * routes without a nonce, where the host list is the only thing permitting it.
 */
const RAZORPAY = {
  script: "https://checkout.razorpay.com",
  frame: "https://api.razorpay.com https://checkout.razorpay.com",
  connect: "https://api.razorpay.com https://lumberjack.razorpay.com",
  img: "https://cdn.razorpay.com",
};

export function routeNeedsNonce(pathname: string): boolean {
  return NONCE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function buildCsp({
  nonce,
  isDev,
}: {
  nonce: string | null;
  isDev: boolean;
}): string {
  // React uses eval in development to rebuild server stacks in the browser.
  // Production does not, and must not be given it.
  const devEval = isDev ? " 'unsafe-eval'" : "";

  const scriptSrc = nonce
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'${devEval}`
    : `'self' 'unsafe-inline' ${RAZORPAY.script}${devEval}`;

  // The browser talks to Supabase directly — signing a host in, checking a
  // coupon — so its origin has to be reachable.
  const connect = ["'self'", SUPABASE_ORIGIN, RAZORPAY.connect].filter(Boolean).join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    // blob: and data: are next/image's placeholders, not third-party content.
    `img-src 'self' blob: data: ${RAZORPAY.img}`,
    // next/font self-hosts everything at build time; nothing is fetched from
    // Google at runtime.
    "font-src 'self'",
    `connect-src ${connect}`,
    // Without this the checkout modal — an iframe — is refused outright, and
    // there is no console error that says so plainly.
    `frame-src 'self' ${RAZORPAY.frame}`,
    "object-src 'none'",
    "base-uri 'self'",
    // A booking form must not be able to post a guest's details elsewhere.
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/** A fresh, unguessable value per request. */
export function newNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

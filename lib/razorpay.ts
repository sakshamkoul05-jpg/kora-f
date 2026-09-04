import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay, behind a config gate.
 *
 * Nothing here is reachable from the browser. The key secret and the webhook
 * secret are server-only by construction — no NEXT_PUBLIC_ prefix, and this
 * module is never imported into a client component. If either ever needs to
 * appear in the bundle, something has gone wrong upstream.
 *
 * With no keys set, `isRazorpayConfigured` is false and the whole booking flow
 * still works as a pure request system: a host accepts, the guest is told a
 * host will send payment details, and no link is generated. That is the live
 * state until the keys arrive, so it is a supported path rather than an
 * error case.
 *
 * Payment LINKS rather than the checkout widget, deliberately: the guest is
 * paying after a conversation, often hours later and probably on a phone, from
 * a WhatsApp message. A link survives that. An embedded checkout does not.
 */

const KEY_ID = process.env.RAZORPAY_KEY_ID ?? "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

export const isRazorpayConfigured = Boolean(KEY_ID && KEY_SECRET);
export const isRazorpayWebhookConfigured = Boolean(WEBHOOK_SECRET);

const API = "https://api.razorpay.com/v1";

/** Rupees to paise. The one place the unit changes. */
export function toPaise(amountInr: number): number {
  return Math.round(amountInr) * 100;
}

export type PaymentLink = {
  id: string;
  url: string;
  amountInr: number;
};

function authHeader(): string {
  return `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`;
}

/**
 * Creates a payment link for a deposit.
 *
 * `reference_id` is the booking reference, which Razorpay enforces as unique —
 * so a double-click cannot produce two links for the same booking.
 */
export async function createDepositLink(opts: {
  reference: string;
  amountInr: number;
  description: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  expiresAt: Date;
  callbackUrl?: string;
}): Promise<
  { ok: true; link: PaymentLink } | { ok: false; error: string }
> {
  if (!isRazorpayConfigured) return { ok: false, error: "not_configured" };

  // Razorpay rejects an expiry less than 15 minutes out. A hold shorter than
  // that would be unusable anyway, but clamp rather than 400.
  const minExpiry = Math.floor(Date.now() / 1000) + 16 * 60;
  const expireBy = Math.max(minExpiry, Math.floor(opts.expiresAt.getTime() / 1000));

  try {
    const res = await fetch(`${API}/payment_links`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: toPaise(opts.amountInr),
        currency: "INR",
        accept_partial: false,
        description: opts.description,
        reference_id: opts.reference,
        expire_by: expireBy,
        customer: {
          name: opts.guestName,
          email: opts.guestEmail,
          ...(opts.guestPhone ? { contact: opts.guestPhone } : {}),
        },
        notify: { sms: Boolean(opts.guestPhone), email: true },
        reminder_enable: true,
        notes: { booking_reference: opts.reference },
        ...(opts.callbackUrl
          ? { callback_url: opts.callbackUrl, callback_method: "get" }
          : {}),
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Razorpay's own message is useful to a host and safe to surface — it
      // says things like "amount below minimum", not internal details.
      const msg = body?.error?.description ?? `Razorpay returned ${res.status}`;
      console.error("[razorpay] payment link failed:", msg);
      return { ok: false, error: msg };
    }

    return {
      ok: true,
      link: { id: body.id, url: body.short_url, amountInr: opts.amountInr },
    };
  } catch (e) {
    console.error("[razorpay] payment link threw:", (e as Error).message);
    return { ok: false, error: "Could not reach Razorpay." };
  }
}

/**
 * Verifies a webhook came from Razorpay.
 *
 * Must be given the RAW request body — parsing and re-serialising JSON changes
 * the bytes and the signature will never match. Compared with timingSafeEqual
 * rather than `===`, so the comparison does not leak the expected digest one
 * byte at a time.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  // timingSafeEqual throws on a length mismatch, which is itself an answer.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Verifies the signature Razorpay puts on a checkout callback.
 * Kept separate from the webhook check: different secret, different payload.
 */
export function verifyPaymentSignature(opts: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!KEY_SECRET) return false;
  const expected = createHmac("sha256", KEY_SECRET)
    .update(`${opts.orderId}|${opts.paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(opts.signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** The key id is safe in the browser — Standard Checkout needs it there. */
export const RAZORPAY_KEY_ID = KEY_ID;

export type RazorpayOrder = {
  id: string;
  amountPaise: number;
  currency: string;
};

/**
 * Creates an order for Standard Checkout.
 *
 * The amount is a parameter, but every caller MUST derive it from the booking
 * row rather than from anything the browser sent. Razorpay's own integration
 * guide shows the frontend posting an amount; doing that here would let a
 * guest pay one rupee for a fifteen-hundred-rupee deposit by editing a number
 * in devtools. See app/api/payments/order/route.ts, which reads it from the
 * database.
 *
 * `receipt` carries the booking reference so a payment can always be traced
 * back to a stay from the Razorpay dashboard alone.
 */
export async function createOrder(opts: {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ ok: true; order: RazorpayOrder } | { ok: false; error: string; status: number }> {
  if (!isRazorpayConfigured) return { ok: false, error: "not_configured", status: 503 };

  const amountPaise = toPaise(opts.amountInr);
  // Razorpay's floor. A booking cheaper than one rupee is a bug upstream.
  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    return { ok: false, error: "Amount must be at least ₹1.", status: 400 };
  }

  try {
    const res = await fetch(`${API}/orders`, {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        // Razorpay caps this at 40 characters.
        receipt: opts.receipt.slice(0, 40),
        notes: opts.notes ?? {},
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (res.status === 401) {
      console.error("[razorpay] order rejected: bad credentials");
      return { ok: false, error: "Payment provider rejected our credentials.", status: 401 };
    }
    if (!res.ok) {
      const msg = body?.error?.description ?? `Razorpay returned ${res.status}`;
      console.error("[razorpay] order failed:", msg);
      return { ok: false, error: msg, status: 500 };
    }

    return {
      ok: true,
      order: { id: body.id, amountPaise: body.amount, currency: body.currency },
    };
  } catch (e) {
    console.error("[razorpay] order threw:", (e as Error).message);
    return { ok: false, error: "Could not reach Razorpay.", status: 500 };
  }
}

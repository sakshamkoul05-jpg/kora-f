import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";

/**
 * The module reads its secrets at import time, so they are set before the
 * dynamic import below rather than at the top of the file.
 */
const WEBHOOK_SECRET = "test_webhook_secret_value";
const KEY_SECRET = "test_key_secret_value";
process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
process.env.RAZORPAY_KEY_ID = "rzp_test_key";
process.env.RAZORPAY_KEY_SECRET = KEY_SECRET;

const { verifyWebhookSignature, verifyPaymentSignature, toPaise, isRazorpayConfigured } =
  await import("./razorpay.ts");

const sign = (body: string, secret = WEBHOOK_SECRET) =>
  createHmac("sha256", secret).update(body).digest("hex");

test("configuration is detected from the environment", () => {
  assert.equal(isRazorpayConfigured, true);
});

test("toPaise converts rupees without floating point drift", () => {
  assert.equal(toPaise(1), 100);
  assert.equal(toPaise(1875), 187_500);
  // 19.99 * 100 is 1998.9999999999998 in IEEE 754; rupees are integers here.
  assert.equal(toPaise(1999), 199_900);
});

test("a genuine webhook signature is accepted", () => {
  const body = JSON.stringify({ event: "payment_link.paid", payload: {} });
  assert.equal(verifyWebhookSignature(body, sign(body)), true);
});

test("a tampered body is rejected", () => {
  const body = JSON.stringify({ event: "payment_link.paid", amount: 100 });
  const signature = sign(body);
  const tampered = JSON.stringify({ event: "payment_link.paid", amount: 999_999 });
  assert.equal(verifyWebhookSignature(tampered, signature), false);
});

test("a signature from the wrong secret is rejected", () => {
  const body = JSON.stringify({ event: "payment_link.paid" });
  assert.equal(verifyWebhookSignature(body, sign(body, "attacker_secret")), false);
});

test("an empty or missing signature is rejected", () => {
  const body = JSON.stringify({ event: "payment_link.paid" });
  assert.equal(verifyWebhookSignature(body, ""), false);
  // A shorter digest must not pass by prefix-matching.
  assert.equal(verifyWebhookSignature(body, sign(body).slice(0, 32)), false);
});

test("re-serialised JSON does not verify, which is why raw bytes are required", () => {
  const raw = '{"event":"payment_link.paid","payload":{"a":1}}';
  const signature = sign(raw);
  const reserialised = JSON.stringify(JSON.parse(raw).payload);
  assert.equal(verifyWebhookSignature(raw, signature), true);
  assert.equal(verifyWebhookSignature(reserialised, signature), false);
});

test("checkout callback signatures verify over orderId|paymentId", () => {
  const orderId = "order_ABC123";
  const paymentId = "pay_XYZ789";
  const good = createHmac("sha256", KEY_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  assert.equal(verifyPaymentSignature({ orderId, paymentId, signature: good }), true);
  // Swapping the two must not verify — order is part of the message.
  const swapped = createHmac("sha256", KEY_SECRET).update(`${paymentId}|${orderId}`).digest("hex");
  assert.equal(verifyPaymentSignature({ orderId, paymentId, signature: swapped }), false);
});

test("a payment signature for a different payment is rejected", () => {
  const good = createHmac("sha256", KEY_SECRET).update("order_1|pay_1").digest("hex");
  assert.equal(
    verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_2", signature: good }),
    false
  );
});

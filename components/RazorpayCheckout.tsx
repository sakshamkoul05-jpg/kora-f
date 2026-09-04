"use client";

import { useState } from "react";
import { BowlRing } from "@/components/motion/BowlRing";
import { formatInr } from "@/lib/pricing";

/**
 * Razorpay Standard Checkout.
 *
 * The modal opens over the site, so a guest who is already here never leaves
 * it. The payment LINK is kept alongside for the other case — someone paying
 * hours later from a WhatsApp message — because a link survives that and an
 * embedded modal does not.
 *
 * Nothing about the amount is decided here. The order endpoint reads it from
 * the booking row; this component sends a reference and an email and displays
 * whatever comes back.
 *
 * Every ending is handled, because on a real phone every one of them happens:
 * the modal dismissed, the payment failed, the network dropped between paying
 * and verifying. The last is the dangerous one — the money has moved and the
 * page cannot prove it — so the message tells the guest their payment may well
 * have gone through and to check rather than pay twice.
 */

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type State = "idle" | "opening" | "verifying" | "paid" | "error";

export function RazorpayCheckout({
  reference,
  email,
  depositInr,
  onPaid,
}: {
  reference: string;
  email: string;
  depositInr: number | null;
  onPaid?: (reference: string) => void;
}) {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function pay() {
    setState("opening");
    setMessage(null);

    const ready = await loadRazorpay();
    if (!ready) {
      setState("error");
      setMessage(
        "We couldn't load the payment window. Check your connection, or message us and we'll send a payment link."
      );
      return;
    }

    let order: {
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
      name: string;
      reference: string;
    };
    try {
      const res = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMessage(body.message ?? "We couldn't start that payment.");
        return;
      }
      order = body;
    } catch {
      setState("error");
      setMessage("We couldn't reach the server. Check your connection and try again.");
      return;
    }

    const rzp = new window.Razorpay!({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Kora House",
      description: `Deposit for ${order.reference}`,
      prefill: { name: order.name, email },
      notes: { booking_reference: order.reference },
      theme: { color: "#3a6130" },
      modal: {
        // Dismissing is not an error — most people who close a payment window
        // meant to.
        ondismiss: () => {
          setState("idle");
          setMessage(null);
        },
      },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        setState("verifying");
        try {
          const res = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, reference, email }),
          });
          const body = await res.json().catch(() => ({}));
          if (body.ok) {
            setState("paid");
            setMessage(null);
            onPaid?.(body.reference ?? reference);
          } else {
            setState("error");
            setMessage(
              body.message ??
                "Your payment may have gone through, but we couldn't confirm it. Please message us before paying again."
            );
          }
        } catch {
          // The money may well have moved. Never suggest paying again.
          setState("error");
          setMessage(
            "Your payment may have gone through, but we lost the connection before we could confirm it. Message us with your reference and we'll check — please don't pay twice."
          );
        }
      },
    });

    rzp.open();
    setState("idle");
  }

  if (state === "paid") {
    return (
      <div className="rounded-[var(--radius-kora)] border border-deodar/40 bg-deodar/[0.08] px-5 py-4">
        <p className="font-medium text-deodar-deep">Deposit received — you&apos;re booked.</p>
        <p className="mt-1 text-sm text-ink-soft">
          We&apos;ll see you on the hillside. A host will be in touch before you
          travel.
        </p>
      </div>
    );
  }

  return (
    <div>
      <BowlRing className="rounded-[var(--radius-kora)]" disabled={state !== "idle"}>
        <button
          type="button"
          onClick={pay}
          disabled={state !== "idle"}
          className="rounded-[var(--radius-kora)] bg-deodar-deep px-6 py-3.5 font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {state === "opening"
            ? "Opening…"
            : state === "verifying"
              ? "Confirming…"
              : `Pay ${depositInr !== null ? formatInr(depositInr) : "the deposit"} now`}
        </button>
      </BowlRing>

      {message && (
        <p
          role="alert"
          className="mt-3 max-w-md rounded-[var(--radius-kora)] border border-maroon/30 bg-maroon/[0.06] px-4 py-3 text-sm leading-relaxed text-maroon"
        >
          {message}
        </p>
      )}
    </div>
  );
}

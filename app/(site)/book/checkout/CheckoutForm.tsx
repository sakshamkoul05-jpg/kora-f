"use client";

import Link from "next/link";
import { useState } from "react";
import { whatsappUrl } from "@/lib/site";

type Errors = Record<string, string>;
type Status = "idle" | "sending" | "sent" | "error";

/**
 * Guest details only. Dates, room and party size were chosen on the way here
 * and arrive as props, so this asks for the four things a host actually needs
 * to reply — and no more. Every extra field on a booking form is a guest who
 * gives up halfway.
 *
 * The submission still goes through /api/booking-requests, which revalidates
 * everything server-side: the props below are a convenience, not a source of
 * truth, and a tampered payload is rejected by the same rules as before.
 */
export function CheckoutForm({
  roomSlug,
  roomName,
  from,
  to,
  adults,
  childCount,
}: {
  roomSlug: string;
  roomName: string;
  from: string;
  to: string;
  adults: number;
  childCount: number;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrors({});
    setFormError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      checkIn: from,
      checkOut: to,
      adults,
      children: childCount,
      roomSlug,
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      country: String(fd.get("country") ?? ""),
      message: String(fd.get("message") ?? ""),
      website: String(fd.get("website") ?? ""), // honeypot
    };

    try {
      const res = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        setReference(body.reference ?? null);
        setStatus("sent");
        return;
      }
      if (body.errors) setErrors(body.errors);
      setFormError(body.message ?? "Something went wrong. Please try WhatsApp.");
      setStatus("error");
    } catch {
      setFormError(
        "We couldn't reach the server. Please check your connection, or message us on WhatsApp."
      );
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div>
        <p className="display-md">Thank you — that&apos;s with us.</p>
        {reference && (
          <p className="mt-4 text-ink-soft">
            Your reference is{" "}
            <span className="font-mono font-medium text-ink">{reference}</span>
          </p>
        )}
        <p className="mt-4 leading-relaxed text-ink-soft">
          One of the hosts will read it and reply, usually the same day. If they
          accept, you&apos;ll get a link to pay the deposit and {roomName} is
          yours from that moment. Nothing has been charged.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-[var(--radius-kora)] border border-ink/20 px-5 py-2.5 text-sm text-ink transition-colors hover:border-ink/40"
          >
            Back to the house
          </Link>
          <a
            href={whatsappUrl(`Hello — I've just sent a request${reference ? ` (${reference})` : ""}.`)}
            className="rounded-[var(--radius-kora)] border border-ink/20 px-5 py-2.5 text-sm text-ink transition-colors hover:border-ink/40"
          >
            Message us on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <p className="eyebrow text-deodar">Your details</p>

      {/*
        Honeypot. Off-screen rather than display:none — some bots skip hidden
        fields but fill positioned ones. aria-hidden and tabIndex -1 keep it
        away from screen readers and the tab order.
      */}
      <div
        aria-hidden
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
      >
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Field label="Your name" name="name" error={errors.name} required autoComplete="name" />
        <Field label="Email" name="email" type="email" error={errors.email} required autoComplete="email" />
        <Field label="Phone or WhatsApp" name="phone" type="tel" error={errors.phone} autoComplete="tel" hint="optional" />
        <Field label="Country" name="country" error={errors.country} autoComplete="country-name" hint="optional" />
      </div>

      <label className="mt-5 block">
        <span className="eyebrow text-ink-soft">
          Anything we should know? <span className="text-ink/40">optional</span>
        </span>
        <textarea
          name="message"
          rows={4}
          className="mt-2 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2.5 text-ink"
          placeholder="Why you're coming, when you'll arrive, anything that matters."
        />
        {errors.message && <span className="mt-1 block text-sm text-maroon">{errors.message}</span>}
      </label>

      {formError && (
        <p role="alert" className="mt-5 rounded-[var(--radius-kora)] border border-maroon/30 bg-maroon/[0.06] px-4 py-3 text-sm text-maroon">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-7 w-full rounded-[var(--radius-kora)] bg-deodar px-6 py-3.5 font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send request"}
      </button>

      <p className="mt-4 text-center text-sm text-ink/50">
        This is a request, not a confirmed booking. Nothing is charged now.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
  required,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-ink-soft">
        {label} {hint && <span className="text-ink/40">{hint}</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        className="mt-2 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2.5 text-ink"
      />
      {error && <span className="mt-1 block text-sm text-maroon">{error}</span>}
    </label>
  );
}

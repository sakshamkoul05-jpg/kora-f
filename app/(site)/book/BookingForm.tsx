"use client";

import Link from "next/link";
import { useState } from "react";
import { rooms } from "@/lib/rooms";
import { site, whatsappUrl } from "@/lib/site";

type Errors = Record<string, string>;
type Status = "idle" | "sending" | "sent" | "error";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * A booking REQUEST form — worded as one throughout, because that is what it
 * is. The hosts read each request and reply; nothing here reserves a room, and
 * the copy never implies otherwise.
 *
 * WhatsApp stays visible the whole way through. If this form fails, is switched
 * off, or the guest simply prefers it, the route the house has always used is
 * one tap away.
 */
export function BookingForm() {
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
      checkIn: String(fd.get("checkIn") ?? ""),
      checkOut: String(fd.get("checkOut") ?? ""),
      adults: Number(fd.get("adults") ?? 1),
      children: Number(fd.get("children") ?? 0),
      roomSlug: String(fd.get("roomSlug") ?? "") || null,
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
      <div
        className="rounded-[var(--radius-card)] border border-deodar/35 bg-deodar/[0.07] p-8"
        role="status"
        aria-live="polite"
      >
        <p className="display-md">Thank you — that&apos;s with us.</p>
        {reference && (
          <p className="mt-3 font-data text-sm text-ink-soft">
            Your reference is <strong className="text-ink">{reference}</strong>
          </p>
        )}
        <p className="mt-4 leading-relaxed text-ink-soft">
          One of the hosts will read it and reply, usually the same day. This is
          a request rather than a confirmed booking — we like to talk with
          guests first, so nothing is held until we&apos;ve written back.
        </p>
        <a
          href={whatsappUrl(
            `Hello — I've just sent a booking request${reference ? ` (${reference})` : ""}.`
          )}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block border-b border-maroon/40 pb-1 text-sm text-maroon transition-colors hover:border-maroon"
        >
          Message us on WhatsApp about it
        </a>
      </div>
    );
  }

  const err = (k: string) =>
    errors[k] ? (
      <p id={`${k}-error`} className="mt-1.5 text-xs text-maroon">
        {errors[k]}
      </p>
    ) : null;

  const inputCls =
    "mt-1.5 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper-raised px-3.5 py-2.5 text-[15px] text-ink transition-colors focus:border-maroon focus:outline-none";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {/* Honeypot. Parked off-screen rather than display:none — it has to stay
          in the DOM for a naive bot to find and fill, while no person ever sees
          it. aria-hidden + tabIndex -1 keep it away from screen readers and the
          tab order. A filled value is silently discarded server-side. */}
      <div
        aria-hidden
        style={{ position: "absolute", left: "-9999px", top: "auto", width: 1, height: 1, overflow: "hidden" }}
      >
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="checkIn" className="eyebrow text-ink/50">
            Arriving
          </label>
          <input
            id="checkIn"
            name="checkIn"
            type="date"
            required
            min={today()}
            className={inputCls}
            aria-invalid={!!errors.checkIn}
            aria-describedby={errors.checkIn ? "checkIn-error" : undefined}
          />
          {err("checkIn")}
        </div>
        <div>
          <label htmlFor="checkOut" className="eyebrow text-ink/50">
            Leaving
          </label>
          <input
            id="checkOut"
            name="checkOut"
            type="date"
            required
            min={today()}
            className={inputCls}
            aria-invalid={!!errors.checkOut}
            aria-describedby={errors.checkOut ? "checkOut-error" : undefined}
          />
          {err("checkOut")}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="adults" className="eyebrow text-ink/50">
            Adults
          </label>
          <input
            id="adults"
            name="adults"
            type="number"
            min={1}
            max={12}
            defaultValue={2}
            className={inputCls}
          />
          {err("adults")}
        </div>
        <div>
          <label htmlFor="children" className="eyebrow text-ink/50">
            Children
          </label>
          <input
            id="children"
            name="children"
            type="number"
            min={0}
            max={12}
            defaultValue={0}
            className={inputCls}
          />
          {err("children")}
        </div>
        <div>
          <label htmlFor="roomSlug" className="eyebrow text-ink/50">
            Room <span className="normal-case tracking-normal text-ink/35">(optional)</span>
          </label>
          <select id="roomSlug" name="roomSlug" className={inputCls} defaultValue="">
            <option value="">No preference</option>
            {rooms.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.name} (Room {r.number})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="eyebrow text-ink/50">
            Your name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={inputCls}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {err("name")}
        </div>
        <div>
          <label htmlFor="email" className="eyebrow text-ink/50">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputCls}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {err("email")}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="eyebrow text-ink/50">
            Phone or WhatsApp{" "}
            <span className="normal-case tracking-normal text-ink/35">(optional)</span>
          </label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputCls} />
          {err("phone")}
        </div>
        <div>
          <label htmlFor="country" className="eyebrow text-ink/50">
            Country <span className="normal-case tracking-normal text-ink/35">(optional)</span>
          </label>
          <input
            id="country"
            name="country"
            type="text"
            autoComplete="country-name"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="eyebrow text-ink/50">
          Anything we should know?
        </label>
        <textarea id="message" name="message" rows={4} className={inputCls} />
        {err("message")}
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-[var(--radius-kora)] border border-maroon/35 bg-maroon/[0.07] p-4 text-sm text-ink-soft"
        >
          {formError}{" "}
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noreferrer"
            className="border-b border-maroon/40 text-maroon"
          >
            Message us instead
          </a>
          .
        </div>
      )}

      <div className="flex flex-wrap items-center gap-5 pt-2">
        <button
          type="submit"
          disabled={status === "sending"}
          className="lamp-hover rounded-[var(--radius-kora)] bg-maroon px-8 py-3.5 font-display text-[15px] tracking-wide text-paper transition-colors hover:bg-maroon-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send request"}
        </button>
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
        >
          Or message us on WhatsApp
        </a>
      </div>

      <p className="text-xs leading-relaxed text-ink/45">
        This is a request, not a confirmed booking — the hosts read every one and
        write back, usually the same day. We keep your details only to answer
        it. Prefer to talk first? <span className="font-data">{site.phone}</span>.{" "}
        <Link href="/faq" className="underline underline-offset-2">
          What to expect
        </Link>
        .
      </p>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { nightsBetween } from "@/lib/booking";
import { formatInr } from "@/lib/pricing";
import { createManualBooking } from "./crm-actions";

/**
 * Recording a booking that did not come through the website.
 *
 * For this house that is most of them — someone messages on WhatsApp, a host
 * says yes, and until that lands here the calendar is wrong and the
 * availability shown to strangers is built on a false picture.
 *
 * Defaults to "confirmed" because a booking a host is typing in has already
 * been agreed out loud. The price prefills from the rate card and is editable,
 * since a phone booking is usually a negotiated number.
 */
export function NewBooking({
  rooms,
  depositPercent,
}: {
  rooms: { id: string; name: string; number: number; rateInr: number | null }[];
  depositPercent: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const blank = {
    roomId: rooms[0]?.id ?? "",
    checkIn: "",
    checkOut: "",
    adults: "2",
    childCount: "0",
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestCountry: "",
    message: "",
    source: "whatsapp" as const,
    status: "confirmed" as const,
    totalInr: "",
  };
  const [form, setForm] = useState(blank);
  const set = (k: keyof typeof blank, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError(null);
  };

  const nights = form.checkIn && form.checkOut ? nightsBetween(form.checkIn, form.checkOut) : 0;
  const room = rooms.find((r) => r.id === form.roomId);
  const suggested = room?.rateInr && nights > 0 ? room.rateInr * nights : null;
  const effectiveTotal = form.totalInr ? Number(form.totalInr) : suggested;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(null);
    startTransition(async () => {
      const res = await createManualBooking({
        roomId: form.roomId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        adults: Number(form.adults),
        childCount: Number(form.childCount),
        guestName: form.guestName,
        guestEmail: form.guestEmail,
        guestPhone: form.guestPhone,
        guestCountry: form.guestCountry,
        message: form.message,
        source: form.source,
        status: form.status,
        totalInr: form.totalInr ? Number(form.totalInr) : null,
      });
      if (!res.ok) {
        setError(res.message ?? "Couldn't save that.");
        return;
      }
      setDone(res.reference ?? "saved");
      setForm(blank);
    });
  }

  if (!open) {
    return (
      <div className="mt-8">
        <button
          type="button"
          onClick={() => { setOpen(true); setDone(null); }}
          className="rounded-[var(--radius-kora)] bg-deodar-deep px-5 py-2.5 font-display text-sm text-paper"
        >
          Add a booking
        </button>
        {done && (
          <span className="ml-3 text-sm text-deodar-deep">
            Saved as <span className="font-data">{done}</span>
          </span>
        )}
        <p className="mt-2 text-xs text-ink/45">
          For anything that came by phone, WhatsApp or in person.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-8 rounded-[var(--radius-card)] border border-ink/15 bg-paper-raised p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="display-md">Add a booking</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-ink/45 underline underline-offset-2"
        >
          Close
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-[var(--radius-kora)] bg-maroon/10 px-3 py-2 text-sm text-maroon">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <F label="Room">
          <select value={form.roomId} onChange={(e) => set("roomId", e.target.value)} className={I} required>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.name} #{r.number}</option>
            ))}
          </select>
        </F>
        <F label="Arriving">
          <input type="date" value={form.checkIn} onChange={(e) => set("checkIn", e.target.value)} className={I} required />
        </F>
        <F label="Leaving">
          <input type="date" value={form.checkOut} onChange={(e) => set("checkOut", e.target.value)} className={I} required />
        </F>

        <F label="Guest name">
          <input value={form.guestName} onChange={(e) => set("guestName", e.target.value)} className={I} required />
        </F>
        <F label="Phone or WhatsApp" hint="How you'll reach them">
          <input type="tel" value={form.guestPhone} onChange={(e) => set("guestPhone", e.target.value)} className={I} />
        </F>
        <F label="Email" hint="Leave blank for a walk-in">
          <input type="email" value={form.guestEmail} onChange={(e) => set("guestEmail", e.target.value)} className={I} />
        </F>

        <F label="Adults">
          <input type="number" min={1} max={12} value={form.adults} onChange={(e) => set("adults", e.target.value)} className={I} />
        </F>
        <F label="Children">
          <input type="number" min={0} max={12} value={form.childCount} onChange={(e) => set("childCount", e.target.value)} className={I} />
        </F>
        <F label="Country" hint="Optional">
          <input value={form.guestCountry} onChange={(e) => set("guestCountry", e.target.value)} className={I} />
        </F>

        <F label="Came from">
          <select value={form.source} onChange={(e) => set("source", e.target.value)} className={I}>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone</option>
            <option value="walk-in">Walked in</option>
            <option value="email">Email</option>
            <option value="other">Other</option>
          </select>
        </F>
        <F label="Status" hint="Confirmed holds the room straight away">
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className={I}>
            <option value="confirmed">Confirmed — paid or agreed</option>
            <option value="accepted">Held — waiting on a deposit</option>
            <option value="pending">Just an enquiry</option>
          </select>
        </F>
        <F
          label="Total (₹)"
          hint={
            suggested !== null
              ? `Rate card says ${formatInr(suggested)}`
              : "No rate for these dates — type one"
          }
        >
          <input
            type="number"
            min={1}
            value={form.totalInr}
            onChange={(e) => set("totalInr", e.target.value)}
            placeholder={suggested !== null ? String(suggested) : ""}
            className={I}
          />
        </F>
      </div>

      <F label="Note" hint="Anything you want to remember about this booking" className="mt-4 block">
        <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={2} className={I} />
      </F>

      {nights > 0 && effectiveTotal ? (
        <p className="mt-4 text-sm text-ink-soft">
          {nights} night{nights === 1 ? "" : "s"} · {formatInr(effectiveTotal)} total ·{" "}
          {formatInr(Math.round((effectiveTotal * depositPercent) / 100))} deposit at {depositPercent}%
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-[var(--radius-kora)] bg-deodar-deep px-6 py-3 font-display text-sm text-paper disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save booking"}
      </button>
    </form>
  );
}

const I =
  "mt-1.5 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2 text-sm focus:border-maroon focus:outline-none";

function F({
  label,
  hint,
  children,
  className = "block",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="font-data text-[11px] uppercase tracking-wide text-ink/45">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/40">{hint}</span>}
    </label>
  );
}

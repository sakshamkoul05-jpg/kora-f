"use client";

import { useState, useTransition } from "react";
import { decideBooking } from "./actions";

export type BookingRequest = {
  id: string;
  reference: string;
  status: "pending" | "confirmed" | "declined" | "cancelled";
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  guest_country: string | null;
  message: string | null;
  host_note: string | null;
  created_at: string;
  rooms: { name: string; room_number: number } | null;
};

const STATUS_STYLE: Record<BookingRequest["status"], string> = {
  pending: "bg-butter/25 text-ink",
  confirmed: "bg-deodar/15 text-deodar",
  declined: "bg-ink/10 text-ink-soft",
  cancelled: "bg-ink/10 text-ink-soft",
};

const fmt = (d: string) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const nights = (a: string, b: string) =>
  Math.round(
    (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86_400_000
  );

export function BookingRow({ request: r }: { request: BookingRequest }) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);

  function decide(decision: "confirmed" | "declined" | "cancelled") {
    setError(null);
    startTransition(async () => {
      const res = await decideBooking(r.id, decision, note);
      if (!res.ok) setError(res.message ?? "Couldn't save that.");
      else setNote("");
    });
  }

  return (
    <article className="rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="display-md">{r.guest_name}</h3>
            <span
              className={`rounded-[var(--radius-kora)] px-2.5 py-1 font-data text-[11px] uppercase tracking-wide ${STATUS_STYLE[r.status]}`}
            >
              {r.status}
            </span>
          </div>
          <p className="mt-1 font-data text-xs text-ink/45">{r.reference}</p>
        </div>
        <div className="text-right">
          <p className="font-data text-sm">
            {fmt(r.check_in)} → {fmt(r.check_out)}
          </p>
          <p className="font-data text-xs text-ink/45">
            {nights(r.check_in, r.check_out)} nights · {r.adults} adult
            {r.adults === 1 ? "" : "s"}
            {r.children > 0 && ` · ${r.children} child${r.children === 1 ? "" : "ren"}`}
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-ink/45">Email</dt>
          <dd>
            <a href={`mailto:${r.guest_email}`} className="text-maroon underline underline-offset-2">
              {r.guest_email}
            </a>
          </dd>
        </div>
        {r.guest_phone && (
          <div className="flex gap-2">
            <dt className="text-ink/45">Phone</dt>
            <dd>
              <a
                href={`https://wa.me/${r.guest_phone.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="text-maroon underline underline-offset-2"
              >
                {r.guest_phone}
              </a>
            </dd>
          </div>
        )}
        <div className="flex gap-2">
          <dt className="text-ink/45">Room</dt>
          <dd>{r.rooms ? `${r.rooms.name} (Room ${r.rooms.room_number})` : "No preference"}</dd>
        </div>
        {r.guest_country && (
          <div className="flex gap-2">
            <dt className="text-ink/45">Country</dt>
            <dd>{r.guest_country}</dd>
          </div>
        )}
      </dl>

      {r.message && (
        <p className="mt-4 border-l-2 border-butter/50 pl-4 text-sm leading-relaxed text-ink-soft">
          {r.message}
        </p>
      )}

      {r.host_note && (
        <p className="mt-3 text-xs text-ink/45">
          <span className="uppercase tracking-wide">Note:</span> {r.host_note}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-maroon">
          {error}
        </p>
      )}

      {r.status === "pending" && (
        <div className="mt-6 border-t border-ink/10 pt-5">
          {showNote && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional note for your own records"
              className="mb-4 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2 text-sm focus:border-maroon focus:outline-none"
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => decide("confirmed")}
              disabled={pending}
              className="rounded-[var(--radius-kora)] bg-deodar px-5 py-2.5 font-display text-sm text-paper disabled:opacity-60"
            >
              {pending ? "Saving…" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => decide("declined")}
              disabled={pending}
              className="rounded-[var(--radius-kora)] border border-ink/25 px-5 py-2.5 text-sm text-ink-soft disabled:opacity-60"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => setShowNote((v) => !v)}
              className="text-xs text-ink/45 underline underline-offset-2"
            >
              {showNote ? "Hide note" : "Add a note"}
            </button>
          </div>
          <p className="mt-3 text-xs text-ink/40">
            Confirming holds the room for these dates. The guest is not emailed
            automatically — write to them yourself.
          </p>
        </div>
      )}

      {r.status === "confirmed" && (
        <div className="mt-5 border-t border-ink/10 pt-4">
          <button
            type="button"
            onClick={() => decide("cancelled")}
            disabled={pending}
            className="text-xs text-ink/45 underline underline-offset-2 disabled:opacity-60"
          >
            Cancel this booking
          </button>
        </div>
      )}
    </article>
  );
}

"use client";

import { useState, useTransition } from "react";
import { formatInr } from "@/lib/pricing";
import { acceptBooking, decideBooking } from "./actions";

export type BookingStatus =
  | "pending"
  | "accepted"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "expired";

export type BookingRequest = {
  id: string;
  reference: string;
  status: BookingStatus;
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
  accepted_at: string | null;
  hold_expires_at: string | null;
  deposit_paid_at: string | null;
  total_inr: number | null;
  deposit_inr: number | null;
  rooms: { name: string; room_number: number } | null;
  /** What the rate card says this stay costs, if anything. Prefills the quote. */
  suggestedTotalInr: number | null;
  paymentUrl: string | null;
};

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: "bg-butter/25 text-ink",
  accepted: "bg-maroon/15 text-maroon",
  confirmed: "bg-deodar/15 text-deodar-deep",
  declined: "bg-ink/10 text-ink-soft",
  cancelled: "bg-ink/10 text-ink-soft",
  expired: "bg-ink/10 text-ink/45",
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "pending",
  accepted: "awaiting deposit",
  confirmed: "confirmed",
  declined: "declined",
  cancelled: "cancelled",
  expired: "hold lapsed",
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

/** "in 6 hours" / "3 hours ago". Rendered from a timestamp the server sent. */
function relative(iso: string): { text: string; past: boolean } {
  const ms = new Date(iso).getTime() - Date.now();
  const past = ms < 0;
  const mins = Math.round(Math.abs(ms) / 60_000);
  const text =
    mins < 60
      ? `${mins} minute${mins === 1 ? "" : "s"}`
      : mins < 60 * 48
        ? `${Math.round(mins / 60)} hour${Math.round(mins / 60) === 1 ? "" : "s"}`
        : `${Math.round(mins / 1440)} days`;
  return { text, past };
}

export function BookingRow({ request: r }: { request: BookingRequest }) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(r.paymentUrl);
  const [showNote, setShowNote] = useState(false);
  const [total, setTotal] = useState(
    r.suggestedTotalInr ? String(r.suggestedTotalInr) : ""
  );

  function decide(decision: "declined" | "cancelled" | "confirmed") {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await decideBooking(r.id, decision, note);
      if (!res.ok) setError(res.message ?? "Couldn't save that.");
      else setNote("");
    });
  }

  function accept() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const parsed = Number(total);
      const res = await acceptBooking(r.id, {
        totalInrOverride: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
        hostNote: note,
      });
      if (!res.ok) {
        setError(res.message ?? "Couldn't accept that.");
        return;
      }
      if (res.paymentUrl) setLink(res.paymentUrl);
      if (res.message) setInfo(res.message);
      setNote("");
    });
  }

  const hold = r.hold_expires_at ? relative(r.hold_expires_at) : null;

  return (
    <article className="rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="display-md">{r.guest_name}</h3>
            <span
              className={`rounded-[var(--radius-kora)] px-2.5 py-1 font-data text-[11px] uppercase tracking-wide ${STATUS_STYLE[r.status]}`}
            >
              {STATUS_LABEL[r.status]}
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
          {r.total_inr !== null && (
            <p className="mt-1 font-data text-sm text-ink">
              {formatInr(r.total_inr)}
              {r.deposit_inr !== null && (
                <span className="text-ink/45"> · {formatInr(r.deposit_inr)} deposit</span>
              )}
            </p>
          )}
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
        <p role="alert" className="mt-4 rounded-[var(--radius-kora)] bg-maroon/10 px-3 py-2 text-sm text-maroon">
          {error}
        </p>
      )}
      {info && (
        <p className="mt-4 rounded-[var(--radius-kora)] bg-butter/20 px-3 py-2 text-sm text-ink-soft">
          {info}
        </p>
      )}

      {/* --------------------------------------------------------- pending */}
      {r.status === "pending" && (
        <div className="mt-6 border-t border-ink/10 pt-5">
          {!r.rooms && (
            <p className="mb-4 rounded-[var(--radius-kora)] bg-butter/20 px-3 py-2 text-xs text-ink-soft">
              No room chosen. Assign one before accepting, or the dates can&apos;t be held.
            </p>
          )}

          <div className="flex flex-wrap items-end gap-4">
            <label className="block">
              <span className="font-data text-[11px] uppercase tracking-wide text-ink/45">
                Total for the stay (₹)
              </span>
              <input
                type="number"
                min={1}
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder={r.suggestedTotalInr ? String(r.suggestedTotalInr) : "e.g. 7500"}
                className="mt-1.5 w-40 rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2 text-sm focus:border-maroon focus:outline-none"
              />
            </label>
            <p className="pb-2 text-xs text-ink/45">
              {r.suggestedTotalInr
                ? "Prefilled from the rate card — change it to quote something else."
                : "No rate set for these dates, so type what you're quoting."}
            </p>
          </div>

          {showNote && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Optional note for your own records"
              className="mt-4 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2 text-sm focus:border-maroon focus:outline-none"
            />
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={accept}
              disabled={pending || !r.rooms}
              className="rounded-[var(--radius-kora)] bg-deodar-deep px-5 py-2.5 font-display text-sm text-paper disabled:opacity-40"
            >
              {pending ? "Saving…" : "Accept and hold"}
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
            Accepting holds the room and asks the guest for the deposit. The
            guest is not emailed automatically — send them the link yourself.
          </p>
        </div>
      )}

      {/* -------------------------------------------------------- accepted */}
      {r.status === "accepted" && (
        <div className="mt-6 border-t border-ink/10 pt-5">
          {hold && (
            <p className={`text-sm ${hold.past ? "text-maroon" : "text-ink-soft"}`}>
              {hold.past
                ? `Hold lapsed ${hold.text} ago — the room is free again.`
                : `Room held for another ${hold.text}.`}
            </p>
          )}

          {link ? (
            <div className="mt-4">
              <p className="font-data text-[11px] uppercase tracking-wide text-ink/45">
                Deposit link — send this to the guest
              </p>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 block break-all rounded-[var(--radius-kora)] border border-ink/15 bg-paper px-3 py-2 font-data text-xs text-maroon underline underline-offset-2"
              >
                {link}
              </a>
              {r.guest_phone && (
                <a
                  href={`https://wa.me/${r.guest_phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                    `Hello ${r.guest_name}, we'd be glad to have you at Kora House. Here's the link to pay the deposit and hold your room: ${link}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block rounded-[var(--radius-kora)] border border-ink/25 px-4 py-2 text-xs text-ink-soft"
                >
                  Send on WhatsApp
                </a>
              )}
            </div>
          ) : (
            <p className="mt-3 text-xs text-ink/45">
              No payment link — Razorpay isn&apos;t connected, so take the deposit
              however you normally would and mark it confirmed.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => decide("confirmed")}
              disabled={pending}
              className="rounded-[var(--radius-kora)] border border-deodar/40 px-4 py-2 text-xs text-deodar-deep disabled:opacity-60"
            >
              Mark deposit received
            </button>
            <button
              type="button"
              onClick={() => decide("cancelled")}
              disabled={pending}
              className="text-xs text-ink/45 underline underline-offset-2 disabled:opacity-60"
            >
              Release this hold
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- confirmed */}
      {r.status === "confirmed" && (
        <div className="mt-5 border-t border-ink/10 pt-4">
          {r.deposit_paid_at && (
            <p className="text-sm text-deodar-deep">
              Deposit received {fmt(r.deposit_paid_at.slice(0, 10))}.
            </p>
          )}
          <button
            type="button"
            onClick={() => decide("cancelled")}
            disabled={pending}
            className="mt-3 text-xs text-ink/45 underline underline-offset-2 disabled:opacity-60"
          >
            Cancel this booking
          </button>
        </div>
      )}

      {/* --------------------------------------------------------- expired */}
      {r.status === "expired" && (
        <div className="mt-5 border-t border-ink/10 pt-4">
          <p className="text-xs text-ink/45">
            Nobody paid in time, so the room went back on sale. Accept again if
            they still want it.
          </p>
          <button
            type="button"
            onClick={accept}
            disabled={pending || !r.rooms}
            className="mt-3 rounded-[var(--radius-kora)] border border-ink/25 px-4 py-2 text-xs text-ink-soft disabled:opacity-40"
          >
            Offer it again
          </button>
        </div>
      )}
    </article>
  );
}

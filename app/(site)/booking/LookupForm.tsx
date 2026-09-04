"use client";

import Link from "next/link";
import { useState } from "react";
import { RazorpayCheckout } from "@/components/RazorpayCheckout";
import { BowlRing } from "@/components/motion/BowlRing";
import { nightsBetween } from "@/lib/booking";
import { formatRange, guestsLabel, nightsLabel } from "@/lib/dates";
import { formatInr } from "@/lib/pricing";
import { whatsappUrl } from "@/lib/site";

type Booking = {
  reference: string;
  status: string;
  checkIn: string;
  checkOut: string;
  roomName: string | null;
  guestName: string;
  adults: number;
  children: number;
  totalInr: number | null;
  depositInr: number | null;
  discountInr: number | null;
  holdExpiresAt: string | null;
  depositPaidAt: string | null;
  paymentUrl: string | null;
};

/**
 * Look up a booking, then either wait, pay, or see that it is done.
 *
 * Every state below is one a guest genuinely lands in, and each says what
 * happens next rather than only naming itself. "Pending" tells nobody
 * anything; "we have it and one of us will write today" does.
 */
export function LookupForm() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  // Read once, when the answer arrives. An event handler is the right place
  // for a clock read — during render the compiler rejects it, and in an effect
  // it is a setState-on-mount. A 24-hour hold does not need a live ticker.
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setBooking(null);
    try {
      const res = await fetch("/api/booking/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, email }),
      });
      const body = await res.json().catch(() => ({}));
      if (body.found) {
        setBooking(body.booking);
        const expiry = body.booking.holdExpiresAt;
        setHoursLeft(
          expiry
            ? Math.max(0, Math.round((new Date(expiry).getTime() - Date.now()) / 3_600_000))
            : null
        );
      }
      else setMessage(body.message ?? "We couldn't find that one.");
    } catch {
      setMessage("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (booking) {
    return (
      <Result
        booking={booking}
        email={email}
        hoursLeft={hoursLeft}
        onBack={() => setBooking(null)}
      />
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[var(--radius-card)] border border-ink/15 bg-paper-raised p-6 md:p-7"
    >
      <label className="block">
        <span className="eyebrow text-ink-soft">Booking reference</span>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value.toUpperCase())}
          placeholder="KH-2026-0417"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          required
          className="mt-2 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2.5 font-data text-ink"
        />
      </label>

      <label className="mt-5 block">
        <span className="eyebrow text-ink-soft">Email you booked with</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          className="mt-2 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2.5 text-ink"
        />
      </label>

      {message && (
        <p
          role="alert"
          className="mt-5 rounded-[var(--radius-kora)] border border-maroon/30 bg-maroon/[0.06] px-4 py-3 text-sm leading-relaxed text-maroon"
        >
          {message}
        </p>
      )}

      <BowlRing className="mt-7 w-full rounded-[var(--radius-kora)]" disabled={busy}>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-[var(--radius-kora)] bg-deodar-deep px-6 py-3.5 font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Looking…" : "Find my booking"}
        </button>
      </BowlRing>
    </form>
  );
}

function Result({
  booking: b,
  email,
  hoursLeft,
  onBack,
}: {
  booking: Booking;
  email: string;
  hoursLeft: number | null;
  onBack: () => void;
}) {
  const nights = nightsBetween(b.checkIn, b.checkOut);

  return (
    <div className="rounded-[var(--radius-card)] border border-ink/15 bg-paper-raised p-6 md:p-7">
      <p className="font-data text-xs text-ink/45">{b.reference}</p>
      <h2 className="display-md mt-2">{b.roomName ?? "Your stay"}</h2>
      <p className="mt-1.5 text-ink-soft">
        {formatRange(b.checkIn, b.checkOut)} · {nightsLabel(nights)} ·{" "}
        {guestsLabel(b.adults, b.children)}
      </p>

      <div className="mt-6 border-t border-ink/12 pt-5">
        <StatusBlock booking={b} hoursLeft={hoursLeft} />
      </div>

      {b.totalInr !== null && (
        <dl className="mt-6 space-y-2 border-t border-ink/12 pt-5 text-sm">
          {b.discountInr ? (
            <Row label="Discount" value={`− ${formatInr(b.discountInr)}`} tone="text-deodar-deep" />
          ) : null}
          <Row label="Total for the stay" value={formatInr(b.totalInr)} />
          {b.depositInr !== null && (
            <>
              <Row label="Deposit" value={formatInr(b.depositInr)} strong />
              <Row label="On arrival" value={formatInr(b.totalInr - b.depositInr)} muted />
            </>
          )}
        </dl>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-3">
        {b.status === "accepted" && !b.depositPaidAt && (
          <RazorpayCheckout
            reference={b.reference}
            email={email}
            depositInr={b.depositInr}
          />
        )}
        <a
          href={whatsappUrl(`Hello — about my booking ${b.reference}.`)}
          className="rounded-[var(--radius-kora)] border border-ink/20 px-5 py-3.5 text-sm text-ink transition-colors hover:border-ink/40"
        >
          Message us
        </a>
        <button
          type="button"
          onClick={onBack}
          className="px-2 text-sm text-ink/45 underline underline-offset-4"
        >
          Look up another
        </button>
      </div>

      {b.status === "accepted" && !b.depositPaidAt && (
        <p className="mt-4 text-xs leading-relaxed text-ink/45">
          Payment is handled by Razorpay. We never see or store your card
          details.
          {b.paymentUrl && (
            <>
              {" "}
              Prefer to pay later or on another device?{" "}
              <a href={b.paymentUrl} className="underline underline-offset-2">
                Use this payment link
              </a>
              .
            </>
          )}
        </p>
      )}

      <p className="mt-6 text-sm text-ink/45">
        <Link href="/getting-here" className="underline underline-offset-4">
          How to find us
        </Link>{" "}
        when the time comes.
      </p>
    </div>
  );
}

function StatusBlock({ booking: b, hoursLeft }: { booking: Booking; hoursLeft: number | null }) {
  if (b.status === "pending") {
    return (
      <>
        <p className="display-sm">We&apos;ve got your request.</p>
        <p className="mt-2 leading-relaxed text-ink-soft">
          One of the hosts is reading it and will write back, usually the same
          day. Nothing has been charged.
        </p>
      </>
    );
  }
  if (b.status === "accepted" && b.paymentUrl) {
    return (
      <>
        <p className="display-sm text-deodar-deep">Your room is held.</p>
        <p className="mt-2 leading-relaxed text-ink-soft">
          Pay the deposit and it&apos;s yours.
          {hoursLeft !== null &&
            (hoursLeft > 0
              ? ` We're holding it for about ${hoursLeft} more hour${hoursLeft === 1 ? "" : "s"}.`
              : " The hold has just run out — message us and we'll see if it's still free.")}
        </p>
      </>
    );
  }
  if (b.status === "accepted") {
    return (
      <>
        <p className="display-sm text-deodar-deep">Your room is held.</p>
        <p className="mt-2 leading-relaxed text-ink-soft">
          A host will send you payment details shortly. Message us if you&apos;d
          rather sort it out now.
        </p>
      </>
    );
  }
  if (b.status === "confirmed") {
    return (
      <>
        <p className="display-sm text-deodar-deep">You&apos;re booked.</p>
        <p className="mt-2 leading-relaxed text-ink-soft">
          Deposit received and the room is yours. We&apos;ll see you on the
          hillside.
        </p>
      </>
    );
  }
  if (b.status === "expired") {
    return (
      <>
        <p className="display-sm">The hold ran out.</p>
        <p className="mt-2 leading-relaxed text-ink-soft">
          Nobody paid in time so the room went back on sale. If you still want
          it, message us — it may well be free.
        </p>
      </>
    );
  }
  if (b.status === "declined") {
    return (
      <>
        <p className="display-sm">We couldn&apos;t take this one.</p>
        <p className="mt-2 leading-relaxed text-ink-soft">
          A host wrote to you about it. Nothing was charged. Do ask again for
          other dates — it is usually the dates rather than the guest.
        </p>
      </>
    );
  }
  return (
    <>
      <p className="display-sm">This booking was cancelled.</p>
      <p className="mt-2 leading-relaxed text-ink-soft">
        If that&apos;s not what you expected, message us and we&apos;ll sort it
        out.
      </p>
    </>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={tone ?? (muted ? "text-ink/50" : "text-ink-soft")}>{label}</dt>
      <dd
        className={tone ?? (strong ? "text-lg font-medium text-ink" : muted ? "text-ink/50" : "text-ink")}
      >
        {value}
      </dd>
    </div>
  );
}

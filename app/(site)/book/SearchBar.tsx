"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_ADULTS, MAX_CHILDREN, MAX_NIGHTS, nightsBetween } from "@/lib/booking";

/**
 * Dates and guests. The thing a booking site opens with.
 *
 * Native date inputs on purpose: they are keyboard accessible, they bring up
 * the proper picker on a phone, and they cost nothing against the JS budget.
 * A hand-rolled calendar would be prettier and worse.
 */

const today = () => new Date().toISOString().slice(0, 10);

const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export function SearchBar({
  from = "",
  to = "",
  adults = 2,
  // Not `children`: that name is React's, and a numeric one shadowing it is a
  // trap for whoever edits this next.
  childCount = 0,
}: {
  from?: string;
  to?: string;
  adults?: number;
  childCount?: number;
}) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(from);
  const [checkOut, setCheckOut] = useState(to);
  const [a, setA] = useState(adults);
  const [c, setC] = useState(childCount);
  const [error, setError] = useState<string | null>(null);

  // Keep check-out ahead of check-in as the guest moves check-in forward,
  // rather than letting them build an impossible range and then scolding them.
  function onCheckIn(value: string) {
    setCheckIn(value);
    setError(null);
    if (value && (!checkOut || checkOut <= value)) setCheckOut(addDays(value, 1));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!checkIn || !checkOut) return setError("Pick both dates.");
    const nights = nightsBetween(checkIn, checkOut);
    if (nights <= 0) return setError("Check-out has to be after check-in.");
    if (nights > MAX_NIGHTS) return setError(`That's over ${MAX_NIGHTS} nights — message us instead.`);
    if (checkIn < today()) return setError("That date has already passed.");
    setError(null);
    router.push(
      `/book?from=${checkIn}&to=${checkOut}&adults=${a}&children=${c}`,
      { scroll: false }
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-[var(--radius-card)] border border-ink/15 bg-paper-raised p-5 md:p-6"
      aria-label="Check availability"
    >
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto_auto] md:items-end">
        <label className="block">
          <span className="eyebrow text-ink-soft">Arriving</span>
          <input
            type="date"
            value={checkIn}
            min={today()}
            onChange={(e) => onCheckIn(e.target.value)}
            className="mt-2 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2.5 text-ink"
            required
          />
        </label>

        <label className="block">
          <span className="eyebrow text-ink-soft">Leaving</span>
          <input
            type="date"
            value={checkOut}
            min={checkIn ? addDays(checkIn, 1) : addDays(today(), 1)}
            onChange={(e) => { setCheckOut(e.target.value); setError(null); }}
            className="mt-2 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2.5 text-ink"
            required
          />
        </label>

        <label className="block">
          <span className="eyebrow text-ink-soft">Adults</span>
          <input
            type="number"
            value={a}
            min={1}
            max={MAX_ADULTS}
            onChange={(e) => setA(Number(e.target.value))}
            className="mt-2 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2.5 text-ink md:w-20"
          />
        </label>

        <label className="block">
          <span className="eyebrow text-ink-soft">Children</span>
          <input
            type="number"
            value={c}
            min={0}
            max={MAX_CHILDREN}
            onChange={(e) => setC(Number(e.target.value))}
            className="mt-2 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2.5 text-ink md:w-20"
          />
        </label>

        <button
          type="submit"
          className="rounded-[var(--radius-kora)] bg-deodar-deep px-6 py-3 font-medium text-paper transition-opacity hover:opacity-90"
        >
          Check dates
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-maroon">
          {error}
        </p>
      )}
    </form>
  );
}

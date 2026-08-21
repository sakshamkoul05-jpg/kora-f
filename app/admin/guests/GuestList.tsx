"use client";

import { useMemo, useState } from "react";
import { formatDate } from "@/lib/dates";
import { formatInr } from "@/lib/pricing";

export type Guest = {
  email: string;
  name: string;
  phone: string | null;
  country: string | null;
  stays: number;
  requests: number;
  nights: number;
  spendInr: number;
  firstSeen: string;
  lastCheckout: string | null;
};

type Sort = "recent" | "stays" | "spend" | "name";

/**
 * Search and sort, client-side.
 *
 * Six rooms will not produce a directory large enough to justify paging or a
 * server round trip per keystroke — the whole list arrives with the page and
 * filtering it is instant. If this house ever has ten thousand guests, that is
 * a good problem and the query moves to the database then.
 */
export function GuestList({ guests }: { guests: Guest[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("recent");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? guests.filter(
          (g) =>
            g.name.toLowerCase().includes(q) ||
            g.email.toLowerCase().includes(q) ||
            (g.phone ?? "").includes(q) ||
            (g.country ?? "").toLowerCase().includes(q)
        )
      : guests;

    const sorted = [...filtered];
    if (sort === "stays") sorted.sort((a, b) => b.stays - a.stays || b.nights - a.nights);
    else if (sort === "spend") sorted.sort((a, b) => b.spendInr - a.spendInr);
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    // "recent" is the order the database already returned.
    return sorted;
  }, [guests, query, sort]);

  return (
    <>
      <div className="mt-8 flex flex-wrap items-end gap-4">
        <label className="min-w-[14rem] flex-1">
          <span className="font-data text-[11px] uppercase tracking-wide text-ink/45">Search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, email, phone or country"
            className="mt-1.5 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2 text-sm focus:border-maroon focus:outline-none"
          />
        </label>
        <label>
          <span className="font-data text-[11px] uppercase tracking-wide text-ink/45">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="mt-1.5 rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2 text-sm focus:border-maroon focus:outline-none"
          >
            <option value="recent">Most recent</option>
            <option value="stays">Most stays</option>
            <option value="spend">Most spent</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      <p className="mt-3 text-xs text-ink/45" aria-live="polite">
        {shown.length} of {guests.length}
      </p>

      <ul className="mt-4 space-y-2">
        {shown.map((g) => (
          <li
            key={g.email}
            className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 rounded-[var(--radius-kora)] border border-ink/12 bg-paper-raised px-4 py-3"
          >
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{g.name}</span>
                {g.stays > 1 && (
                  <span className="rounded-[2px] bg-deodar/15 px-1.5 py-0.5 font-data text-[10px] uppercase text-deodar-deep">
                    returning
                  </span>
                )}
                {g.stays === 0 && (
                  <span className="rounded-[2px] bg-ink/10 px-1.5 py-0.5 font-data text-[10px] uppercase text-ink/50">
                    never stayed
                  </span>
                )}
              </p>
              <p className="mt-0.5 break-all font-data text-xs text-ink/45">
                {/* Placeholder addresses are generated for walk-ins with no
                    email; showing one would only confuse. */}
                {g.email.endsWith("@kora.invalid") ? "no email on file" : g.email}
                {g.country && <span> · {g.country}</span>}
              </p>
              {g.phone && (
                <a
                  href={`https://wa.me/${g.phone.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-data text-xs text-maroon underline underline-offset-2"
                >
                  {g.phone}
                </a>
              )}
            </div>

            <div className="text-right font-data text-xs text-ink/45">
              <p className="text-ink">
                {g.stays} stay{g.stays === 1 ? "" : "s"}
                {g.requests > g.stays && (
                  <span className="text-ink/40"> · {g.requests} asked</span>
                )}
              </p>
              <p>
                {g.nights} night{g.nights === 1 ? "" : "s"}
                {g.spendInr > 0 && ` · ${formatInr(g.spendInr)}`}
              </p>
              {g.lastCheckout && <p>last left {formatDate(g.lastCheckout)}</p>}
            </div>
          </li>
        ))}
      </ul>

      {shown.length === 0 && (
        <p className="mt-6 text-sm text-ink-soft">Nobody matches that.</p>
      )}
    </>
  );
}

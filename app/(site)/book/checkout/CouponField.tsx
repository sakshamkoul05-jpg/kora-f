"use client";

import { useState } from "react";
import { formatInr } from "@/lib/pricing";

export type AppliedCoupon = {
  code: string;
  description: string | null;
  discountInr: number;
};

/**
 * A discount code, checked against the server.
 *
 * The figure shown here is advisory. What a code is actually worth is
 * recomputed when a host accepts, so a stale or edited value cannot become a
 * cheaper booking — the worst a tampered response can do is show the guest a
 * number the host will not honour, which the host sees before anyone pays.
 *
 * Collapsed by default. Most guests do not have a code, and a permanent empty
 * "promo code" box invites people to go looking for one and feel they are
 * paying too much.
 */
export function CouponField({
  checkIn,
  checkOut,
  roomSlug,
  subtotalInr,
  applied,
  onApply,
  onClear,
}: {
  checkIn: string;
  checkOut: string;
  roomSlug: string;
  subtotalInr: number;
  applied: AppliedCoupon | null;
  onApply: (coupon: AppliedCoupon) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function check(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, checkIn, checkOut, roomSlug, subtotalInr }),
      });
      const body = await res.json().catch(() => ({}));
      if (body.valid) {
        onApply({ code: body.code, description: body.description, discountInr: body.discountInr });
        setCode("");
        setError(null);
      } else {
        setError(body.reason ?? "That code is not valid");
      }
    } catch {
      setError("Couldn't check that just now.");
    } finally {
      setChecking(false);
    }
  }

  if (applied) {
    return (
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-kora)] border border-deodar/35 bg-deodar/[0.07] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-ink">
            <span className="font-data">{applied.code}</span> applied
            <span className="text-deodar-deep"> − {formatInr(applied.discountInr)}</span>
          </p>
          {applied.description && (
            <p className="mt-0.5 text-sm text-ink-soft">{applied.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-ink/50 underline underline-offset-2"
        >
          Remove
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 text-sm text-ink-soft underline underline-offset-4"
      >
        Have a discount code?
      </button>
    );
  }

  return (
    <form onSubmit={check} className="mt-5">
      <label className="block">
        <span className="eyebrow text-ink-soft">Discount code</span>
        <div className="mt-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="MONSOON"
            className="w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2.5 font-data text-ink"
          />
          <button
            type="submit"
            disabled={checking || !code.trim()}
            className="shrink-0 rounded-[var(--radius-kora)] border border-ink/25 px-5 py-2.5 text-sm text-ink disabled:opacity-40"
          >
            {checking ? "Checking…" : "Apply"}
          </button>
        </div>
      </label>
      {error && (
        <p role="alert" className="mt-2 text-sm text-maroon">
          {error}
        </p>
      )}
    </form>
  );
}

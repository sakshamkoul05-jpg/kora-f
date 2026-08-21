"use client";

import { useState, useTransition } from "react";

/**
 * Shared chrome for the settings panels.
 *
 * Extracted because four panels were about to grow the same header, the same
 * error line, and the same pending handling — and three copies of that is
 * where they start quietly diverging.
 */

export function Panel({
  title,
  blurb,
  count,
  children,
}: {
  title: string;
  blurb: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14 border-t border-ink/10 pt-10">
      <h2 className="display-md">
        {title}
        {typeof count === "number" && (
          <span className="ml-2 font-data text-base text-ink/40">({count})</span>
        )}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">{blurb}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded-[var(--radius-kora)] bg-maroon/10 px-3 py-2 text-sm text-maroon">
      {message}
    </p>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="font-data text-[11px] uppercase tracking-wide text-ink/45">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/40">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "mt-1.5 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2 text-sm focus:border-maroon focus:outline-none";

/** Wraps an action so panels do not each reimplement pending + error state. */
export function useAction() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, onDone?: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.message ?? "That didn't work.");
      else onDone?.();
    });
  };

  return { pending, error, setError, run };
}

export function RemoveButton({
  onClick,
  disabled,
  label = "Remove",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        disabled={disabled}
        className="text-xs text-ink/45 underline underline-offset-2 disabled:opacity-40"
      >
        {label}
      </button>
    );
  }
  // Deleting a coupon or a season is not reversible from here, so it asks once.
  return (
    <span className="flex items-center gap-2 text-xs">
      <button
        type="button"
        onClick={() => { setArmed(false); onClick(); }}
        disabled={disabled}
        className="text-maroon underline underline-offset-2 disabled:opacity-40"
      >
        Confirm
      </button>
      <button type="button" onClick={() => setArmed(false)} className="text-ink/45">
        cancel
      </button>
    </span>
  );
}

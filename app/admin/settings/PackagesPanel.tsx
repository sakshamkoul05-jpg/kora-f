"use client";

import { useState } from "react";
import { createPackage, deletePackage, setPackageActive } from "../offers-actions";
import { ErrorLine, Field, Panel, RemoveButton, inputClass, useAction } from "./Panel";

type Pkg = {
  id: string;
  name: string;
  description: string | null;
  inclusions: string[];
  minNights: number | null;
  couponCode: string | null;
  isActive: boolean;
};

/**
 * Packages are something a guest reads, not a pricing mechanism. If one carries
 * a discount, a coupon does the arithmetic — there is no second place in this
 * codebase that knows how to reduce a price.
 */
export function PackagesPanel({
  packages,
  couponCodes,
}: {
  packages: Pkg[];
  couponCodes: string[];
}) {
  const { pending, error, run } = useAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    inclusions: "",
    minNights: "",
    couponCode: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run(
      () =>
        createPackage({
          name: form.name,
          description: form.description,
          // One per line is the least fiddly way to type a list on a phone.
          inclusions: form.inclusions.split("\n").map((s) => s.trim()).filter(Boolean),
          minNights: form.minNights ? Number(form.minNights) : null,
          couponCode: form.couponCode || null,
        }),
      () => {
        setForm({ name: "", description: "", inclusions: "", minNights: "", couponCode: "" });
        setOpen(false);
      }
    );
  }

  return (
    <Panel
      title="Packages"
      count={packages.length}
      blurb="A named offer — a few nights with something included. Attach a discount code and that code does the pricing; leave it off and the package is simply a description."
    >
      <ErrorLine message={error} />

      {packages.length > 0 && (
        <ul className="mb-6 space-y-2">
          {packages.map((p) => (
            <li
              key={p.id}
              className={`rounded-[var(--radius-kora)] border px-4 py-3 ${
                p.isActive ? "border-ink/12 bg-paper" : "border-ink/10 bg-paper opacity-60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {p.name}
                    {p.couponCode && (
                      <span className="ml-2 font-data text-xs text-deodar-deep">{p.couponCode}</span>
                    )}
                    {p.minNights && (
                      <span className="ml-2 text-xs text-ink/45">min {p.minNights} nights</span>
                    )}
                  </p>
                  {p.description && <p className="mt-0.5 text-sm text-ink-soft">{p.description}</p>}
                  {p.inclusions.length > 0 && (
                    <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      {p.inclusions.map((inc) => (
                        <li key={inc} className="text-xs text-ink/45">
                          · {inc}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => setPackageActive(p.id, !p.isActive))}
                    className="text-xs text-ink-soft underline underline-offset-2 disabled:opacity-40"
                  >
                    {p.isActive ? "Hide" : "Show"}
                  </button>
                  <RemoveButton disabled={pending} onClick={() => run(() => deletePackage(p.id))} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-[var(--radius-kora)] border border-ink/25 px-4 py-2.5 text-sm text-ink-soft"
        >
          Create a package
        </button>
      ) : (
        <form onSubmit={submit} className="rounded-[var(--radius-card)] border border-ink/15 bg-paper p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Three nights on the kora"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="For a first visit — enough time to walk the circuit properly."
                className={inputClass}
              />
            </Field>
            <Field label="What's included" hint="One per line" className="sm:col-span-2">
              <textarea
                value={form.inclusions}
                onChange={(e) => setForm({ ...form, inclusions: e.target.value })}
                rows={4}
                placeholder={"Breakfast each morning\nA walk with a host\nAirport pickup"}
                className={inputClass}
              />
            </Field>
            <Field label="Minimum nights" hint="Optional">
              <input
                type="number"
                min={1}
                max={90}
                value={form.minNights}
                onChange={(e) => setForm({ ...form, minNights: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Discount code" hint="Optional — create it above first">
              <select
                value={form.couponCode}
                onChange={(e) => setForm({ ...form, couponCode: e.target.value })}
                className={inputClass}
              >
                <option value="">No discount</option>
                {couponCodes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-[var(--radius-kora)] bg-deodar-deep px-5 py-2.5 font-display text-sm text-paper disabled:opacity-50"
            >
              {pending ? "Saving…" : "Create package"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink/45 underline underline-offset-2">
              Cancel
            </button>
          </div>
        </form>
      )}
    </Panel>
  );
}

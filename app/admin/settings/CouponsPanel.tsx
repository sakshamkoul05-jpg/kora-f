"use client";

import { useState } from "react";
import { formatDate } from "@/lib/dates";
import { formatInr } from "@/lib/pricing";
import { createCoupon, deleteCoupon, setCouponActive } from "../offers-actions";
import { ErrorLine, Field, Panel, RemoveButton, inputClass, useAction } from "./Panel";

type Coupon = {
  id: string;
  code: string;
  kind: "percent" | "amount";
  value: number;
  description: string | null;
  isPublic: boolean;
  isActive: boolean;
  startsOn: string | null;
  endsOn: string | null;
  minNights: number | null;
  maxRedemptions: number | null;
  redeemedCount: number;
  roomId: string | null;
};

export function CouponsPanel({
  rooms,
  coupons,
}: {
  rooms: { id: string; name: string; number: number }[];
  coupons: Coupon[];
}) {
  const { pending, error, run } = useAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    kind: "percent" as "percent" | "amount",
    value: "",
    description: "",
    isPublic: true,
    startsOn: "",
    endsOn: "",
    minNights: "",
    maxRedemptions: "",
    roomId: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run(
      () =>
        createCoupon({
          code: form.code,
          kind: form.kind,
          value: Number(form.value),
          description: form.description,
          isPublic: form.isPublic,
          startsOn: form.startsOn || null,
          endsOn: form.endsOn || null,
          minNights: form.minNights ? Number(form.minNights) : null,
          maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
          roomId: form.roomId || null,
        }),
      () => {
        setForm({ code: "", kind: "percent", value: "", description: "", isPublic: true, startsOn: "", endsOn: "", minNights: "", maxRedemptions: "", roomId: "" });
        setOpen(false);
      }
    );
  }

  return (
    <Panel
      title="Discount codes"
      count={coupons.length}
      blurb="Public codes are listed on the booking page. A private code still works when a guest types it — it just isn't advertised, and nobody can discover it by guessing."
    >
      <ErrorLine message={error} />

      {coupons.length > 0 && (
        <ul className="mb-6 space-y-2">
          {coupons.map((c) => {
            const usedUp = c.maxRedemptions !== null && c.redeemedCount >= c.maxRedemptions;
            const expired = c.endsOn !== null && c.endsOn < new Date().toISOString().slice(0, 10);
            return (
              <li
                key={c.id}
                className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[var(--radius-kora)] border px-4 py-3 ${
                  c.isActive && !usedUp && !expired
                    ? "border-ink/12 bg-paper"
                    : "border-ink/10 bg-paper opacity-60"
                }`}
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-data font-medium">{c.code}</span>
                    <span className="text-ink/45">
                      {c.kind === "percent" ? `${c.value}% off` : `${formatInr(c.value)} off`}
                    </span>
                    {c.isPublic ? (
                      <span className="rounded-[2px] bg-deodar/15 px-1.5 py-0.5 font-data text-[10px] uppercase text-deodar-deep">
                        listed
                      </span>
                    ) : (
                      <span className="rounded-[2px] bg-ink/10 px-1.5 py-0.5 font-data text-[10px] uppercase text-ink/50">
                        private
                      </span>
                    )}
                    {usedUp && <span className="font-data text-[10px] uppercase text-maroon">used up</span>}
                    {expired && <span className="font-data text-[10px] uppercase text-maroon">expired</span>}
                  </p>
                  {c.description && <p className="mt-0.5 text-sm text-ink-soft">{c.description}</p>}
                  <p className="mt-0.5 font-data text-xs text-ink/45">
                    {c.minNights ? `min ${c.minNights} nights · ` : ""}
                    {c.startsOn || c.endsOn
                      ? `${c.startsOn ? formatDate(c.startsOn) : "any"} – ${c.endsOn ? formatDate(c.endsOn) : "any"} · `
                      : ""}
                    used {c.redeemedCount}
                    {c.maxRedemptions ? ` of ${c.maxRedemptions}` : ""}
                    {c.roomId ? ` · ${rooms.find((r) => r.id === c.roomId)?.name ?? "one room"} only` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => setCouponActive(c.id, !c.isActive))}
                    className="text-xs text-ink-soft underline underline-offset-2 disabled:opacity-40"
                  >
                    {c.isActive ? "Switch off" : "Switch on"}
                  </button>
                  <RemoveButton disabled={pending} onClick={() => run(() => deleteCoupon(c.id))} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-[var(--radius-kora)] border border-ink/25 px-4 py-2.5 text-sm text-ink-soft"
        >
          Create a code
        </button>
      ) : (
        <form onSubmit={submit} className="rounded-[var(--radius-card)] border border-ink/15 bg-paper p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Code" hint="Guests type this — keep it short">
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="MONSOON"
                required
                className={`${inputClass} font-data`}
              />
            </Field>
            <Field label="Kind">
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as "percent" | "amount" })}
                className={inputClass}
              >
                <option value="percent">Percentage off</option>
                <option value="amount">Rupees off</option>
              </select>
            </Field>
            <Field label={form.kind === "percent" ? "Percent" : "Amount (₹)"}>
              <input
                type="number"
                min={1}
                max={form.kind === "percent" ? 100 : undefined}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Description" hint="Shown to guests if listed" className="sm:col-span-2">
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="20% off through the rains"
                className={inputClass}
              />
            </Field>
            <Field label="Room" hint="Leave as all unless it is room-specific">
              <select
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                className={inputClass}
              >
                <option value="">All rooms</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Valid from" hint="Optional">
              <input type="date" value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Valid until" hint="Optional">
              <input type="date" value={form.endsOn} onChange={(e) => setForm({ ...form, endsOn: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Minimum nights" hint="Optional">
              <input type="number" min={1} max={90} value={form.minNights} onChange={(e) => setForm({ ...form, minNights: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Max uses" hint="Optional — counted when a booking is confirmed">
              <input type="number" min={1} value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })} className={inputClass} />
            </Field>
          </div>

          <label className="mt-4 flex items-center gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              className="h-4 w-4"
            />
            List this on the booking page
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-[var(--radius-kora)] bg-deodar-deep px-5 py-2.5 font-display text-sm text-paper disabled:opacity-50"
            >
              {pending ? "Saving…" : "Create code"}
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

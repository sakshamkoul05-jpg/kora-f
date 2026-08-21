"use client";

import { useState } from "react";
import { formatRange } from "@/lib/dates";
import { formatInr } from "@/lib/pricing";
import { createRateOverride, deleteRateOverride } from "../offers-actions";
import { ErrorLine, Field, Panel, RemoveButton, inputClass, useAction } from "./Panel";

type Season = {
  id: string;
  roomId: string | null;
  startsOn: string;
  endsOn: string;
  nightlyRateInr: number;
  minNights: number | null;
  label: string | null;
  priority: number;
};

/**
 * Seasonal rates.
 *
 * The pricing engine has resolved overlapping seasons by priority since it was
 * written, and is tested on it — a festival week can sit on top of a broad
 * season without carving the season up. Until now rows only went in by SQL,
 * which in practice meant they never would.
 */
export function SeasonsPanel({
  rooms,
  seasons,
}: {
  rooms: { id: string; name: string; number: number }[];
  seasons: Season[];
}) {
  const { pending, error, run } = useAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    label: "",
    startsOn: "",
    endsOn: "",
    nightlyRateInr: "",
    roomId: "",
    minNights: "",
    priority: "0",
  });

  const roomName = (id: string | null) =>
    id === null ? "All rooms" : (rooms.find((r) => r.id === id)?.name ?? "Unknown room");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run(
      () =>
        createRateOverride({
          label: form.label,
          startsOn: form.startsOn,
          endsOn: form.endsOn,
          nightlyRateInr: Number(form.nightlyRateInr),
          roomId: form.roomId || null,
          minNights: form.minNights ? Number(form.minNights) : null,
          priority: Number(form.priority) || 0,
        }),
      () => {
        setForm({ label: "", startsOn: "", endsOn: "", nightlyRateInr: "", roomId: "", minNights: "", priority: "0" });
        setOpen(false);
      }
    );
  }

  return (
    <Panel
      title="Seasons"
      count={seasons.length}
      blurb="A rate that replaces the standing one for a stretch of dates. Where two overlap, the higher priority wins — so a festival week can sit on top of a whole season without splitting it up."
    >
      <ErrorLine message={error} />

      {seasons.length > 0 && (
        <ul className="mb-6 space-y-2">
          {seasons.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[var(--radius-kora)] border border-ink/12 bg-paper px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{s.label || "Season"}</span>
                  <span className="text-ink/45"> · {roomName(s.roomId)}</span>
                </p>
                <p className="mt-0.5 font-data text-xs text-ink/45">
                  {formatRange(s.startsOn, s.endsOn)} · {formatInr(s.nightlyRateInr)}/night
                  {s.minNights ? ` · min ${s.minNights} nights` : ""}
                  {s.priority ? ` · priority ${s.priority}` : ""}
                </p>
              </div>
              <RemoveButton
                disabled={pending}
                onClick={() => run(() => deleteRateOverride(s.id))}
              />
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
          Add a season
        </button>
      ) : (
        <form onSubmit={submit} className="rounded-[var(--radius-card)] border border-ink/15 bg-paper p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Name" hint="Shown in the price breakdown">
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="High season"
                className={inputClass}
              />
            </Field>
            <Field label="From">
              <input
                type="date"
                value={form.startsOn}
                onChange={(e) => setForm({ ...form, startsOn: e.target.value })}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Until" hint="Exclusive — the last night is the day before">
              <input
                type="date"
                value={form.endsOn}
                onChange={(e) => setForm({ ...form, endsOn: e.target.value })}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Nightly rate (₹)">
              <input
                type="number"
                min={1}
                value={form.nightlyRateInr}
                onChange={(e) => setForm({ ...form, nightlyRateInr: e.target.value })}
                required
                className={inputClass}
              />
            </Field>
            <Field label="Room">
              <select
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                className={inputClass}
              >
                <option value="">All rooms</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} #{r.number}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Minimum nights" hint="Leave blank for none">
              <input
                type="number"
                min={1}
                max={30}
                value={form.minNights}
                onChange={(e) => setForm({ ...form, minNights: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Priority" hint="Higher wins where seasons overlap">
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-[var(--radius-kora)] bg-deodar-deep px-5 py-2.5 font-display text-sm text-paper disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save season"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-ink/45 underline underline-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Panel>
  );
}

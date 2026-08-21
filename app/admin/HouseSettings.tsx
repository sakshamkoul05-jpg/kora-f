"use client";

import { useState, useTransition } from "react";
import { formatInr } from "@/lib/pricing";
import { updateRoomRate, updateSettings } from "./actions";

/**
 * Rates and house rules, editable without a deploy.
 *
 * This exists because the alternative is a developer edit and a redeploy every
 * time a season changes, which means it would not happen and the site would go
 * on saying "price on request" indefinitely. Rates are the hosts' business,
 * so they belong in the hosts' hands.
 */
export function HouseSettings({
  rooms,
  settings,
}: {
  rooms: { id: string; name: string; number: number; rateInr: number | null }[];
  settings: { depositPercent: number; holdHours: number; taxPercent: number; minNights: number };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rates, setRates] = useState<Record<string, string>>(
    Object.fromEntries(rooms.map((r) => [r.id, r.rateInr === null ? "" : String(r.rateInr)]))
  );
  const [s, setS] = useState(settings);

  function saveRate(roomId: string) {
    setError(null);
    setSaved(null);
    startTransition(async () => {
      const raw = rates[roomId]?.trim() ?? "";
      const value = raw === "" ? null : Number(raw);
      const res = await updateRoomRate(roomId, value);
      if (res.ok) setSaved(roomId);
      else setError(res.message ?? "Couldn't save that rate.");
    });
  }

  function saveSettings() {
    setError(null);
    setSaved(null);
    startTransition(async () => {
      const res = await updateSettings(s);
      if (res.ok) setSaved("settings");
      else setError(res.message ?? "Couldn't save settings.");
    });
  }

  return (
    <section className="mt-20 border-t border-ink/10 pt-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="display-md text-left"
        aria-expanded={open}
      >
        Rates and rules{" "}
        <span className="font-data text-base text-ink/40">{open ? "−" : "+"}</span>
      </button>

      {!open && (
        <p className="mt-2 text-sm text-ink-soft">
          Nightly rates, deposit percentage, and how long a hold lasts.
        </p>
      )}

      {open && (
        <div className="mt-8 space-y-10">
          {error && (
            <p role="alert" className="rounded-[var(--radius-kora)] bg-maroon/10 px-3 py-2 text-sm text-maroon">
              {error}
            </p>
          )}

          {/* ------------------------------------------------------ rates */}
          <div>
            <h3 className="font-data text-[11px] uppercase tracking-wide text-ink/45">
              Nightly rates
            </h3>
            <p className="mt-2 text-sm text-ink-soft">
              Leave one blank to keep that room &ldquo;price on request&rdquo;.
              A deposit of {s.depositPercent}% is taken to hold the room.
            </p>
            <ul className="mt-5 space-y-3">
              {rooms.map((room) => (
                <li key={room.id} className="flex flex-wrap items-center gap-3">
                  <span className="w-40 text-sm">
                    {room.name}{" "}
                    <span className="text-ink/40">#{room.number}</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-ink/45">₹</span>
                    <input
                      type="number"
                      min={1}
                      value={rates[room.id] ?? ""}
                      onChange={(e) => setRates({ ...rates, [room.id]: e.target.value })}
                      placeholder="not set"
                      className="w-32 rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-1.5 text-sm focus:border-maroon focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => saveRate(room.id)}
                    disabled={pending}
                    className="rounded-[var(--radius-kora)] border border-ink/25 px-3 py-1.5 text-xs text-ink-soft disabled:opacity-50"
                  >
                    Save
                  </button>
                  {saved === room.id && <span className="text-xs text-deodar-deep">Saved</span>}
                  {rates[room.id] && Number(rates[room.id]) > 0 && (
                    <span className="text-xs text-ink/40">
                      3 nights ≈ {formatInr(Number(rates[room.id]) * 3)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* --------------------------------------------------- settings */}
          <div>
            <h3 className="font-data text-[11px] uppercase tracking-wide text-ink/45">
              House rules
            </h3>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <NumberField
                label="Deposit %"
                value={s.depositPercent}
                min={0}
                max={100}
                onChange={(v) => setS({ ...s, depositPercent: v })}
                hint="Taken online to hold the room"
              />
              <NumberField
                label="Hold for (hours)"
                value={s.holdHours}
                min={1}
                max={168}
                onChange={(v) => setS({ ...s, holdHours: v })}
                hint="Before an unpaid hold lapses"
              />
              <NumberField
                label="Tax %"
                value={s.taxPercent}
                min={0}
                max={50}
                onChange={(v) => setS({ ...s, taxPercent: v })}
                hint="0 if rates already include it"
              />
              <NumberField
                label="Minimum nights"
                value={s.minNights}
                min={1}
                max={30}
                onChange={(v) => setS({ ...s, minNights: v })}
                hint="Across the whole year"
              />
            </div>
            <button
              type="button"
              onClick={saveSettings}
              disabled={pending}
              className="mt-6 rounded-[var(--radius-kora)] bg-deodar-deep px-5 py-2.5 font-display text-sm text-paper disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save rules"}
            </button>
            {saved === "settings" && (
              <span className="ml-3 text-xs text-deodar-deep">Saved</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <label className="block">
      <span className="font-data text-[11px] uppercase tracking-wide text-ink/45">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper px-3 py-2 text-sm focus:border-maroon focus:outline-none"
      />
      <span className="mt-1 block text-xs text-ink/40">{hint}</span>
    </label>
  );
}

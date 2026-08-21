"use client";

import { useState } from "react";
import { formatRange } from "@/lib/dates";
import { createBlock, createFaq, deleteBlock, deleteFaq, setFaqActive, updateRoom, updateSiteContent } from "../crm-actions";
import { ErrorLine, Field, Panel, RemoveButton, inputClass, useAction } from "./Panel";

type Room = {
  id: string;
  name: string;
  number: number;
  maxOccupancy: number | null;
  hasKitchenette: boolean;
  isActive: boolean;
};

// ------------------------------------------------------------- blocked dates

export function BlocksPanel({
  rooms,
  blocks,
}: {
  rooms: { id: string; name: string; number: number }[];
  blocks: { id: string; roomId: string | null; startsOn: string; endsOn: string; reason: string | null }[];
}) {
  const { pending, error, run } = useAction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ roomId: "", startsOn: "", endsOn: "", reason: "" });

  return (
    <Panel
      title="Closed dates"
      count={blocks.length}
      blurb="Family staying, maintenance, or the house simply shut. Blocked dates disappear from the website immediately — nobody can request them."
    >
      <ErrorLine message={error} />

      {blocks.length > 0 && (
        <ul className="mb-6 space-y-2">
          {blocks.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[var(--radius-kora)] border border-ink/12 bg-paper px-4 py-3"
            >
              <div>
                <p className="text-sm">
                  {b.roomId === null
                    ? "Whole house"
                    : (rooms.find((r) => r.id === b.roomId)?.name ?? "A room")}
                  {b.reason && <span className="text-ink/45"> · {b.reason}</span>}
                </p>
                <p className="mt-0.5 font-data text-xs text-ink/45">
                  {formatRange(b.startsOn, b.endsOn)}
                </p>
              </div>
              <RemoveButton
                disabled={pending}
                label="Reopen"
                onClick={() => run(() => deleteBlock(b.id))}
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
          Close some dates
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () =>
                createBlock({
                  roomId: form.roomId || null,
                  startsOn: form.startsOn,
                  endsOn: form.endsOn,
                  reason: form.reason,
                }),
              () => { setForm({ roomId: "", startsOn: "", endsOn: "", reason: "" }); setOpen(false); }
            );
          }}
          className="rounded-[var(--radius-card)] border border-ink/15 bg-paper p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Room">
              <select value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} className={inputClass}>
                <option value="">Whole house</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} #{r.number}</option>
                ))}
              </select>
            </Field>
            <Field label="From">
              <input type="date" value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })} required className={inputClass} />
            </Field>
            <Field label="Until" hint="The first night open again">
              <input type="date" value={form.endsOn} onChange={(e) => setForm({ ...form, endsOn: e.target.value })} required className={inputClass} />
            </Field>
            <Field label="Reason" hint="Only you see this">
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Family staying" className={inputClass} />
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={pending} className="rounded-[var(--radius-kora)] bg-deodar-deep px-5 py-2.5 font-display text-sm text-paper disabled:opacity-50">
              {pending ? "Saving…" : "Close these dates"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink/45 underline underline-offset-2">Cancel</button>
          </div>
        </form>
      )}
    </Panel>
  );
}

// --------------------------------------------------------------------- rooms

export function RoomsPanel({ rooms }: { rooms: Room[] }) {
  const { pending, error, run } = useAction();
  const [edits, setEdits] = useState<Record<string, Room>>(
    Object.fromEntries(rooms.map((r) => [r.id, r]))
  );
  const [saved, setSaved] = useState<string | null>(null);

  const set = (id: string, patch: Partial<Room>) =>
    setEdits((e) => ({ ...e, [id]: { ...e[id], ...patch } }));

  return (
    <Panel
      title="Rooms"
      count={rooms.length}
      blurb="Names and details as guests see them. Switching a room off removes it from the website without deleting anything — useful while one is being repainted."
    >
      <ErrorLine message={error} />
      <ul className="space-y-3">
        {rooms.map((r) => {
          const e = edits[r.id];
          return (
            <li key={r.id} className="rounded-[var(--radius-kora)] border border-ink/12 bg-paper p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
                <Field label={`Room ${r.number}`}>
                  <input value={e.name} onChange={(ev) => set(r.id, { name: ev.target.value })} className={inputClass} />
                </Field>
                <Field label="Sleeps" hint="Blank if unconfirmed">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={e.maxOccupancy ?? ""}
                    onChange={(ev) => set(r.id, { maxOccupancy: ev.target.value ? Number(ev.target.value) : null })}
                    className={inputClass}
                  />
                </Field>
                <div className="flex flex-col gap-2 pb-1">
                  <label className="flex items-center gap-2 text-sm text-ink-soft">
                    <input type="checkbox" checked={e.hasKitchenette} onChange={(ev) => set(r.id, { hasKitchenette: ev.target.checked })} className="h-4 w-4" />
                    Kitchenette
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-soft">
                    <input type="checkbox" checked={e.isActive} onChange={(ev) => set(r.id, { isActive: ev.target.checked })} className="h-4 w-4" />
                    Bookable
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => updateRoom(r.id, {
                          name: e.name,
                          maxOccupancy: e.maxOccupancy,
                          hasKitchenette: e.hasKitchenette,
                          isActive: e.isActive,
                        }),
                        () => setSaved(r.id)
                      )
                    }
                    className="rounded-[var(--radius-kora)] border border-ink/25 px-4 py-2 text-sm text-ink-soft disabled:opacity-50"
                  >
                    Save
                  </button>
                  {saved === r.id && <span className="text-xs text-deodar-deep">Saved</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

// -------------------------------------------------------------- site content

export function ContentPanel({
  entries,
}: {
  entries: { key: string; label: string; hint: string | null; kind: string; value: string }[];
}) {
  const { pending, error, run } = useAction();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(entries.map((e) => [e.key, e.value]))
  );
  const [saved, setSaved] = useState(false);

  const dirty = entries.some((e) => values[e.key] !== e.value);

  return (
    <Panel
      title="Site wording"
      blurb="Details that appear across the website. Changing one here changes it everywhere it is used — no developer, no deploy."
    >
      <ErrorLine message={error} />
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map((e) => (
          <Field
            key={e.key}
            label={e.label}
            hint={e.hint ?? undefined}
            className={e.kind === "multiline" ? "block sm:col-span-2" : "block"}
          >
            {e.kind === "multiline" ? (
              <textarea
                value={values[e.key] ?? ""}
                onChange={(ev) => { setValues({ ...values, [e.key]: ev.target.value }); setSaved(false); }}
                rows={3}
                className={inputClass}
              />
            ) : (
              <input
                value={values[e.key] ?? ""}
                onChange={(ev) => { setValues({ ...values, [e.key]: ev.target.value }); setSaved(false); }}
                className={inputClass}
              />
            )}
          </Field>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={() => run(() => updateSiteContent(values), () => setSaved(true))}
          className="rounded-[var(--radius-kora)] bg-deodar-deep px-5 py-2.5 font-display text-sm text-paper disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save wording"}
        </button>
        {saved && <span className="text-xs text-deodar-deep">Saved</span>}
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------- FAQs

export function FaqPanel({
  faqs,
}: {
  faqs: { id: string; question: string; answer: string; isActive: boolean }[];
}) {
  const { pending, error, run } = useAction();
  const [q, setQ] = useState("");
  const [a, setA] = useState("");

  return (
    <Panel
      title="Questions guests ask"
      count={faqs.length}
      blurb="These appear on the FAQ page. Hiding one keeps it here without showing it — useful for an answer you are still deciding on."
    >
      <ErrorLine message={error} />

      {faqs.length > 0 && (
        <ul className="mb-6 space-y-2">
          {faqs.map((f) => (
            <li
              key={f.id}
              className={`rounded-[var(--radius-kora)] border px-4 py-3 ${
                f.isActive ? "border-ink/12 bg-paper" : "border-ink/10 bg-paper opacity-60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{f.question}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{f.answer}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => setFaqActive(f.id, !f.isActive))}
                    className="text-xs text-ink-soft underline underline-offset-2 disabled:opacity-40"
                  >
                    {f.isActive ? "Hide" : "Show"}
                  </button>
                  <RemoveButton disabled={pending} onClick={() => run(() => deleteFaq(f.id))} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => createFaq(q, a), () => { setQ(""); setA(""); });
        }}
        className="rounded-[var(--radius-card)] border border-ink/15 bg-paper p-5"
      >
        <Field label="Question">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Is there hot water?" required className={inputClass} />
        </Field>
        <Field label="Answer" className="mt-4 block">
          <textarea value={a} onChange={(e) => setA(e.target.value)} rows={3} required className={inputClass} />
        </Field>
        <button
          type="submit"
          disabled={pending || !q.trim() || !a.trim()}
          className="mt-5 rounded-[var(--radius-kora)] bg-deodar-deep px-5 py-2.5 font-display text-sm text-paper disabled:opacity-40"
        >
          {pending ? "Saving…" : "Add question"}
        </button>
      </form>
    </Panel>
  );
}

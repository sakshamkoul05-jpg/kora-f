import type { Metadata } from "next";
import { KoraPathDraw } from "@/components/KoraPathDraw";

export const metadata: Metadata = { title: "Experiences — Kora House" };

const stops = [
  { name: "Tsuglagkhang Temple", note: "The Dalai Lama's temple complex." },
  { name: "Lhagyal Ri kora", note: "The circumambulation walk around the hill." },
  { name: "Dharamkot", note: "A quieter village further up the ridge." },
  { name: "Bhagsu Falls", note: "A short walk beyond Bhagsu village." },
  { name: "Triund trailhead", note: "The starting point for the Triund trek." },
] as const;

export default function ExperiencesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <p className="eyebrow text-ink/50">Things to walk to</p>
      <h1 className="mt-2 max-w-2xl font-display text-4xl md:text-5xl">
        Everything worth doing is within a morning&apos;s walk
      </h1>

      <div className="mt-14">
        <KoraPathDraw />
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {stops.map((stop) => (
          <div key={stop.name} className="hairline rounded-[var(--radius-kora)] p-5">
            <p className="font-display">{stop.name}</p>
            <p className="mt-1 text-sm text-ink/60">{stop.note}</p>
          </div>
        ))}
      </div>

      <p className="mt-10 max-w-lg text-sm text-ink/50">
        Distances, durations and difficulty are being confirmed with the
        hosts — ask at the house for current walking times.
      </p>
    </div>
  );
}

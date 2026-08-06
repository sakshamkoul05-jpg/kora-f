import type { Metadata } from "next";
import Image from "next/image";
import { KoraPathDraw } from "@/components/KoraPathDraw";
import { PhotoCredit } from "@/components/PhotoCredit";
import { TibetanDivider } from "@/components/TibetanDivider";
import { placeImages, type PlaceImage } from "@/lib/image-credits";

export const metadata: Metadata = { title: "Experiences — Kora House" };

const stops: { name: string; note: string; photo: PlaceImage }[] = [
  {
    name: "Tsuglagkhang Temple",
    note: "The Dalai Lama's temple complex.",
    photo: placeImages.templeArchitecturalDetail,
  },
  {
    name: "Lhagyal Ri kora",
    note: "The circumambulation walk around the hill, past Namgyal Monastery.",
    photo: placeImages.monasteryNamgyal,
  },
  {
    name: "Dharamkot",
    note: "A quieter village further up the ridge.",
    photo: placeImages.dharamkotHouses,
  },
  {
    name: "Bhagsu",
    note: "The village and falls a short walk beyond McLeodganj.",
    photo: placeImages.prayerFlagsBhagsu,
  },
  {
    name: "Triund trailhead",
    note: "The starting point for the Triund trek.",
    photo: placeImages.triundTrek,
  },
];

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

      <div className="mt-6">
        <TibetanDivider />
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2">
        {stops.map((stop) => (
          <div key={stop.name} className="overflow-hidden rounded-[var(--radius-card)] bg-paper">
            <div className="group relative aspect-[16/10]">
              <Image
                src={stop.photo.file}
                alt={stop.photo.alt}
                fill
                className="object-cover"
                sizes="(min-width: 640px) 50vw, 100vw"
              />
              <PhotoCredit image={stop.photo} />
            </div>
            <div className="p-5">
              <p className="font-display text-lg">{stop.name}</p>
              <p className="mt-1 text-sm text-ink/60">{stop.note}</p>
            </div>
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

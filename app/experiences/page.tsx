import type { Metadata } from "next";
import Image from "next/image";
import { KoraPathDraw } from "@/components/KoraPathDraw";
import { OrnamentDivider, SectionMark } from "@/components/Ornament";
import { PhotoCredit } from "@/components/PhotoCredit";
import { placeImages, type PlaceImage } from "@/lib/image-credits";

export const metadata: Metadata = { title: "Experiences — Kora House" };

const stops: { name: string; note: string; photo: PlaceImage }[] = [
  {
    name: "Tsuglagkhang",
    note: "The Dalai Lama's temple complex, and the start of the kora path.",
    photo: placeImages.templeArchitecturalDetail,
  },
  {
    name: "Lhagyal Ri",
    note: "The ridge above the temple, thick with prayer flags left by walkers.",
    photo: placeImages.monasteryNamgyal,
  },
  {
    name: "Dharamkot",
    note: "A quieter village further up the hill, through the deodar forest.",
    photo: placeImages.dharamkotHouses,
  },
  {
    name: "Bhagsu",
    note: "The village, the temple tank and the falls a short walk beyond.",
    photo: placeImages.prayerFlagsBhagsu,
  },
  {
    name: "Triund",
    note: "The long climb up to the ridge line, and the view back over the valley.",
    photo: placeImages.triundTrek,
  },
];

export default function ExperiencesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <SectionMark eyebrow="Things to walk to" variant="cloud" tone="text-deodar" />
      <h1 className="display-xl mt-5 max-w-3xl">
        Everything worth doing is within a morning&apos;s walk
      </h1>
      <p className="lede mt-7 max-w-xl">
        The kora is the circuit around the Dalai Lama&apos;s residence — walked
        clockwise, always, past the prayer wheels and up onto the ridge. It
        starts a few minutes below the house.
      </p>

      <div className="mt-16">
        <KoraPathDraw />
        <p className="mt-4 text-center text-xs text-ink/40">
          A stylised diagram of the circuit, not drawn to scale.
        </p>
      </div>

      <div className="py-16">
        <OrnamentDivider variant="lotus" />
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        {stops.map((stop, i) => (
          <article
            key={stop.name}
            className={`group overflow-hidden rounded-[var(--radius-card)] border border-ink/10 bg-paper-raised ${
              i === 0 ? "sm:col-span-2" : ""
            }`}
          >
            <div className={`relative ${i === 0 ? "aspect-[21/9]" : "aspect-[16/10]"}`}>
              <Image
                src={stop.photo.file}
                alt={stop.photo.alt}
                fill
                className="photo-warm object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                sizes={i === 0 ? "100vw" : "(min-width: 640px) 50vw, 100vw"}
              />
              <PhotoCredit image={stop.photo} />
            </div>
            <div className="p-7">
              <p className="display-md">{stop.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{stop.note}</p>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-12 max-w-lg border-l-2 border-butter/50 pl-4 text-sm text-ink-soft/80">
        Distances, walking times and difficulty are still being confirmed with
        the hosts — ask at the house before you set out.
      </p>
    </div>
  );
}

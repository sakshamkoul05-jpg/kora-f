import type { Metadata } from "next";
import Image from "next/image";
import { OrnamentDivider, SectionMark } from "@/components/Ornament";
import { PhotoCredit } from "@/components/PhotoCredit";
import { placeImages, type PlaceImage } from "@/lib/image-credits";
import { KoraSection } from "./KoraSection";

export const metadata: Metadata = {
  title: "Things to Do Near Kora House, McLeodganj",
  description:
    "A walking guide to the Lingkhor, Tsuglagkhang temple, McLeodganj market, Bhagsu waterfall, and the Triund trek — all near Kora House.",
};

type Stop = {
  name: string;
  distance: string;
  body: string;
  photo: PlaceImage;
  wide?: boolean;
};

const stops: Stop[] = [
  {
    name: "Tsuglagkhang Complex",
    distance: "A short walk",
    body: "The temple itself, Namgyal Monastery, the Tibetan Museum and the Kalachakra Temple, all inside the same complex. Best visited early, before the tour groups arrive.",
    photo: placeImages.templeArchitecturalDetail,
    wide: true,
  },
  {
    name: "McLeodganj main market",
    distance: "About fifteen minutes on foot",
    body: "Tibetan and Indian street food, prayer-flag and singing-bowl shops, and most of the town's cafés. Far enough that you won't hear it at night; close enough that dinner is never a production.",
    photo: placeImages.mcleodganjStreet,
  },
  {
    name: "Bhagsu falls & Bhagsunath temple",
    distance: "A short taxi, or a longer walk beyond the market",
    body: "A modest waterfall beside an old Shiva temple. An easy half-day, and one of the better places nearby for a quiet swim in the warmer months.",
    photo: placeImages.prayerFlagsBhagsu,
  },
  {
    name: "Dharamkot",
    distance: "About twenty minutes",
    body: "A quieter hillside settlement up through the deodar, and the way to the Triund trailhead.",
    photo: placeImages.dharamkotHouses,
  },
  {
    name: "Triund",
    distance: "A day, or a night on the ridge",
    body: "A moderate climb to a ridge with the Dhauladhar close up in front of you. Best attempted early; the return can be done the same day or with an overnight camp.",
    photo: placeImages.triundTrek,
  },
];

export default function ExperiencesPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <SectionMark eyebrow="The walk" variant="cloud" tone="text-deodar" />
      <h1 className="display-xl mt-5 max-w-3xl">What&apos;s outside the door</h1>
      <p className="lede mt-7 max-w-xl">
        McLeodganj rewards people who walk it rather than drive it. Everything
        below is reachable on foot from Kora House — most of it inside twenty
        minutes.
      </p>

      {/* ---------- The Lingkhor ---------- */}
      <div className="mt-14 max-w-2xl rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-7">
        <p className="eyebrow text-maroon">The Lingkhor · directly outside</p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          A tree-lined circuit around the Tsuglagkhang complex, marked by prayer
          wheels and mani walls, walked daily by monks and residents from early
          morning onward. No technical difficulty, and the single best way to
          feel the town&apos;s rhythm before the market opens.
        </p>
      </div>

      <div className="mt-16">
        <KoraSection />
      </div>

      <div className="py-16">
        <OrnamentDivider variant="lotus" />
      </div>

      {/* ---------- Everything else ---------- */}
      <SectionMark eyebrow="And beyond it" variant="knot" />
      <h2 className="display-lg mt-5">Within a morning</h2>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        {stops.map((stop) => (
          <article
            key={stop.name}
            className={`group overflow-hidden rounded-[var(--radius-card)] border border-ink/10 bg-paper-raised ${
              stop.wide ? "sm:col-span-2" : ""
            }`}
          >
            <div className={`relative ${stop.wide ? "aspect-[21/9]" : "aspect-[16/10]"}`}>
              <Image
                src={stop.photo.file}
                alt={stop.photo.alt}
                fill
                className="photo-warm object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
                sizes={stop.wide ? "100vw" : "(min-width: 640px) 50vw, 100vw"}
              />
              <PhotoCredit image={stop.photo} />
            </div>
            <div className="p-7">
              <p className="display-md">{stop.name}</p>
              <p className="mt-1 font-data text-[11px] tracking-wide text-ink/45">
                {stop.distance}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{stop.body}</p>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-14 max-w-lg text-lg leading-relaxed text-ink-soft">
        None of this needs a car and a plan. Most of it just needs a good pair
        of shoes and a morning free.
      </p>

      <p className="mt-8 max-w-lg border-l-2 border-butter/50 pl-4 text-sm text-ink-soft/80">
        Walking times and temple opening hours are approximate and change with
        the season — ask at the house before you set out.
      </p>
    </div>
  );
}

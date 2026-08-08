import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { OrnamentDivider, SectionMark } from "@/components/Ornament";
import { PhotoCredit } from "@/components/PhotoCredit";
import { placeImages, type PlaceImage } from "@/lib/image-credits";
import { distances } from "@/lib/site";
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
    distance: "A walk down the hill",
    body: "Tibetan and Indian street food, prayer-flag and singing-bowl shops, and most of the town's cafés. Far enough that you won't hear it at night; close enough that dinner is never a production.",
    photo: placeImages.mcleodganjStreet,
  },
  {
    name: "Bhagsu falls & Bhagsunath temple",
    distance: distances.bhagsu,
    body: "A walk through a peaceful town, then steps to the top of the waterfall, with cafés along the way. The Shiva temple has a pool beside it where locals swim, and some shops sell Bhagsu cake.",
    photo: placeImages.prayerFlagsBhagsu,
  },
  {
    name: "Dharamkot",
    distance: distances.tushita,
    body: "A quieter hillside settlement up through the deodar, home to both Tushita and the Vipassana centre, and the way to the Triund trailhead.",
    photo: placeImages.dharamkotHouses,
  },
  {
    name: "Triund",
    distance: distances.triund,
    body: "The most popular trek here, climbing to base camp for the whole Dhauladhar range and the Kangra valley. Average difficulty, two stops for snacks on the way, and wildflowers in spring and summer. Some people camp on the ridge; a guide isn't necessary unless you need help carrying gear.",
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

      <p className="mt-10 max-w-lg">
        <Link
          href="/guidebook"
          className="border-b border-maroon/40 pb-1 text-maroon transition-colors hover:border-maroon"
        >
          The rest of it is in the guidebook
        </Link>{" "}
        <span className="text-ink-soft">
          — where to eat, where to volunteer, and how to register for a
          teaching.
        </span>
      </p>

      <p className="mt-8 max-w-lg border-l-2 border-butter/50 pl-4 text-sm text-ink-soft/80">
        Walking times and temple opening hours shift with the season — ask at
        the house before you set out.
      </p>
    </div>
  );
}

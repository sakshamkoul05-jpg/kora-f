import Image from "next/image";
import Link from "next/link";
import { DeckledEdge } from "@/components/DeckledEdge";
import { MalaRail } from "@/components/motion/MalaRail";
import { Ornament, OrnamentDivider, SectionMark } from "@/components/Ornament";
import { PhotoCredit } from "@/components/PhotoCredit";
import { PrayerFlags } from "@/components/motion/PrayerFlags";
import { PrimaryButton } from "@/components/PrimaryButton";
import { RoomCard } from "@/components/RoomCard";
import { placeImages } from "@/lib/image-credits";
import { rooms } from "@/lib/rooms";
import { site } from "@/lib/site";

const sections = [
  { id: "hero", label: "Welcome" },
  { id: "welcome", label: "The house" },
  { id: "balcony", label: "The balcony" },
  { id: "valley", label: "The valley" },
  { id: "rooms-preview", label: "Rooms" },
  { id: "experiences-teaser", label: "Experiences" },
] as const;

const valleyPhotos = [
  placeImages.monasteryNamgyal,
  placeImages.prayerFlagsBhagsu,
  placeImages.triundTrek,
  placeImages.dharamkotHouses,
] as const;

export default function HomePage() {
  return (
    <>
      <MalaRail sections={[...sections]} />

      {/* ---------- Hero ---------- */}
      <section id="hero" className="relative isolate flex min-h-[86vh] flex-col justify-end overflow-hidden">
        <Image
          src={placeImages.heroMcLeodganj.file}
          alt={placeImages.heroMcLeodganj.alt}
          fill
          priority
          className="photo-warm -z-10 object-cover"
          sizes="100vw"
        />
        <div className="photo-scrim absolute inset-0 -z-10" aria-hidden />
        <PrayerFlags />

        <div className="text-on-photo mx-auto w-full max-w-6xl px-5 pb-20 pt-40 md:px-8 md:pb-28">
          <div className="max-w-2xl">
            <p className="eyebrow text-butter-pale">
              McLeodganj · Himachal Pradesh · 2082 m
            </p>
            <h1 className="display-xl mt-5 text-paper">
              A house on the hill,
              <br />
              not a hotel
            </h1>
            <p className="lede mt-6 max-w-lg text-paper/90">
              Six rooms above the temple road — quiet, secluded, and run by the
              family who live here. The common balcony is the reason most
              people come back.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <PrimaryButton href="/rooms">Check availability</PrimaryButton>
              <Link
                href="/house"
                className="border-b border-paper/30 pb-1 text-sm text-paper/75 transition-colors hover:border-paper hover:text-paper"
              >
                About the house
              </Link>
            </div>
          </div>
        </div>

        <PhotoCredit image={placeImages.heroMcLeodganj} className="group opacity-100" />
        <DeckledEdge fill="var(--color-mist)" className="bottom-0 z-20" flip />
      </section>

      {/* ---------- Welcome ---------- */}
      <section id="welcome" className="mx-auto max-w-3xl px-5 py-24 text-center md:py-32">
        <div className="flex justify-center">
          <Ornament variant="lotus" />
        </div>
        <p className="display-lg mt-8 text-balance">
          Tashi delek. Come up the hill, put your bag down, and sit outside for
          a while.
        </p>
        <p className="lede mx-auto mt-7 max-w-xl">
          Kora House sits on the ridge above Tsuglagkhang, past the security
          quarters, where the road runs out and the steps begin. There is no
          front desk and no bell. There is tea, a long shared balcony, and the
          Dhauladhar opposite.
        </p>
      </section>

      <OrnamentDivider variant="cloud" className="mb-4" />

      {/* ---------- Balcony ---------- */}
      <section id="balcony" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <div className="group relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] md:aspect-[4/5]">
            <Image
              src={placeImages.dhauladharView.file}
              alt={placeImages.dhauladharView.alt}
              fill
              className="photo-warm object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
            <PhotoCredit image={placeImages.dhauladharView} />
          </div>
          <div>
            <SectionMark eyebrow="The common balcony" variant="cloud" />
            <h2 className="display-lg mt-5">One view, shared by everyone who stays</h2>
            <p className="lede mt-6">
              The house opens onto the valley from a single long balcony — the
              first thing the hosts mention and the last thing guests remember.
              Mornings are slow here. The hills do the rest.
            </p>
            <p className="mt-6 border-l-2 border-butter/50 pl-4 text-sm text-ink-soft/80">
              Pictured is the view over McLeodganj toward the Dhauladhar range.
              Photographs of the balcony itself are coming from the hosts.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Three qualities ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
        <div className="grid gap-10 border-t border-ink/10 pt-14 md:grid-cols-3 md:gap-14">
          {[
            {
              t: "Hilltop and secluded",
              b: "Set above the town, quiet and secure, with the hills at the door and the kora path a few minutes below.",
            },
            {
              t: "Run by its hosts",
              b: `${site.hosts.map((h) => h.name).join(" and ")} point guests around the town and stay reachable on WhatsApp for the whole stay.`,
            },
            {
              t: "Homely, not hotel-like",
              b: "Six rooms, a shared dining room and a balcony. Budget-friendly, and built for people who stay a while.",
            },
          ].map((item) => (
            <div key={item.t}>
              <Ornament variant="knot" />
              <p className="display-md mt-4">{item.t}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.b}</p>
            </div>
          ))}
        </div>
        <Link
          href="/house"
          className="mt-10 inline-block border-b border-maroon/40 pb-1 text-sm text-maroon transition-colors hover:border-maroon"
        >
          More about the house
        </Link>
      </section>

      {/* ---------- The valley ---------- */}
      <section id="valley" className="band-dark relative py-24 text-mist md:py-32">
        <DeckledEdge fill="var(--color-mist)" className="top-0" />
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="max-w-lg">
            <SectionMark eyebrow="McLeodganj & nearby" variant="lotus" tone="text-butter" />
            <h2 className="display-lg mt-5 text-mist">The valley the house sits above</h2>
            <p className="lede mt-5 text-mist/65">
              The temple, the kora, the forest paths to Bhagsu and Dharamkot,
              and the ridge up to Triund — all of it within a morning&apos;s
              walk of the front steps.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {valleyPhotos.map((photo, i) => (
              <div
                key={photo.file}
                className={`group relative overflow-hidden rounded-[var(--radius-card)] ${
                  i % 2 === 0 ? "aspect-[3/4]" : "aspect-[3/4] md:mt-10"
                }`}
              >
                <Image
                  src={photo.file}
                  alt={photo.alt}
                  fill
                  className="photo-warm object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
                <PhotoCredit image={photo} />
              </div>
            ))}
          </div>
        </div>
        <DeckledEdge fill="var(--color-mist)" className="bottom-0" flip />
      </section>

      {/* ---------- Rooms ---------- */}
      <section id="rooms-preview" className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionMark eyebrow="Where to stay" variant="knot" />
            <h2 className="display-lg mt-5">Six rooms</h2>
          </div>
          <Link
            href="/rooms"
            className="border-b border-maroon/40 pb-1 text-sm text-maroon transition-colors hover:border-maroon"
          >
            See all six
          </Link>
        </div>
        <p className="lede mt-6 max-w-xl">
          Three have their own kitchen for longer stays. One is on the ground
          floor, with no stairs from the entrance.
        </p>
        <div className="mt-12 grid gap-7 md:grid-cols-3">
          {rooms.slice(0, 3).map((room) => (
            <RoomCard key={room.slug} room={room} />
          ))}
        </div>
      </section>

      <OrnamentDivider variant="cloud" />

      {/* ---------- Experiences ---------- */}
      <section id="experiences-teaser" className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <SectionMark eyebrow="Within a morning's walk" variant="cloud" tone="text-deodar" />
            <h2 className="display-lg mt-5">The temple, the kora, the town</h2>
            <p className="lede mt-6">
              The circumambulation begins a few minutes downhill and takes
              about an hour at an unhurried pace, clockwise, past the prayer
              wheels and the flags on the ridge.
            </p>
            <Link
              href="/experiences"
              className="mt-8 inline-block border-b border-maroon/40 pb-1 text-sm text-maroon transition-colors hover:border-maroon"
            >
              See what&apos;s nearby
            </Link>
          </div>
          <div className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
            <Image
              src={placeImages.templeArchitecturalDetail.file}
              alt={placeImages.templeArchitecturalDetail.alt}
              fill
              className="photo-warm object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
            <PhotoCredit image={placeImages.templeArchitecturalDetail} />
          </div>
        </div>
      </section>
    </>
  );
}

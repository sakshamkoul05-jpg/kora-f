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
import { site, whatsappUrl } from "@/lib/site";

const sections = [
  { id: "hero", label: "Arrival" },
  { id: "welcome", label: "The circle" },
  { id: "balcony", label: "The balcony" },
  { id: "valley", label: "The valley" },
  { id: "rooms-preview", label: "Rooms" },
  { id: "walk-teaser", label: "The walk" },
] as const;

const valleyPhotos = [
  placeImages.monasteryNamgyal,
  placeImages.templeArchitecturalDetail,
  placeImages.prayerFlagsBhagsu,
  placeImages.mcleodganjStreet,
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
              McLeodganj · Himachal Pradesh
            </p>
            <h1 className="display-xl mt-5 text-paper">Stay on the circle.</h1>
            <p className="lede mt-6 max-w-xl text-paper/90">
              Kora House sits directly on the Lingkhor — the pilgrim&apos;s path
              that circles the Dalai Lama&apos;s temple in McLeodganj. Most
              guesthouses are a walk from it. This one is built into it.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <PrimaryButton href="/book">Check availability</PrimaryButton>
              <Link
                href="/house"
                className="border-b border-paper/30 pb-1 text-sm text-paper/75 transition-colors hover:border-paper hover:text-paper"
              >
                The story
              </Link>
            </div>
          </div>
        </div>

        <PhotoCredit image={placeImages.heroMcLeodganj} className="group opacity-100" />
        <DeckledEdge fill="var(--color-mist)" className="bottom-0 z-20" flip />
      </section>

      {/* ---------- The circle ---------- */}
      <section id="welcome" className="mx-auto max-w-3xl px-5 py-24 text-center md:py-32">
        <div className="flex justify-center">
          <Ornament variant="lotus" />
        </div>
        <p className="lede mx-auto mt-8 max-w-2xl text-left text-[1.15rem] leading-[1.85] text-ink md:text-center">
          Every morning in McLeodganj, before the market wakes up, a quiet
          procession begins around the Tsuglagkhang complex — monks, elders,
          travellers, all moving the same clockwise circle. Kora House stands on
          that circle, on Buddha House Road, with the Dhauladhar range on one
          side and the temple&apos;s prayer flags on the other.
        </p>
        <p className="display-lg mt-10">
          You don&apos;t have to walk far to join it. You just have to step
          outside.
        </p>
      </section>

      <OrnamentDivider variant="cloud" className="mb-4" />

      {/* ---------- The balcony ---------- */}
      <section id="balcony" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <div className="group relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]">
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
            <SectionMark eyebrow="The balcony" variant="cloud" />
            <h2 className="display-lg mt-5">Where everyone ends up</h2>
            <p className="lede mt-6">
              The house opens onto the valley from one long shared balcony. It
              catches the mist coming off the Kangra valley in the morning and
              the last of the light at the end of the day.
            </p>
            <p className="mt-4 text-ink-soft">
              Most guests tell the hosts the same thing within a few minutes of
              arriving: what they want is to sit out here with a chai and watch
              the sun go down behind the mountains.
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
              t: "On the path, not near it",
              b: "The Lingkhor runs past the door. Guests here are already on the circuit before they've decided to walk it.",
            },
            {
              t: "Six rooms, run by hosts",
              b: `${site.hosts.map((h) => h.name).join(" and ")} point guests around the town and stay reachable on WhatsApp for the whole stay. There is no front desk.`,
            },
            {
              t: "Quiet, and close enough",
              b: "Far enough from Jogiwara Road that you hear wind and flags at night. Close enough that dinner is never a production.",
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
          Read the story
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
              The temple complex about five hundred metres down the road, the
              forest paths to Bhagsu and Dharamkot, and the ridge up to Triund
              — all of it on foot from the front steps.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
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
                  sizes="(min-width: 768px) 33vw, 50vw"
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
          Each named for a stop on the walk outside rather than a room tier.
          Two have their own kitchenette, and there is a common kitchen, a
          sitting room and the balcony for everyone.
        </p>
        <div className="mt-12 grid gap-7 md:grid-cols-3">
          {rooms.slice(0, 3).map((room) => (
            <RoomCard key={room.slug} room={room} />
          ))}
        </div>
      </section>

      <OrnamentDivider variant="cloud" />

      {/* ---------- The walk ---------- */}
      <section id="walk-teaser" className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <SectionMark eyebrow="What's outside the door" variant="cloud" tone="text-deodar" />
            <h2 className="display-lg mt-5">Step outside and you&apos;re on it</h2>
            <p className="lede mt-6">
              Ten minutes further and you&apos;re at the Tsuglagkhang complex,
              the Tibetan Museum, or a bowl of thukpa in the main market.
            </p>
            <Link
              href="/experiences"
              className="mt-8 inline-block border-b border-maroon/40 pb-1 text-sm text-maroon transition-colors hover:border-maroon"
            >
              Explore the area
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

      {/* ---------- Closing ---------- */}
      <section className="band-dark relative py-24 text-mist md:py-28">
        <DeckledEdge fill="var(--color-mist)" className="top-0" />
        <div className="mx-auto max-w-2xl px-5 text-center md:px-8">
          <div className="flex justify-center">
            <Ornament variant="lotus" />
          </div>
          <h2 className="display-lg mt-6 text-mist">Come around the circle.</h2>
          <p className="lede mx-auto mt-5 max-w-lg text-mist/70">
            Rooms are limited — six, by design, not six because that&apos;s all
            we could fit. Get in touch and we&apos;ll help you find the right
            one for your stay.
          </p>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noreferrer"
            className="mt-9 inline-block rounded-[var(--radius-kora)] bg-butter px-8 py-3.5 font-display text-[15px] tracking-wide text-ink transition-opacity hover:opacity-90"
          >
            Check availability on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArcDivider } from "@/components/ArcDivider";
import { DeckledEdge } from "@/components/DeckledEdge";
import { MalaIndicator } from "@/components/MalaIndicator";
import { PhotoCredit } from "@/components/PhotoCredit";
import { PrayerFlags } from "@/components/PrayerFlags";
import { PrimaryButton } from "@/components/PrimaryButton";
import { RoomCard } from "@/components/RoomCard";
import { TibetanDivider } from "@/components/TibetanDivider";
import { placeImages } from "@/lib/image-credits";
import { rooms } from "@/lib/rooms";
import { site } from "@/lib/site";

const sections = [
  { id: "hero", label: "Welcome" },
  { id: "balcony", label: "The balcony" },
  { id: "house-teaser", label: "The house" },
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
      <MalaIndicator sections={[...sections]} />

      {/* 1. Hero */}
      <section id="hero" className="relative overflow-hidden bg-ink text-mist">
        <Image
          src={placeImages.heroMcLeodganj.file}
          alt={placeImages.heroMcLeodganj.alt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="photo-scrim absolute inset-0" aria-hidden />
        <PrayerFlags />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 pb-24 pt-32 md:px-8 md:pb-32 md:pt-40">
          <p className="eyebrow text-butter">McLeodganj, Himachal Pradesh</p>
          <h1 className="font-display text-4xl leading-[1.1] md:text-6xl">
            A house on the hill, <br className="hidden md:block" />
            not a hotel
          </h1>
          <p className="max-w-md text-mist/85">
            Six rooms above the temple road. Quiet, secluded, and run by its
            hosts — with a common balcony that is the reason most people
            book.
          </p>
          <PrimaryButton href="/rooms">Check availability</PrimaryButton>
        </div>
        <PhotoCredit image={placeImages.heroMcLeodganj} className="group opacity-100" />
        <DeckledEdge fill="var(--color-mist)" className="bottom-0" flip />
      </section>

      <div className="pt-10">
        <TibetanDivider />
      </div>

      {/* 2. Balcony — the property's single strongest asset, its own section */}
      <section id="balcony" className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
            <Image
              src={placeImages.dhauladharView.file}
              alt={placeImages.dhauladharView.alt}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
            <PhotoCredit image={placeImages.dhauladharView} />
          </div>
          <div>
            <p className="eyebrow text-maroon">The common balcony</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              One view, shared by everyone who stays
            </h2>
            <p className="mt-4 text-ink/70">
              The house opens onto the valley from a shared balcony — the
              first thing hosts mention and the last thing guests remember.
              Mornings here are unhurried; the hills do the rest.
            </p>
            <p className="mt-3 text-xs text-ink/40">
              Pictured: the view from McLeodganj toward the Dhauladhar range —
              the balcony&apos;s own photo is coming from the hosts.
            </p>
          </div>
        </div>
      </section>

      <ArcDivider className="mx-auto max-w-6xl text-ink/10" />

      {/* 3. The house teaser */}
      <section id="house-teaser" className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="eyebrow text-ink/50">Hilltop &amp; secluded</p>
            <p className="mt-2 text-sm text-ink/70">
              Set above the town, quiet and secure, with the hills at the
              door.
            </p>
          </div>
          <div>
            <p className="eyebrow text-ink/50">Run by its hosts</p>
            <p className="mt-2 text-sm text-ink/70">
              {site.hosts.map((h) => h.name).join(" and ")} guide guests
              around the town and stay reachable on WhatsApp throughout the
              stay.
            </p>
          </div>
          <div>
            <p className="eyebrow text-ink/50">Homely, not hotel-like</p>
            <p className="mt-2 text-sm text-ink/70">
              Six rooms, a shared dining area, and a balcony — budget-friendly
              and built for slow travellers.
            </p>
          </div>
        </div>
        <Link
          href="/house"
          className="mt-8 inline-block text-sm text-maroon underline underline-offset-4"
        >
          More about the house →
        </Link>
      </section>

      {/* 4. The valley — real photography of McLeodganj and nearby places */}
      <section id="valley" className="bg-ink py-16 text-mist md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <p className="eyebrow text-butter">McLeodganj &amp; nearby</p>
          <h2 className="mt-2 max-w-lg font-display text-3xl md:text-4xl">
            The valley the house sits above
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {valleyPhotos.map((photo) => (
              <div
                key={photo.file}
                className="group relative aspect-[3/4] overflow-hidden rounded-[var(--radius-card)] first:col-span-2 first:row-span-2 first:aspect-square md:first:col-span-1 md:first:row-span-1 md:first:aspect-[3/4]"
              >
                <Image
                  src={photo.file}
                  alt={photo.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
                <PhotoCredit image={photo} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Rooms preview */}
      <section id="rooms-preview" className="bg-paper py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-3xl md:text-4xl">Six rooms</h2>
            <Link href="/rooms" className="text-sm text-maroon underline underline-offset-4">
              See all rooms →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {rooms.slice(0, 3).map((room) => (
              <RoomCard key={room.slug} room={room} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Experiences teaser */}
      <section id="experiences-teaser" className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow text-deodar">Within a morning&apos;s walk</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              The temple, the kora, the town
            </h2>
            <p className="mt-4 text-ink/70">
              Everything worth doing near Kora House is reachable on foot —
              the hosts will point the way.
            </p>
            <Link
              href="/experiences"
              className="mt-6 inline-block text-sm text-maroon underline underline-offset-4"
            >
              See experiences →
            </Link>
          </div>
          <div className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
            <Image
              src={placeImages.templeArchitecturalDetail.file}
              alt={placeImages.templeArchitecturalDetail.alt}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
            <PhotoCredit image={placeImages.templeArchitecturalDetail} />
          </div>
        </div>
      </section>
    </>
  );
}

import { ArcDivider } from "@/components/ArcDivider";
import { DeckledEdge } from "@/components/DeckledEdge";
import { MalaIndicator } from "@/components/MalaIndicator";
import { PrayerFlags } from "@/components/PrayerFlags";
import { PrimaryButton } from "@/components/PrimaryButton";
import { RoomCard } from "@/components/RoomCard";
import { rooms } from "@/lib/rooms";
import { site } from "@/lib/site";
import Link from "next/link";

const sections = [
  { id: "hero", label: "Welcome" },
  { id: "balcony", label: "The balcony" },
  { id: "house-teaser", label: "The house" },
  { id: "rooms-preview", label: "Rooms" },
  { id: "experiences-teaser", label: "Experiences" },
] as const;

export default function HomePage() {
  return (
    <>
      <MalaIndicator sections={[...sections]} />

      {/* 1. Hero */}
      <section id="hero" className="relative overflow-hidden bg-ink text-mist">
        <PrayerFlags />
        <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 pb-24 pt-32 md:px-8 md:pb-32 md:pt-40">
          <p className="eyebrow text-butter">McLeodganj, Himachal Pradesh</p>
          <h1 className="font-display text-4xl leading-[1.1] md:text-6xl">
            A house on the hill, <br className="hidden md:block" />
            not a hotel
          </h1>
          <p className="max-w-md text-mist/75">
            Six rooms above the temple road. Quiet, secluded, and run by its
            hosts — with a common balcony that is the reason most people
            book.
          </p>
          <PrimaryButton href="/rooms">Check availability</PrimaryButton>
        </div>
        <DeckledEdge fill="var(--color-mist)" className="bottom-0" flip />
      </section>

      {/* 2. Balcony — the property's single strongest asset, its own section */}
      <section id="balcony" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="aspect-[4/3] rounded-[var(--radius-kora)] bg-ink/10" aria-hidden />
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
          </div>
        </div>
      </section>

      <ArcDivider className="mx-auto max-w-6xl text-ink/10" />

      {/* 3. The house teaser */}
      <section id="house-teaser" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
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

      {/* 4. Rooms preview */}
      <section id="rooms-preview" className="bg-paper py-20 md:py-28">
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

      {/* 5. Experiences teaser */}
      <section id="experiences-teaser" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
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
          <div className="aspect-[4/3] rounded-[var(--radius-kora)] bg-ink/10" aria-hidden />
        </div>
      </section>
    </>
  );
}

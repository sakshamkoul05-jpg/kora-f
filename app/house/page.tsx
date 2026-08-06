import type { Metadata } from "next";
import Image from "next/image";
import { PhotoCredit } from "@/components/PhotoCredit";
import { TibetanDivider } from "@/components/TibetanDivider";
import { placeImages } from "@/lib/image-credits";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "The House — Kora House" };

const character = [
  {
    title: "Hilltop and secluded",
    body: "Set above the town, opening to the hills — quiet and secure rather than in the middle of things.",
  },
  {
    title: "Homely, not hotel-like",
    body: "Six rooms, a shared dining area, and a common balcony. Budget-friendly, and run day to day rather than managed at a distance.",
  },
  {
    title: "Hosts who stay in touch",
    body: "The hosts guide guests around the town and stay reachable on WhatsApp for the length of the stay.",
  },
] as const;

export default function HousePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <p className="eyebrow text-ink/50">The house</p>
      <h1 className="mt-2 max-w-2xl font-display text-4xl md:text-5xl">
        A house that&apos;s run, not managed
      </h1>

      <div className="group relative mt-10 aspect-[21/9] overflow-hidden rounded-[var(--radius-card)]">
        <Image
          src={placeImages.mcleodganjStreet.file}
          alt={placeImages.mcleodganjStreet.alt}
          fill
          className="object-cover"
          sizes="100vw"
        />
        <PhotoCredit image={placeImages.mcleodganjStreet} />
      </div>
      <p className="mt-2 text-xs text-ink/40">
        McLeodganj, just down the hill from the house. Photos of the house
        itself are on their way from the hosts.
      </p>

      <div className="mt-6">
        <TibetanDivider />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {character.map((item) => (
          <div key={item.title} className="hairline rounded-[var(--radius-card)] p-5">
            <p className="font-display">{item.title}</p>
            <p className="mt-2 text-sm text-ink/70">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="hairline-t mt-16 pt-12">
        <p className="eyebrow text-ink/50">Hosts &amp; caretaker</p>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          {site.hosts.map((host) => (
            <div key={host.name}>
              <div className="aspect-square rounded-full bg-ink/10" aria-hidden />
              <p className="mt-3 font-display">{host.name}</p>
              <p className="text-sm text-ink/50">{host.role}</p>
            </div>
          ))}
          <div>
            <div className="aspect-square rounded-full bg-ink/10" aria-hidden />
            <p className="mt-3 font-display">{site.caretaker.name}</p>
            <p className="text-sm text-ink/50">
              {site.caretaker.role} · on site {site.caretaker.onSiteHours}
            </p>
            <p className="mt-1 text-xs text-ink/40">{site.caretaker.note}</p>
          </div>
        </div>
      </div>

      <div className="hairline-t mt-16 max-w-xl pt-12">
        <p className="eyebrow text-ink/50">Worth knowing before you book</p>
        <ul className="mt-3 space-y-2 text-sm text-ink/70">
          <li>{site.caveats.stairs}</li>
          <li>{site.caveats.market}</li>
          <li>{site.caveats.housekeeping}</li>
        </ul>
      </div>
    </div>
  );
}

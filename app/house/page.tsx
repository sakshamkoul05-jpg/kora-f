import type { Metadata } from "next";
import Image from "next/image";
import { Ornament, OrnamentDivider, SectionMark } from "@/components/Ornament";
import { PhotoCredit } from "@/components/PhotoCredit";
import { PhotoPending } from "@/components/PhotoPending";
import { placeImages } from "@/lib/image-credits";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "The House — Kora House" };

const character = [
  {
    title: "Hilltop and secluded",
    body: "Set above the town, opening to the hills — quiet and secure rather than in the middle of things.",
    ornament: "cloud" as const,
  },
  {
    title: "Homely, not hotel-like",
    body: "Six rooms, a shared dining room and a common balcony. Budget-friendly, and run day to day rather than managed at a distance.",
    ornament: "knot" as const,
  },
  {
    title: "Hosts who stay in touch",
    body: "The hosts point guests around the town and stay reachable on WhatsApp for the length of the stay.",
    ornament: "lotus" as const,
  },
];

export default function HousePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-20 md:px-8 md:pt-28">
        <SectionMark eyebrow="The house" variant="lotus" />
        <h1 className="display-xl mt-5 max-w-3xl">A house that&apos;s run, not managed</h1>
        <p className="lede mt-7 max-w-xl">
          Kora House has been six rooms and a balcony for as long as guests
          have been coming. Nobody checks you in from behind a desk; someone
          walks up with you and shows you where things are.
        </p>

        <div className="group relative mt-14 aspect-[21/9] overflow-hidden rounded-[var(--radius-card)]">
          <Image
            src={placeImages.mcleodganjStreet.file}
            alt={placeImages.mcleodganjStreet.alt}
            fill
            className="photo-warm object-cover"
            sizes="100vw"
          />
          <PhotoCredit image={placeImages.mcleodganjStreet} />
        </div>
        <p className="mt-3 text-xs text-ink/45">
          McLeodganj, just down the hill. Photographs of the house itself are
          on their way from the hosts.
        </p>
      </section>

      <div className="py-20">
        <OrnamentDivider variant="cloud" />
      </div>

      <section className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-12 md:grid-cols-3 md:gap-14">
          {character.map((item) => (
            <div key={item.title}>
              <Ornament variant={item.ornament} />
              <p className="display-md mt-4">{item.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-5 md:px-8">
        <div className="border-t border-ink/10 pt-14">
          <SectionMark eyebrow="Hosts & caretaker" variant="knot" />
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {site.hosts.map((host) => (
              <div key={host.name}>
                <PhotoPending className="aspect-square rounded-full" />
                <p className="display-md mt-4">{host.name}</p>
                <p className="text-sm text-ink/45">{host.role}</p>
              </div>
            ))}
            <div>
              <PhotoPending className="aspect-square rounded-full" />
              <p className="display-md mt-4">{site.caretaker.name}</p>
              <p className="text-sm text-ink/45">
                {site.caretaker.role} · on site {site.caretaker.onSiteHours}
              </p>
              <p className="mt-1 text-xs text-ink/40">{site.caretaker.note}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="band-dark mt-24 py-20 text-mist md:py-24">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <SectionMark eyebrow="Worth knowing before you book" variant="cloud" tone="text-butter" />
          <p className="mt-6 text-mist/60">
            None of this is buried in a policy page, because a mismatched
            expectation is the one thing that ruins a stay here.
          </p>
          <ul className="mt-8 space-y-5">
            {[site.caveats.stairs, site.caveats.market, site.caveats.housekeeping].map((c) => (
              <li key={c} className="flex gap-4 text-mist/80">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-butter" aria-hidden />
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

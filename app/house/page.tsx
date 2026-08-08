import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { OrnamentDivider, SectionMark } from "@/components/Ornament";
import { PhotoCredit } from "@/components/PhotoCredit";
import { PhotoPending } from "@/components/PhotoPending";
import { placeImages } from "@/lib/image-credits";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Story — Kora House, McLeodganj",
  description:
    "Why Kora House is named for the Lingkhor pilgrim's path it sits on, and what that means for guests staying here.",
};

export default function HousePage() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-20 md:px-8 md:pt-28">
        <SectionMark eyebrow="The story" variant="lotus" />
        <h1 className="display-xl mt-5 max-w-3xl">The kora, and the house on it</h1>

        <div className="mt-10 max-w-2xl space-y-6">
          <p className="lede">
            <em>Kora</em> is the Tibetan word for circumambulation — walking
            clockwise around a sacred site as an act of devotion, of settling
            the mind, of simply arriving somewhere on foot instead of by
            vehicle. In McLeodganj that circuit runs around the Tsuglagkhang
            complex, the residence and temple of His Holiness the Dalai Lama,
            and it is known locally as the Lingkhor — lined with prayer wheels,
            mani stones, and strings of flags that fade a little more with
            every monsoon.
          </p>
          <p className="text-ink-soft">
            Kora House takes its name from this path because it sits directly
            on it, on Buddha House Road, a short walk from the temple itself.
            Guests who stay here aren&apos;t visiting the kora as a stop between
            breakfast and lunch. It is the road outside the front door.
          </p>
          <p className="text-ink-soft">
            The house holds six rooms, a shared balcony that catches the valley
            at the end of the day, and views that shift constantly with the
            weather coming off the Dhauladhar range. It is built for people who
            want to be close to McLeodganj&apos;s centre without living inside
            the noise of the main market — near enough to walk to Jogiwara Road
            for dinner, far enough to hear almost nothing but wind and prayer
            flags at night.
          </p>
        </div>

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
          McLeodganj, down the hill from the house. Photographs of the house
          itself are on their way from the hosts.
        </p>
      </section>

      <div className="py-20">
        <OrnamentDivider variant="cloud" />
      </div>

      {/* ---------- The walk itself ---------- */}
      <section className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <SectionMark eyebrow="A short history of the walk" variant="knot" />
            <h2 className="display-lg mt-5">It isn&apos;t curated for visitors</h2>
          </div>
          <div className="space-y-5">
            <p className="text-ink-soft">
              The Lingkhor has been walked daily for decades by residents of
              McLeodganj — Tibetan elders turning hand-held prayer wheels, monks
              on their way to morning prayers, locals fitting in a lap before
              opening their shops.
            </p>
            <p className="text-ink-soft">
              It is simply what the town does every morning, and Kora House
              happens to be one of the houses it passes.
            </p>
            <Link
              href="/experiences"
              className="inline-block border-b border-maroon/40 pb-1 text-sm text-maroon transition-colors hover:border-maroon"
            >
              What the walk actually involves
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- The palette ---------- */}
      <section className="mx-auto mt-24 max-w-6xl px-5 md:px-8">
        <div className="border-t border-ink/10 pt-14">
          <SectionMark eyebrow="The design, briefly" variant="cloud" />
          <p className="lede mt-5 max-w-2xl">
            The maroon and gold through the house nod to the robes and gilding
            of the temple below; the deodar green to the forest that lines the
            walk; the ink-slate grey to the stone the mani walls are built from.
            None of it is decoration for its own sake — it is the same palette
            the town wears.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              { c: "bg-maroon", n: "Zangskar maroon" },
              { c: "bg-butter", n: "Butter lamp" },
              { c: "bg-deodar", n: "Deodar" },
              { c: "bg-ink", n: "Ink slate" },
            ].map((s) => (
              <div key={s.n} className="flex items-center gap-2.5">
                <span className={`h-7 w-7 rounded-[var(--radius-kora)] ${s.c}`} aria-hidden />
                <span className="font-data text-[11px] text-ink-soft">{s.n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Who runs it ---------- */}
      <section className="mx-auto mt-24 max-w-6xl px-5 md:px-8">
        <div className="border-t border-ink/10 pt-14">
          <SectionMark eyebrow="Who runs the house" variant="knot" />
          <p className="mt-5 max-w-2xl text-ink-soft">
            There is no front desk. Someone walks up with you and shows you
            where things are.
          </p>
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

      {/* ---------- Caveats ---------- */}
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
          <Link
            href="/rooms"
            className="mt-9 inline-block border-b border-butter/50 pb-1 text-sm text-butter transition-colors hover:border-butter"
          >
            Read the rooms
          </Link>
        </div>
      </section>
    </>
  );
}

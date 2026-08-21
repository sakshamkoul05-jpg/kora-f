import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { OrnamentDivider, SectionMark } from "@/components/Ornament";
import { PhotoCredit } from "@/components/PhotoCredit";
import { PhotoPending } from "@/components/PhotoPending";
import { housePhotos, placeImages } from "@/lib/image-credits";
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
            <em>Kora</em> means circumambulation — walking a circuit around a
            sacred site, as an act of devotion, of settling the mind, of simply
            arriving somewhere on foot. In McLeodganj that circuit runs around
            the Tsuglagkhang complex, the temple and residence of His Holiness
            the Dalai Lama, and the house stands on it. You are, more or less,
            neighbours of the Dalai Lama while you are here.
          </p>
          <p className="text-ink-soft">
            From the balcony you can watch Tibetans and other practitioners
            making their way round the temple. They are performing a kora. Most
            carry a <em>mala</em> — prayer beads, used to count recitations of a
            mantra. The one you will hear most often is{" "}
            <em>om mani padme hum</em>, which stands for compassion.
          </p>
          <p className="text-ink-soft">
            Behind the house is the police and security post for His Holiness,
            so the lane is well watched. On the hill there is a brightly painted
            Shiva temple, and at some point in the day you will hear its bell —
            rung both to call the deity and to wake up whoever is about to
            worship.
          </p>
          <p className="text-ink-soft">
            The house sits inside a restricted core zone, where commercial
            expansion and construction are tightly controlled. It is the reason
            the view from the balcony is likely to stay the view from the
            balcony.
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

      {/* ---------- Why the house exists ---------- */}
      <section className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:gap-16">
          <div>
            <SectionMark eyebrow="Why the house exists" variant="knot" />
            <h2 className="display-lg mt-5">Built to finish someone&apos;s wish</h2>
          </div>
          <div className="space-y-5">
            <p className="text-ink-soft">
              Rohitash and Ashish&apos;s late father, a veteran of the 1965 war,
              bought this land. He passed away before the building was
              completed.
            </p>
            <p className="text-ink-soft">
              His sons completed it between them — Rohitash took on the
              construction and runs the house day to day; Ashish handles the
              bookings and everything online. What they wanted was to
              commemorate their father, and the thing he had wanted: somewhere
              people could come together, enjoy the beauty, and learn from each
              other.
            </p>
            <p className="text-ink-soft">
              What comes next is sustainable power and water, and a communal
              space for gatherings and events.
            </p>
          </div>
        </div>

        {/* The family's own photograph. Placed here, in the family's part of
            the story, rather than on the homepage: on a homepage next to a
            booking button it would read as an endorsement of the guesthouse,
            which it is not. */}
        <figure className="mt-14">
          <div className="relative aspect-[3/2] overflow-hidden rounded-[var(--radius-card)]">
            <Image
              src={housePhotos.hostsWithHisHoliness.file}
              alt={housePhotos.hostsWithHisHoliness.alt}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 72rem, 100vw"
            />
          </div>
          <figcaption className="mt-3 text-sm text-ink-soft">
            {housePhotos.hostsWithHisHoliness.caption}
          </figcaption>
        </figure>
      </section>

      {/* ---------- In their own words ---------- */}
      <section className="mx-auto mt-24 max-w-6xl px-5 md:px-8">
        <div className="border-t border-ink/10 pt-14">
          <SectionMark eyebrow="In their own words" variant="cloud" />
          <div className="mt-8 grid gap-12 md:grid-cols-[1fr_1fr] md:gap-16">
            <div className="space-y-5">
              <p className="lede">
                &ldquo;We originally built this home for ourselves, our family
                and our friends. Over time we realised that the joy of staying
                here — the mountain views, and being a short walk from the
                residence of His Holiness — was worth sharing with travellers
                from around the world.&rdquo;
              </p>
              <p className="text-ink-soft">
                &ldquo;Hosting has given us the chance to meet people from very
                different backgrounds, hear their stories, and have
                conversations that often turn into lasting friendships.&rdquo;
              </p>
            </div>
            <div className="space-y-5">
              <p className="text-ink-soft">
                &ldquo;From the moment guests arrive they are met by the
                panorama and a kind of quiet that makes this place what it is.
                Some come for the closeness to His Holiness&apos; residence. Many
                simply tell us, within the first few minutes, that what they
                want is to sit on the balcony with a chai and watch the sunset
                over the mountains.&rdquo;
              </p>
              <p className="font-data text-[11px] tracking-[0.14em] text-ink/45">
                — ROHITASH &amp; ASHISH
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- The town ---------- */}
      <section className="mx-auto mt-24 max-w-6xl px-5 md:px-8">
        <div className="border-t border-ink/10 pt-14">
          <div className="grid gap-12 md:grid-cols-[1fr_1fr] md:gap-16">
            <div>
              <SectionMark eyebrow="The town it sits in" variant="lotus" />
              <h2 className="display-lg mt-5">Two cultures, one hillside</h2>
            </div>
            <div className="space-y-5">
              <p className="text-ink-soft">
                Tibetans in exile settled here in 1960, after their land and
                culture were taken by the invading Chinese, and they were able
                to because India made room for them. Religious difference has
                long been ordinary in this country, and it is worth noticing how
                peaceably these particular traditions sit side by side on one
                hillside.
              </p>
              <p className="text-ink-soft">
                Guests here have ranged from Gaddi shepherds&apos; neighbours in
                the villages below to people who came for a teaching and stayed
                a month. The point of the house is that they end up on the same
                balcony.
              </p>
              <Link
                href="/guidebook"
                className="inline-block border-b border-maroon/40 pb-1 text-sm text-maroon transition-colors hover:border-maroon"
              >
                The guidebook the hosts keep
              </Link>
            </div>
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
              { c: "bg-deodar-deep", n: "Deodar" },
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

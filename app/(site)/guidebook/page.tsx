import type { Metadata } from "next";
import Link from "next/link";
import { Ornament, OrnamentDivider, SectionMark } from "@/components/Ornament";
import {
  TAXIS,
  attractions,
  emergencyNumbers,
  restaurants,
  sidhbari,
  teachings,
  volunteering,
  volunteeringIntro,
  type Place,
} from "@/lib/guidebook";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Guidebook — Kora House, McLeodganj",
  description:
    "The house guidebook: where to eat in McLeodganj, what to see, where to volunteer, how to register for a Dalai Lama teaching, and the numbers worth having.",
};

function PlaceCard({ place }: { place: Place }) {
  return (
    <article className="rounded-[var(--radius-card)] border border-ink/10 bg-paper-raised p-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="display-md">{place.name}</h3>
        {place.favourite && (
          <span className="rounded-[var(--radius-kora)] bg-butter/20 px-2 py-0.5 font-data text-[10px] tracking-[0.14em] text-ink/70">
            ★ GUEST FAVOURITE
          </span>
        )}
      </div>

      {(place.meta || place.distance) && (
        <p className="mt-1.5 font-data text-[11px] tracking-wide text-ink/45">
          {[place.meta, place.distance].filter(Boolean).join(" · ")}
        </p>
      )}

      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{place.body}</p>

      {place.amenities && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {place.amenities.map((a) => (
            <span
              key={a}
              className="rounded-[var(--radius-kora)] bg-deodar/12 px-2.5 py-1 text-[11px] text-deodar"
            >
              {a}
            </span>
          ))}
        </div>
      )}

      {place.url && (
        <a
          href={place.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block border-b border-maroon/40 pb-0.5 text-xs text-maroon transition-colors hover:border-maroon"
        >
          Visit site
        </a>
      )}
    </article>
  );
}

const contents = [
  { id: "eat", label: "Where to eat" },
  { id: "see", label: "What to see" },
  { id: "volunteer", label: "Volunteering" },
  { id: "teachings", label: "Dalai Lama teachings" },
  { id: "practical", label: "Numbers worth having" },
];

export default function GuidebookPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <SectionMark eyebrow="The guidebook" variant="lotus" />
      <h1 className="display-xl mt-5 max-w-3xl">What the hosts would tell you</h1>
      <p className="lede mt-7 max-w-2xl">
        This is the guidebook kept in the house, written by Rohitash and Ashish
        from their own town — where they eat, what they send guests to see, and
        the practical things that are genuinely hard to find out otherwise.
      </p>

      {/* Contents */}
      <nav aria-label="Guidebook contents" className="mt-10 flex flex-wrap gap-2">
        {contents.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="rounded-[var(--radius-kora)] border border-ink/15 px-4 py-2 text-sm text-ink-soft transition-colors hover:border-ink/40"
          >
            {c.label}
          </a>
        ))}
      </nav>

      {/* ---------------- Eat ---------------- */}
      <section id="eat" className="mt-20 scroll-mt-28">
        <SectionMark eyebrow="Where to eat" variant="cloud" />
        <h2 className="display-lg mt-5">Twelve places, in the hosts&apos; order</h2>
        <p className="lede mt-5 max-w-xl">
          McLeodganj eats well for a small town — Tibetan, Indian, Japanese, and
          a lot of very good vegetarian food.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {restaurants.map((r) => (
            <PlaceCard key={r.name} place={r} />
          ))}
        </div>
      </section>

      <div className="py-16">
        <OrnamentDivider variant="lotus" />
      </div>

      {/* ---------------- See ---------------- */}
      <section id="see" className="scroll-mt-28">
        <SectionMark eyebrow="What to see" variant="knot" />
        <h2 className="display-lg mt-5">Temples, treks and quiet rooms</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {attractions.map((a) => (
            <PlaceCard key={a.name} place={a} />
          ))}
        </div>

        <div className="mt-12 rounded-[var(--radius-card)] border border-ink/12 bg-paper p-7">
          <p className="eyebrow text-maroon">In Sidhbari</p>
          <p className="mt-2 text-sm text-ink-soft">
            Both worth the twenty-minute taxi.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {sidhbari.map((s) => (
              <PlaceCard key={s.name} place={s} />
            ))}
          </div>
        </div>

        <p className="mt-8 max-w-xl border-l-2 border-butter/50 pl-4 text-sm text-ink-soft/80">
          The kora itself starts at the door — it has{" "}
          <Link href="/experiences" className="text-maroon underline underline-offset-4">
            its own page
          </Link>
          .
        </p>
      </section>

      <div className="py-16">
        <OrnamentDivider variant="cloud" />
      </div>

      {/* ---------------- Volunteer ---------------- */}
      <section id="volunteer" className="scroll-mt-28">
        <SectionMark eyebrow="Volunteering" variant="lotus" />
        <h2 className="display-lg mt-5">If you have an hour, or a month</h2>
        <p className="lede mt-5 max-w-2xl">{volunteeringIntro}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {volunteering.map((v) => (
            <PlaceCard key={v.name} place={v} />
          ))}
        </div>
      </section>

      <div className="py-16">
        <OrnamentDivider variant="knot" />
      </div>

      {/* ---------------- Teachings ---------------- */}
      <section id="teachings" className="scroll-mt-28">
        <SectionMark eyebrow="Dalai Lama teachings" variant="cloud" />
        <h2 className="display-lg mt-5">How to actually get in</h2>
        <p className="lede mt-5 max-w-2xl">{teachings.intro}</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-6">
            <p className="eyebrow text-maroon">Where to register</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {teachings.registerAt}
            </p>
          </div>

          <div className="rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-6">
            <p className="eyebrow text-maroon">Bring to register</p>
            <ul className="mt-3 space-y-2.5">
              {teachings.bringToRegister.map((i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-butter" aria-hidden />
                  {i}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-6">
            <p className="eyebrow text-maroon">Bring to the teaching</p>
            <ul className="mt-3 space-y-2.5">
              {teachings.bringToTeaching.map((i) => (
                <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-butter" aria-hidden />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-[var(--radius-card)] border border-maroon/25 bg-maroon/[0.06] p-6">
          <p className="eyebrow text-maroon">Leave behind</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{teachings.doNotBring}</p>
        </div>

        <a
          href={teachings.url}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block border-b border-maroon/40 pb-1 text-sm text-maroon transition-colors hover:border-maroon"
        >
          Public teaching schedule at dalailama.com
        </a>
      </section>

      <div className="py-16">
        <OrnamentDivider variant="lotus" />
      </div>

      {/* ---------------- Practical ---------------- */}
      <section id="practical" className="scroll-mt-28">
        <SectionMark eyebrow="Numbers worth having" variant="knot" />
        <h2 className="display-lg mt-5">Taxis and emergencies</h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-7">
            <p className="eyebrow text-ink/45">Taxis</p>
            {TAXIS.consentToPublish ? (
              <ul className="mt-4 space-y-2.5">
                {TAXIS.drivers.map((d) => (
                  <li key={d.name} className="flex justify-between gap-4 text-sm">
                    <span className="text-ink-soft">{d.name}</span>
                    <a href={`tel:${d.phone.replace(/\s/g, "")}`} className="font-data text-maroon">
                      {d.phone}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                The house keeps three drivers it uses regularly. Ask at the
                house, or message us, and we&apos;ll put you in touch —
                we&apos;d rather not publish their personal numbers on the open
                web without asking them first.
              </p>
            )}
          </div>

          <div className="rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-7">
            <p className="eyebrow text-ink/45">Emergency</p>
            <ul className="mt-4 space-y-2.5">
              {emergencyNumbers.map((e) => (
                <li key={e.name} className="flex justify-between gap-4 text-sm">
                  <span className="text-ink-soft">{e.name}</span>
                  <a href={`tel:${e.number}`} className="font-data text-maroon">
                    {e.number}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-ink/10 pt-4 text-sm text-ink-soft">
              The house: <span className="font-data">{site.phone}</span>
            </p>
          </div>
        </div>
      </section>

      <div className="mt-20 flex justify-center">
        <Ornament variant="cloud" />
      </div>
      <p className="mt-4 text-center text-sm text-ink/45">
        Anything missing? Ask at the house — that&apos;s what we&apos;re for.
      </p>
    </div>
  );
}

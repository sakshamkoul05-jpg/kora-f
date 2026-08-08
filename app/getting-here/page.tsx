import type { Metadata } from "next";
import Image from "next/image";
import { SectionMark } from "@/components/Ornament";
import { PhotoCredit } from "@/components/PhotoCredit";
import { placeImages } from "@/lib/image-credits";
import { site, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Getting to Kora House, McLeodganj",
  description:
    "Directions to Kora House on Buddha House Road, McLeodganj — near the Dalai Lama temple complex and the Lingkhor walk.",
};

// TODO_CONFIRM: every figure in this block. Left deliberately unstated rather
// than guessed — a wrong walking time at 11pm with a bag is worse than none.
const practical = [
  { label: "From McLeodganj bus stand", value: "TODO_CONFIRM — minutes on foot / short taxi" },
  { label: "From Kangra (Gaggal) airport", value: "TODO_CONFIRM — distance by road" },
  { label: "Parking", value: "TODO_CONFIRM — on-site or street" },
];

export default function GettingHerePage() {
  const mapsUrl = `https://www.google.com/maps?q=${site.coordinates.lat},${site.coordinates.lng}`;
  const mapsEmbedUrl = `https://www.google.com/maps?q=${site.coordinates.lat},${site.coordinates.lng}&z=15&output=embed`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <SectionMark eyebrow="Getting here" variant="cloud" />
      <h1 className="display-xl mt-5">Finding the house</h1>
      <p className="lede mt-7 max-w-xl">
        Kora House is on Buddha House Road, past the Dalai Lama security
        quarters, on the same stretch as the Lingkhor walk itself. It is a
        homestay, not a hotel with a lit-up signboard — the easiest way in is to
        message us when you&apos;re close, and we&apos;ll walk you the last
        stretch if you need it.
      </p>

      <div className="mt-14 grid gap-14 md:grid-cols-2">
        <div className="space-y-8">
          <div className="overflow-hidden rounded-[var(--radius-card)] border border-ink/12">
            <iframe
              title="Map showing the location of Kora House"
              src={mapsEmbedUrl}
              className="aspect-[4/3] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block border-b border-maroon/40 pb-1 text-sm text-maroon transition-colors hover:border-maroon"
          >
            Open in Google Maps
          </a>

          <div className="group relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
            <Image
              src={placeImages.dharamshalaHimalayas.file}
              alt={placeImages.dharamshalaHimalayas.alt}
              fill
              className="photo-warm object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
            <PhotoCredit image={placeImages.dharamshalaHimalayas} />
          </div>
        </div>

        <div className="space-y-10">
          <div>
            <p className="eyebrow text-ink/45">Address</p>
            <address className="mt-3 space-y-1 text-lg not-italic leading-relaxed">
              <p>{site.address.line1}</p>
              <p>{site.address.line2}</p>
              <p>{site.address.line3}</p>
            </address>
            <p className="mt-3 text-sm text-ink-soft">{site.address.note}</p>
            <p className="mt-3 font-data text-xs text-ink/40">
              {site.coordinates.lat}, {site.coordinates.lng}
            </p>
          </div>

          <div className="border-t border-ink/10 pt-8">
            <p className="eyebrow text-ink/45">Practical</p>
            <dl className="mt-4 space-y-3">
              {practical.map((row) => (
                <div key={row.label} className="flex flex-wrap justify-between gap-2 text-sm">
                  <dt className="text-ink-soft">{row.label}</dt>
                  <dd className="font-data text-xs text-ink/40">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              What to expect: a quiet residential stretch, unmarked from the
              main road. Send us your arrival time and we&apos;ll guide you in.
            </p>
          </div>

          <div className="rounded-[var(--radius-card)] border border-maroon/25 bg-maroon/[0.06] p-6">
            <p className="eyebrow text-maroon">The last stretch, honestly</p>
            <ul className="mt-4 space-y-4">
              {[site.caveats.stairs, site.caveats.market, site.caveats.housekeeping].map((c) => (
                <li key={c} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-maroon/60" aria-hidden />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-ink/10 pt-8">
            <p className="eyebrow text-ink/45">Contact</p>
            <div className="mt-3 space-y-1.5 font-data">
              <p>{site.phone}</p>
              <p>WhatsApp {site.whatsapp}</p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              {site.caretaker.name} ({site.caretaker.role}) is on site{" "}
              {site.caretaker.onSiteHours}; {site.caretaker.note.toLowerCase()}.
            </p>
            <a
              href={whatsappUrl("Hello — I'm on my way to Kora House and would like directions.")}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block rounded-[var(--radius-kora)] bg-deodar px-6 py-3 font-display text-sm tracking-wide text-paper transition-opacity hover:opacity-90"
            >
              Message us for directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

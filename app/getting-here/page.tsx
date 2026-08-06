import type { Metadata } from "next";
import Image from "next/image";
import { SectionMark } from "@/components/Ornament";
import { PhotoCredit } from "@/components/PhotoCredit";
import { placeImages } from "@/lib/image-credits";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Getting Here — Kora House" };

export default function GettingHerePage() {
  const mapsUrl = `https://www.google.com/maps?q=${site.coordinates.lat},${site.coordinates.lng}`;
  const mapsEmbedUrl = `https://www.google.com/maps?q=${site.coordinates.lat},${site.coordinates.lng}&z=15&output=embed`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <SectionMark eyebrow="Getting here" variant="cloud" />
      <h1 className="display-xl mt-5">Find the house</h1>
      <p className="lede mt-7 max-w-xl">
        Up past the security quarters and Horizon Villa, where the road narrows
        and the steps start. Tell your driver Buddha House Road.
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
          </div>
        </div>
      </div>
    </div>
  );
}

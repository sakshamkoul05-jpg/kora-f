import type { Metadata } from "next";
import Image from "next/image";
import { PhotoCredit } from "@/components/PhotoCredit";
import { placeImages } from "@/lib/image-credits";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Getting Here — Kora House" };

export default function GettingHerePage() {
  const mapsUrl = `https://www.google.com/maps?q=${site.coordinates.lat},${site.coordinates.lng}`;
  const mapsEmbedUrl = `https://www.google.com/maps?q=${site.coordinates.lat},${site.coordinates.lng}&z=15&output=embed`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <p className="eyebrow text-ink/50">Getting here</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl">Find the house</h1>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div>
          <div className="hairline overflow-hidden rounded-[var(--radius-card)]">
            <iframe
              title="Map showing the location of Kora House"
              src={mapsEmbedUrl}
              className="aspect-[4/3] w-full grayscale-[15%]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm text-maroon underline underline-offset-4"
          >
            Open in Google Maps
          </a>

          <div className="group relative mt-6 aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
            <Image
              src={placeImages.dharamshalaHimalayas.file}
              alt={placeImages.dharamshalaHimalayas.alt}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
            <PhotoCredit image={placeImages.dharamshalaHimalayas} />
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <p className="eyebrow text-ink/50">Address</p>
            <address className="mt-2 space-y-0.5 not-italic text-ink/80">
              <p>{site.address.line1}</p>
              <p>{site.address.line2}</p>
              <p>{site.address.line3}</p>
            </address>
            <p className="mt-2 text-sm text-ink/50">{site.address.note}</p>
            <p className="mt-2 font-data text-xs text-ink/40">
              {site.coordinates.lat}, {site.coordinates.lng}
            </p>
          </div>

          <div className="hairline-t pt-8">
            <p className="eyebrow text-maroon">The last stretch, honestly</p>
            <ul className="mt-3 space-y-2 text-sm text-ink/70">
              <li>{site.caveats.stairs}</li>
              <li>{site.caveats.market}</li>
              <li>{site.caveats.housekeeping}</li>
            </ul>
          </div>

          <div className="hairline-t pt-8">
            <p className="eyebrow text-ink/50">Contact</p>
            <div className="mt-2 space-y-1 font-data text-sm">
              <p>{site.phone}</p>
              <p>WhatsApp {site.whatsapp}</p>
            </div>
            <p className="mt-2 text-sm text-ink/60">
              {site.caretaker.name} ({site.caretaker.role}) is on site {site.caretaker.onSiteHours};{" "}
              {site.caretaker.note.toLowerCase()}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

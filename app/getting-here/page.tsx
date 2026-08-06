import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Getting Here — Kora House" };

export default function GettingHerePage() {
  const mapsUrl = `https://www.google.com/maps?q=${site.coordinates.lat},${site.coordinates.lng}`;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
      <p className="eyebrow text-ink/50">Getting here</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl">Find the house</h1>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-[4/3] rounded-[var(--radius-kora)] bg-ink/10" aria-hidden />
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm text-maroon underline underline-offset-4"
          >
            Open in Google Maps
          </a>
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

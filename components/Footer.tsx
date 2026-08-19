import Image from "next/image";
import Link from "next/link";
import { nav, site } from "@/lib/site";
import { OrnamentDivider } from "./Ornament";

export function Footer() {
  return (
    <footer className="band-dark relative mt-auto text-mist">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-20 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            {/* The mark is transparent, so it keeps its green on the dark band —
                no need for the brightness-0/invert trick that flattened it to
                white. The wordmark stays real text rather than pixels. */}
            <div className="flex items-center gap-3">
              <Image
                src="/brand/kora-house-mark.png"
                alt=""
                width={112}
                height={50}
                className="h-auto w-[84px]"
              />
              <span className="display-md text-mist">{site.name}</span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-mist/55">
              Six rooms on Buddha House Road, on the Lingkhor — the pilgrim&apos;s
              path that circles the temple.
            </p>
            <address className="mt-6 space-y-0.5 text-sm not-italic text-mist/70">
              <p>{site.address.line1}</p>
              <p>{site.address.line2}</p>
              <p>{site.address.line3}</p>
            </address>
            <a
              href={site.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block border-b border-butter/40 pb-0.5 text-sm text-butter transition-colors hover:border-butter"
            >
              Open in Google Maps
            </a>
          </div>

          <div>
            <p className="eyebrow text-butter/70">Contact</p>
            <div className="mt-4 space-y-2 text-sm text-mist/75">
              <p className="font-data">{site.phone}</p>
              <p className="font-data">WhatsApp {site.whatsapp}</p>
              <a
                href={`mailto:${site.email}`}
                className="block break-all transition-colors hover:text-mist"
              >
                {site.email}
              </a>
              {site.instagram && (
                <a
                  href={`https://instagram.com/${site.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block transition-colors hover:text-mist"
                >
                  Instagram
                </a>
              )}
            </div>

            <a
              href={site.googleReviewUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-baseline gap-2 text-sm text-butter hover:text-butter-pale"
            >
              <span className="font-display text-lg">{site.rating.value}</span>
              <span className="text-mist/50">· {site.rating.count} Google reviews</span>
            </a>
            <a
              href={site.googleReviewUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 block text-xs text-mist/45 transition-colors hover:text-mist/80"
            >
              Stayed with us? Leave a review →
            </a>
          </div>

          <div>
            <p className="eyebrow text-butter/70">Explore</p>
            <nav className="mt-4 flex flex-col gap-2.5" aria-label="Footer">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-mist/65 transition-colors hover:text-mist"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/faq" className="text-sm text-mist/65 transition-colors hover:text-mist">
                FAQ &amp; policies
              </Link>
              <Link
                href="/credits"
                className="text-sm text-mist/40 transition-colors hover:text-mist/70"
              >
                Photo credits
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-16">
          <OrnamentDivider variant="cloud" lineTone="text-mist/12" />
        </div>

        <p className="mt-6 text-center text-xs text-mist/35">
          © {new Date().getFullYear()} {site.name} — {site.footerTagline}
        </p>
      </div>
    </footer>
  );
}

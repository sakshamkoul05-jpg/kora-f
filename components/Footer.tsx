import Link from "next/link";
import { nav, site } from "@/lib/site";
import { OrnamentDivider } from "./Ornament";

export function Footer() {
  return (
    <footer className="band-dark relative mt-auto text-mist">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-20 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <p className="display-md">{site.name}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-mist/55">
              A six-room house on the ridge above the temple, run by the family
              who live in it.
            </p>
            <address className="mt-6 space-y-0.5 text-sm not-italic text-mist/70">
              <p>{site.address.line1}</p>
              <p>{site.address.line2}</p>
              <p>{site.address.line3}</p>
            </address>
          </div>

          <div>
            <p className="eyebrow text-butter/70">Contact</p>
            <div className="mt-4 space-y-2 font-data text-sm text-mist/75">
              <p>{site.phone}</p>
              <p>WhatsApp {site.whatsapp}</p>
            </div>
            <a
              href={site.googleReviewUrl}
              className="mt-5 inline-flex items-baseline gap-2 text-sm text-butter hover:text-butter-pale"
            >
              <span className="font-display text-lg">{site.rating.value}</span>
              <span className="text-mist/50">· {site.rating.count} Google reviews</span>
            </a>
          </div>

          <div>
            <p className="eyebrow text-butter/70">Explore</p>
            <nav className="mt-4 flex flex-col gap-2.5">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-mist/65 transition-colors hover:text-mist"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/credits" className="text-sm text-mist/40 transition-colors hover:text-mist/70">
                Photo credits
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-16">
          <OrnamentDivider variant="cloud" lineTone="text-mist/12" />
        </div>

        <p className="mt-6 text-center text-xs text-mist/35">
          © {new Date().getFullYear()} {site.name} · McLeodganj, Himachal Pradesh
        </p>
      </div>
    </footer>
  );
}

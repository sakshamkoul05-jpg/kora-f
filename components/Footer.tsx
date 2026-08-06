import Link from "next/link";
import { nav, site } from "@/lib/site";
import { ArcDivider } from "./ArcDivider";

export function Footer() {
  return (
    <footer className="bg-ink text-mist">
      <ArcDivider className="text-mist/20" />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-12 pt-4 md:grid-cols-3 md:px-8">
        <div>
          <p className="font-display text-lg">{site.name}</p>
          <address className="mt-3 space-y-0.5 text-sm not-italic text-mist/70">
            <p>{site.address.line1}</p>
            <p>{site.address.line2}</p>
            <p>{site.address.line3}</p>
            <p className="pt-2 text-mist/50">{site.address.note}</p>
          </address>
        </div>

        <div>
          <p className="eyebrow text-mist/50">Contact</p>
          <div className="mt-3 space-y-1 font-data text-sm">
            <p>{site.phone}</p>
            <p>WhatsApp {site.whatsapp}</p>
          </div>
          <a
            href={site.googleReviewUrl}
            className="mt-3 inline-block text-sm text-butter underline underline-offset-4"
          >
            {site.rating.value} · {site.rating.count} Google reviews
          </a>
        </div>

        <div>
          <p className="eyebrow text-mist/50">Explore</p>
          <nav className="mt-3 flex flex-col gap-1">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-mist/70 hover:text-mist">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="hairline-t border-mist/10 px-5 py-4 text-center text-xs text-mist/40 md:px-8">
        © {new Date().getFullYear()} {site.name}
      </div>
    </footer>
  );
}

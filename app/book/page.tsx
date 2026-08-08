import type { Metadata } from "next";
import Link from "next/link";
import { Ornament, SectionMark } from "@/components/Ornament";
import { rooms } from "@/lib/rooms";
import { site, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book Kora House, McLeodganj",
  description:
    "Check availability and book your stay at Kora House, a homestay on the pilgrim's circuit in McLeodganj, Himachal Pradesh.",
};

/**
 * Enquiry page, not a booking engine.
 *
 * The build spec puts the real booking flow — Razorpay, accounts, a database —
 * at step 6, which has not been started. This page does the job that actually
 * needs doing now: it hands the guest to WhatsApp with the right questions
 * already asked, which is how the house takes bookings today.
 *
 * Deliberately NOT a form. A form with no backend is a trap: it looks like it
 * sent something and it didn't. The fields below are shown as the things to
 * include in the message, and the WhatsApp link is pre-filled with them.
 */
export default function BookPage() {
  const asks = [
    "Your dates",
    "How many guests",
    "Room preference, if you have one",
    "Anything else we should know",
  ];

  return (
    <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
      <SectionMark eyebrow="Book" variant="lotus" />
      <h1 className="display-xl mt-5">Get in touch</h1>
      <p className="lede mt-7">
        The fastest way to check availability is WhatsApp — we usually reply
        within the day. Tell us your dates, how many of you there are, and
        whether you have a room in mind, and we&apos;ll take it from there.
      </p>

      <div className="mt-12 rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-8">
        <p className="eyebrow text-ink/45">What to include</p>
        <ul className="mt-5 space-y-3">
          {asks.map((a) => (
            <li key={a} className="flex gap-3 text-ink-soft">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-butter" aria-hidden />
              {a}
            </li>
          ))}
        </ul>

        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noreferrer"
          className="lamp-hover mt-8 inline-block rounded-[var(--radius-kora)] bg-maroon px-8 py-3.5 font-display text-[15px] tracking-wide text-paper transition-colors hover:bg-maroon-deep"
        >
          Send on WhatsApp
        </a>
        <p className="mt-4 text-xs leading-relaxed text-ink/45">
          Opens WhatsApp with the questions above already filled in. Or call{" "}
          <span className="font-data">{site.phone}</span>.
        </p>
      </div>

      {/* Room shortcut, so an enquiry can name a room */}
      <div className="mt-16 border-t border-ink/10 pt-12">
        <SectionMark eyebrow="The six rooms" variant="knot" />
        <p className="mt-4 text-sm text-ink-soft">
          Named for stops on the walk outside. Mention one if you have a
          preference — or ask and the hosts will suggest which suits your stay.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {rooms.map((room) => (
            <Link
              key={room.slug}
              href={`/rooms/${room.slug}`}
              className="rounded-[var(--radius-kora)] border border-ink/15 px-4 py-2 text-sm text-ink-soft transition-colors hover:border-ink/40"
            >
              {room.name}
            </Link>
          ))}
        </div>
      </div>

      {/* The caveats belong here too — before someone commits, not after */}
      <div className="mt-16 rounded-[var(--radius-card)] border border-maroon/25 bg-maroon/[0.06] p-7">
        <p className="eyebrow text-maroon">Before you book</p>
        <ul className="mt-4 space-y-4">
          {[site.caveats.stairs, site.caveats.market, site.caveats.housekeeping].map((c) => (
            <li key={c} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-maroon/60" aria-hidden />
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-16 flex justify-center">
        <Ornament variant="cloud" />
      </div>
      <p className="mt-4 text-center text-sm text-ink/45">
        Kora House — {site.footerTagline}
      </p>
    </div>
  );
}

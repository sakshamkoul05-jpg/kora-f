import type { Metadata } from "next";
import Link from "next/link";
import { Ornament, SectionMark } from "@/components/Ornament";
import { rooms } from "@/lib/rooms";
import { site } from "@/lib/site";
import { BookingForm } from "./BookingForm";

export const metadata: Metadata = {
  title: "Book Kora House, McLeodganj",
  description:
    "Check availability and book your stay at Kora House, a homestay on the pilgrim's circuit in McLeodganj, Himachal Pradesh.",
};

/**
 * Booking REQUEST page.
 *
 * There is a backend now, so the earlier no-form placeholder has been replaced
 * with a real one. It is still a request rather than an instant booking: the
 * hosts read each and reply, which is how this house has always worked, and
 * the copy says so rather than implying a room is held.
 *
 * WhatsApp is kept beside the form throughout. If the database is unreachable
 * or simply not configured yet, the route the house has always used still
 * works — the form degrades to it rather than failing.
 *
 * Payment is NOT here, deliberately. No nightly rate has been confirmed, so
 * there is no amount to charge. See BACKEND.md.
 */
export default function BookPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
      <SectionMark eyebrow="Book" variant="lotus" />
      <h1 className="display-xl mt-5">Get in touch</h1>
      <p className="lede mt-7">
        The fastest way to check availability is WhatsApp — we usually reply
        within the day. Tell us your dates, how many of you there are, and
        whether you have a room in mind, and we&apos;ll take it from there.
      </p>

      {/* Said plainly, because it is unusual and people should know it up front */}
      <div className="mt-8 rounded-[var(--radius-card)] border border-ink/12 bg-paper p-6">
        <p className="eyebrow text-deodar">How we take bookings</p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          We like to talk to guests before accepting a booking — not to vet
          anyone, but to be sure the house is genuinely right for the stay you
          have in mind. It is a quiet home on a steep hillside, not a hotel.
          Guests who are respectful, considerate of others and happy in a
          peaceful place tend to love it here.
        </p>
      </div>

      <div className="mt-12 rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-8">
        <BookingForm />
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

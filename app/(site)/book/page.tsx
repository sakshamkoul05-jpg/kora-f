import type { Metadata } from "next";
import Link from "next/link";
import { Ornament, SectionMark } from "@/components/Ornament";
import { Offers } from "@/components/Offers";
import { getAvailability } from "@/lib/availability";
import { loadPublicOffers } from "@/lib/offers";
import { MAX_NIGHTS, nightsBetween, parseDate } from "@/lib/booking";
import { formatRange, guestsLabel, nightsLabel } from "@/lib/dates";
import { formatInr } from "@/lib/pricing";
import { rooms as staticRooms } from "@/lib/rooms";
import { site, whatsappUrl } from "@/lib/site";
import { SearchBar } from "./SearchBar";

export const metadata: Metadata = {
  title: "Book Kora House, McLeodganj",
  description:
    "Check dates and rates for Kora House, a six-room homestay on the pilgrim's circuit in McLeodganj, Himachal Pradesh.",
};

/**
 * Search and results.
 *
 * Shaped like any booking site — dates in, priced rooms out — but the button
 * says "Request" rather than "Book now", because that is what it does. A host
 * reads every request and replies; nothing is held and nothing is charged
 * until they accept. The copy has to be honest about that at the point of
 * clicking, not buried in a policy page.
 *
 * Where a rate has not been set the room still appears, priced "on request".
 * That is the live path today: no rate is confirmed for any room yet.
 */
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? "";

  const from = one("from");
  const to = one("to");
  const adults = Math.max(1, Number(one("adults")) || 2);
  const childCount = Math.max(0, Number(one("children")) || 0);

  const datesValid =
    Boolean(parseDate(from)) &&
    Boolean(parseDate(to)) &&
    nightsBetween(from, to) > 0 &&
    nightsBetween(from, to) <= MAX_NIGHTS;

  const [result, publicOffers] = await Promise.all([
    datesValid ? getAvailability(from, to) : Promise.resolve(null),
    loadPublicOffers(),
  ]);
  const nights = datesValid ? nightsBetween(from, to) : 0;

  return (
    <div className="mx-auto max-w-4xl px-5 py-20 md:px-8 md:py-28">
      <SectionMark eyebrow="Book" variant="lotus" />
      <h1 className="display-xl mt-5">Find your dates</h1>
      <p className="lede mt-7">
        Six rooms on the kora path. Pick your dates to see what&apos;s free and
        what it costs — then send a request and one of the hosts will write back,
        usually the same day.
      </p>

      <div className="mt-10">
        <SearchBar from={from} to={to} adults={adults} childCount={childCount} />
      </div>

      {/* Said plainly and early, because it is unusual */}
      <div className="mt-6 rounded-[var(--radius-card)] border border-ink/12 bg-paper p-6">
        <p className="eyebrow text-deodar-deep">How booking works here</p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          We like to talk to guests before accepting a booking — not to vet
          anyone, but to be sure the house is genuinely right for the stay you
          have in mind. So you send a request, we reply, and only then do you pay
          a deposit to hold the room. Nothing is charged before we&apos;ve said
          yes.
        </p>
      </div>

      <Offers offers={publicOffers.offers} packages={publicOffers.packages} />

      {/* ---------------------------------------------------------- results */}
      {datesValid && result && (
        <section className="mt-14" aria-live="polite">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-ink/10 pb-4">
            {/* The dates are the headline — they're what the guest just chose
                and what they're scanning to confirm they got right. */}
            <h2 className="display-lg">{formatRange(from, to)}</h2>
            <p className="text-sm text-ink-soft">
              {nightsLabel(nights)} · {guestsLabel(adults, childCount)}
            </p>
          </div>

          {!result.configured && (
            <Fallback>
              Online availability isn&apos;t switched on yet. Message us on
              WhatsApp with your dates and we&apos;ll reply the same day.
            </Fallback>
          )}

          {result.configured && "error" in result && result.error && (
            <Fallback>
              We couldn&apos;t check the calendar just now. Please try again, or
              message us on WhatsApp.
            </Fallback>
          )}

          {result.configured && "rooms" in result && (
            <>
              <ul className="mt-8 space-y-4">
                {result.rooms.map((room) => {
                  const tooSmall =
                    room.maxOccupancy !== null && adults + childCount > room.maxOccupancy;
                  return (
                    <li
                      key={room.slug}
                      className={`rounded-[var(--radius-card)] border p-6 ${
                        room.available && !tooSmall
                          ? "border-ink/15 bg-paper-raised"
                          : "border-ink/10 bg-paper opacity-60"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="display-md">
                            <Link href={`/rooms/${room.slug}`} className="hover:underline">
                              {room.name}
                            </Link>
                          </h3>
                          <p className="mt-1 text-sm text-ink/50">
                            Room {room.number}
                            {room.hasKitchenette && " · kitchenette"}
                            {room.maxOccupancy && ` · sleeps ${room.maxOccupancy}`}
                          </p>
                        </div>

                        <div className="text-right">
                          <PriceBlock quote={room.quote} nights={nights} />
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-ink-soft">
                          {!room.available
                            ? "Taken for these dates."
                            : tooSmall
                              ? `This room sleeps ${room.maxOccupancy}.`
                              : room.quote.kind === "unbookable"
                                ? room.quote.reason
                                : ""}
                        </p>
                        {room.available && !tooSmall && room.quote.kind !== "unbookable" && (
                          <Link
                            href={`/book/checkout?room=${room.slug}&from=${from}&to=${to}&adults=${adults}&children=${childCount}`}
                            className="rounded-[var(--radius-kora)] bg-deodar-deep px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
                          >
                            Request this room
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              {result.rooms.every((r) => !r.available) && (
                <Fallback>
                  Every room is taken for those dates. Try shifting them by a day
                  or two — or message us and we&apos;ll tell you what&apos;s
                  close.
                </Fallback>
              )}

              <p className="mt-8 text-sm text-ink/50">
                A deposit of {result.depositPercent}% holds the room once a host
                accepts; the balance is paid when you arrive.
              </p>
            </>
          )}
        </section>
      )}

      {/* ------------------------------------------------ nothing searched yet */}
      {!datesValid && (
        <section className="mt-14">
          <SectionMark eyebrow="The six rooms" variant="knot" />
          <p className="mt-4 text-sm text-ink-soft">
            Named for stops on the walk outside. Pick dates above to see which
            are free.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {staticRooms.map((room) => (
              <Link
                key={room.slug}
                href={`/rooms/${room.slug}`}
                className="rounded-[var(--radius-kora)] border border-ink/15 px-4 py-2 text-sm text-ink-soft transition-colors hover:border-ink/40"
              >
                {room.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* The caveats belong before someone commits, not after */}
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

function Fallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-[var(--radius-card)] border border-ink/15 bg-paper p-6">
      <p className="text-ink-soft">{children}</p>
      <a
        href={whatsappUrl()}
        className="mt-4 inline-block rounded-[var(--radius-kora)] border border-ink/20 px-5 py-2.5 text-sm text-ink transition-colors hover:border-ink/40"
      >
        Message us on WhatsApp
      </a>
    </div>
  );
}

/** Price, or an honest absence of one. Never a zero standing in for "unknown". */
function PriceBlock({
  quote,
  nights,
}: {
  quote: import("@/lib/pricing").Quote;
  nights: number;
}) {
  if (quote.kind === "priced") {
    return (
      <>
        <p className="display-md">{formatInr(quote.totalInr)}</p>
        <p className="mt-1 text-sm text-ink/50">
          {quote.flatRate
            ? `${formatInr(quote.nights[0].rateInr)} × ${nights} night${nights === 1 ? "" : "s"}`
            : `${nights} nights, seasonal rates`}
        </p>
      </>
    );
  }
  if (quote.kind === "on-request") {
    return (
      <>
        <p className="display-md text-ink/60">On request</p>
        <p className="mt-1 max-w-[14rem] text-sm text-ink/50">
          We&apos;ll quote you when you ask.
        </p>
      </>
    );
  }
  return <p className="text-sm text-ink/50">{quote.reason}</p>;
}

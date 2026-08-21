import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionMark } from "@/components/Ornament";
import { getAvailability } from "@/lib/availability";
import { MAX_NIGHTS, nightsBetween, parseDate } from "@/lib/booking";
import { formatRange, guestsLabel, nightsLabel } from "@/lib/dates";
import { loadPricingContext } from "@/lib/pricing-data";
import { site, whatsappUrl } from "@/lib/site";
import { CheckoutPanel } from "./CheckoutPanel";

export const metadata: Metadata = {
  title: "Request a room — Kora House",
  robots: { index: false, follow: false },
};

/**
 * Checkout, in the sense that a booking site means it: here is the room, here
 * is what it costs, here is where you enter your details.
 *
 * What it is NOT is a payment page. Money comes after a host accepts, which is
 * the whole shape of this system, so the summary states the deposit that will
 * be due rather than asking for it now. Promising "pay later" and then
 * charging, or implying the room is held when it isn't, would both be lies the
 * guest only discovers afterwards.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]) ?? "";

  const roomSlug = one("room");
  const from = one("from");
  const to = one("to");
  const adults = Math.max(1, Number(one("adults")) || 2);
  const childCount = Math.max(0, Number(one("children")) || 0);

  const nights = nightsBetween(from, to);
  if (!parseDate(from) || !parseDate(to) || nights <= 0 || nights > MAX_NIGHTS || !roomSlug) {
    notFound();
  }

  const result = await getAvailability(from, to);
  const room =
    result.configured && "rooms" in result
      ? result.rooms.find((r) => r.slug === roomSlug)
      : undefined;

  // Unconfigured or unreachable: still let them ask, via the route that has
  // always worked.
  if (!result.configured || !("rooms" in result)) {
    return (
      <Shell from={from} to={to}>
        <p className="text-ink-soft">
          Online booking isn&apos;t available just now. Message us on WhatsApp
          with your dates and we&apos;ll reply the same day.
        </p>
        <a
          href={whatsappUrl(`Hello — I'd like to ask about ${from} to ${to}.`)}
          className="mt-5 inline-block rounded-[var(--radius-kora)] bg-deodar-deep px-5 py-2.5 text-sm font-medium text-paper"
        >
          Message us on WhatsApp
        </a>
      </Shell>
    );
  }

  if (!room) notFound();

  // Someone else may have been accepted between the results page and here.
  if (!room.available) {
    return (
      <Shell from={from} to={to}>
        <p className="display-md">{room.name} has just gone.</p>
        <p className="mt-3 text-ink-soft">
          Someone was accepted for these dates while you were deciding. The other
          rooms may still be free.
        </p>
        <Link
          href={`/book?from=${from}&to=${to}&adults=${adults}&children=${childCount}`}
          className="mt-5 inline-block rounded-[var(--radius-kora)] bg-deodar-deep px-5 py-2.5 text-sm font-medium text-paper"
        >
          See what else is free
        </Link>
      </Shell>
    );
  }

  const { quote } = room;
  const { settings } = await loadPricingContext();

  return (
    <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
      <Link href={`/book?from=${from}&to=${to}&adults=${adults}&children=${childCount}`}
            className="text-sm text-ink-soft hover:underline">
        ← Back to dates
      </Link>

      <SectionMark eyebrow="Your request" variant="lotus" />
      <h1 className="display-xl mt-5">{room.name}</h1>
      <p className="lede mt-4">
        {formatRange(from, to)} · {nightsLabel(nights)} · {guestsLabel(adults, childCount)}
      </p>

      <CheckoutPanel
        quote={quote}
        settings={settings}
        roomSlug={room.slug}
        roomName={room.name}
        from={from}
        to={to}
        adults={adults}
        childCount={childCount}
        nights={nights}
      />

      <p className="mt-8 text-center text-sm text-ink/50">
        Prefer to talk first? {site.phone}{" "}
        <a href={whatsappUrl()} className="underline hover:no-underline">
          Message us on WhatsApp
        </a>
        .
      </p>
    </div>
  );
}

function Shell({
  from,
  to,
  children,
}: {
  from: string;
  to: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 md:px-8">
      <Link href={`/book?from=${from}&to=${to}`} className="text-sm text-ink-soft hover:underline">
        ← Back to dates
      </Link>
      <div className="mt-6 rounded-[var(--radius-card)] border border-ink/15 bg-paper-raised p-8">
        {children}
      </div>
    </div>
  );
}

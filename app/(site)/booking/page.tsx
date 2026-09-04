import type { Metadata } from "next";
import { Ornament, SectionMark } from "@/components/Ornament";
import { loadSiteCopy } from "@/lib/content";

import { LookupForm } from "./LookupForm";

export const metadata: Metadata = {
  title: "Your booking — Kora House",
  description: "Check where your booking stands and pay your deposit.",
  robots: { index: false, follow: false },
};

/**
 * Where a guest goes when they want to know what is happening.
 *
 * Before this existed, the deposit link lived only in whatever message a host
 * sent by hand — lose it and the booking stalled with nobody at fault. Now the
 * reference on the confirmation screen is enough to come back to.
 *
 * Not indexed: there is nothing here for a search engine, and a page that
 * takes a reference and an email should not be advertised to strangers.
 */
export default async function BookingLookupPage() {
  const copy = await loadSiteCopy();
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 md:px-8 md:py-28">
      <SectionMark eyebrow="Your booking" variant="lotus" />
      <h1 className="display-xl mt-5">Where things stand</h1>
      <p className="lede mt-6">
        Your reference is on the message we sent when you asked — it looks like
        KH-2026-0417. Put it in with the email you booked with and we&apos;ll
        show you where your booking is up to.
      </p>

      <div className="mt-10">
        <LookupForm />
      </div>

      <div className="mt-14 rounded-[var(--radius-card)] border border-ink/12 bg-paper p-6">
        <p className="eyebrow text-deodar-deep">Lost your reference?</p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          Message us and we&apos;ll find it in a moment — it&apos;s six rooms,
          not six hundred. {copy.phone}
        </p>
      </div>

      <div className="mt-16 flex justify-center">
        <Ornament variant="cloud" />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "FAQ & Policies — Kora House" };

const faqs = [
  {
    q: "Is the house accessible if I have trouble with stairs?",
    a: `${site.caveats.stairs} If that's a concern, ask for the ground-floor room when you get in touch.`,
  },
  {
    q: "How far is the market?",
    a: site.caveats.market,
  },
  {
    q: "Is housekeeping daily?",
    a: `${site.caveats.housekeeping} Ask ${site.caretaker.name} if you need anything in between.`,
  },
  {
    q: "Which rooms have a kitchen?",
    a: "Three of the six rooms are self-catering with their own kitchen. See the rooms page for which ones.",
  },
  {
    q: "How do I get in touch during my stay?",
    a: `The hosts stay reachable on WhatsApp (${site.whatsapp}). ${site.caretaker.name} is on site ${site.caretaker.onSiteHours} and reachable by phone outside those hours.`,
  },
  {
    q: "What's your cancellation policy?",
    a: "Booking terms are being finalised alongside the booking system. Message the house directly for now.",
  },
] as const;

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8 md:py-24">
      <p className="eyebrow text-ink/50">FAQ &amp; policies</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl">Good to know</h1>

      <div className="mt-10 divide-y divide-ink/10">
        {faqs.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg">
              {item.q}
              <span className="ml-4 text-ink/40 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm text-ink/70">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="hairline mt-12 rounded-[var(--radius-kora)] p-6 text-center">
        <p className="font-display">Still unsure?</p>
        <p className="mt-1 text-sm text-ink/60">Message the house on WhatsApp.</p>
        <a
          href={`https://wa.me/${site.whatsapp.replace(/[^\d]/g, "")}`}
          className="mt-4 inline-block rounded-[var(--radius-kora)] bg-deodar px-5 py-2 text-sm text-mist"
        >
          Message on WhatsApp
        </a>
      </div>
    </div>
  );
}

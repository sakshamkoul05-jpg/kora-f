import type { Metadata } from "next";
import { SectionMark } from "@/components/Ornament";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "FAQ & Policies — Kora House" };

const faqs = [
  {
    q: "Is the house accessible if I have trouble with stairs?",
    a: `${site.caveats.stairs} If that's a concern, ask for the ground-floor room when you get in touch.`,
  },
  { q: "How far is the market?", a: site.caveats.market },
  {
    q: "Is housekeeping daily?",
    a: `${site.caveats.housekeeping} Ask ${site.caretaker.name} if you need anything in between.`,
  },
  {
    q: "Which rooms have a kitchen?",
    a: "Three of the six rooms are self-catering with their own kitchen. The rooms page lets you filter for them.",
  },
  {
    q: "How do I get in touch during my stay?",
    a: `The hosts stay reachable on WhatsApp (${site.whatsapp}). ${site.caretaker.name} is on site ${site.caretaker.onSiteHours} and reachable by phone outside those hours.`,
  },
  {
    q: "What's your cancellation policy?",
    a: "Booking terms are being finalised alongside the online booking system. Message the house directly for now and the hosts will confirm.",
  },
] as const;

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
      <SectionMark eyebrow="FAQ & policies" variant="knot" />
      <h1 className="display-xl mt-5">Good to know</h1>
      <p className="lede mt-7">
        The honest answers, including the ones that might put you off. Better
        here than on arrival.
      </p>

      <div className="mt-14 border-t border-ink/10">
        {faqs.map((item) => (
          <details key={item.q} className="group border-b border-ink/10 py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
              <span className="display-md">{item.q}</span>
              <span
                className="mt-1.5 shrink-0 font-data text-lg text-butter transition-transform duration-300 group-open:rotate-45"
                aria-hidden
              >
                +
              </span>
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-16 rounded-[var(--radius-card)] border border-ink/12 bg-paper-raised p-10 text-center">
        <p className="display-md">Still unsure?</p>
        <p className="mt-2 text-sm text-ink-soft">
          Message the house — one of the hosts will reply, usually the same day.
        </p>
        <a
          href={`https://wa.me/${site.whatsapp.replace(/[^\d]/g, "")}`}
          className="mt-7 inline-block rounded-[var(--radius-kora)] bg-deodar px-7 py-3 font-display text-sm tracking-wide text-paper transition-opacity hover:opacity-90"
        >
          Message on WhatsApp
        </a>
      </div>
    </div>
  );
}

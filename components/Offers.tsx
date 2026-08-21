import { formatDate } from "@/lib/dates";
import { formatInr } from "@/lib/pricing";

export type PublicOffer = {
  code: string;
  kind: "percent" | "amount";
  value: number;
  description: string | null;
  minNights: number | null;
  endsOn: string | null;
};

export type PublicPackage = {
  name: string;
  description: string | null;
  inclusions: string[];
  minNights: number | null;
  couponCode: string | null;
};

/**
 * What's on offer, for guests.
 *
 * Only coupons a host has marked public appear here — RLS enforces that, so a
 * private code cannot leak into this list even by mistake. Renders nothing at
 * all when there is nothing on: an empty "Offers" heading advertises that you
 * usually have deals and today you don't, which is worse than silence.
 */
export function Offers({
  offers,
  packages,
}: {
  offers: PublicOffer[];
  packages: PublicPackage[];
}) {
  if (offers.length === 0 && packages.length === 0) return null;

  return (
    <section className="mt-12" aria-labelledby="offers-heading">
      <h2 id="offers-heading" className="display-md">
        On at the moment
      </h2>

      {packages.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {packages.map((p) => (
            <li
              key={p.name}
              className="rounded-[var(--radius-card)] border border-ink/15 bg-paper-raised p-5"
            >
              <h3 className="font-display text-lg">{p.name}</h3>
              {p.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.description}</p>
              )}
              {p.inclusions.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {p.inclusions.map((inc) => (
                    <li key={inc} className="flex gap-2 text-sm text-ink-soft">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-deodar" aria-hidden />
                      {inc}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-ink/45">
                {p.minNights ? `${p.minNights} nights or more` : "Any length of stay"}
                {p.couponCode && (
                  <>
                    {" · use code "}
                    <span className="font-data text-deodar-deep">{p.couponCode}</span>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}

      {offers.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-3">
          {offers.map((o) => (
            <li
              key={o.code}
              className="rounded-[var(--radius-card)] border border-deodar/30 bg-deodar/[0.06] px-4 py-3"
            >
              <p className="text-sm">
                <span className="font-data font-medium text-deodar-deep">{o.code}</span>
                <span className="text-ink-soft">
                  {" — "}
                  {o.kind === "percent" ? `${o.value}% off` : `${formatInr(o.value)} off`}
                </span>
              </p>
              {o.description && <p className="mt-0.5 text-sm text-ink-soft">{o.description}</p>}
              {(o.minNights || o.endsOn) && (
                <p className="mt-1 text-xs text-ink/45">
                  {o.minNights ? `${o.minNights} nights or more` : ""}
                  {o.minNights && o.endsOn ? " · " : ""}
                  {o.endsOn ? `until ${formatDate(o.endsOn)}` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-sm text-ink/45">
        Enter the code at the last step, once you&apos;ve chosen a room.
      </p>
    </section>
  );
}

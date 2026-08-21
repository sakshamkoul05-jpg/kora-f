"use client";

import { useState } from "react";
import { formatNight } from "@/lib/dates";
import { applyDiscount, formatInr, type PricingSettings, type Quote } from "@/lib/pricing";
import { CheckoutForm } from "./CheckoutForm";
import { CouponField, type AppliedCoupon } from "./CouponField";

/**
 * The price breakdown and the form, together.
 *
 * They share one piece of state — the applied coupon — and separating them
 * would mean lifting that into a context or recomputing the total in two
 * places. The quote arrives already computed from the server; nothing here
 * invents a price, it only re-applies a server-validated discount to a
 * server-computed quote so the guest can see the effect immediately.
 */
export function CheckoutPanel({
  quote: baseQuote,
  settings,
  roomSlug,
  roomName,
  from,
  to,
  adults,
  childCount,
  nights,
}: {
  quote: Quote;
  settings: PricingSettings;
  roomSlug: string;
  roomName: string;
  from: string;
  to: string;
  adults: number;
  childCount: number;
  nights: number;
}) {
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

  const quote = coupon ? applyDiscount(baseQuote, coupon.discountInr, settings) : baseQuote;
  const subtotalForCoupon = baseQuote.kind === "priced" ? baseQuote.subtotalInr : 0;

  return (
    <>
      <div className="mt-10 rounded-[var(--radius-card)] border border-ink/15 bg-paper-raised p-6 md:p-7">
        {quote.kind === "priced" ? (
          <>
            <dl className="space-y-3 text-sm">
              {quote.flatRate ? (
                <Line
                  label={`${formatInr(quote.nights[0].rateInr)} × ${nights} night${nights === 1 ? "" : "s"}`}
                  value={formatInr(quote.fullSubtotalInr ?? quote.subtotalInr)}
                />
              ) : (
                <>
                  {quote.nights.map((n) => (
                    <Line
                      key={n.date}
                      label={`${formatNight(n.date)}${n.label ? ` · ${n.label}` : ""}`}
                      value={formatInr(n.rateInr)}
                      muted
                    />
                  ))}
                  <Line
                    label="Subtotal"
                    value={formatInr(quote.fullSubtotalInr ?? quote.subtotalInr)}
                  />
                </>
              )}

              {quote.discountInr ? (
                <Line
                  label={`Discount · ${coupon?.code ?? ""}`}
                  value={`− ${formatInr(quote.discountInr)}`}
                  tone="text-deodar-deep"
                />
              ) : null}

              {quote.taxInr > 0 && <Line label="Taxes" value={formatInr(quote.taxInr)} />}

              <div className="border-t border-ink/12 pt-3">
                <Line label="Total" value={formatInr(quote.totalInr)} strong />
              </div>
            </dl>

            <CouponField
              checkIn={from}
              checkOut={to}
              roomSlug={roomSlug}
              subtotalInr={subtotalForCoupon}
              applied={coupon}
              onApply={setCoupon}
              onClear={() => setCoupon(null)}
            />

            <div className="mt-6 rounded-[var(--radius-kora)] border border-deodar/30 bg-deodar/[0.06] p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="font-medium text-ink">Deposit to hold the room</span>
                <span className="display-sm text-deodar-deep">{formatInr(quote.depositInr)}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-ink-soft">
                <span>Balance, paid when you arrive</span>
                <span>{formatInr(quote.balanceInr)}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                <strong className="font-medium text-ink">Nothing is charged now.</strong>{" "}
                Send this request, and if a host accepts you&apos;ll get a payment
                link for the deposit. The room is held for you from that moment
                until the link expires.
              </p>
            </div>
          </>
        ) : quote.kind === "on-request" ? (
          <>
            <p className="display-md text-ink/70">Price on request</p>
            <p className="mt-3 leading-relaxed text-ink-soft">
              We haven&apos;t published a rate for these dates yet. Send the
              request and a host will write back with a price — there&apos;s no
              obligation either way.
            </p>
          </>
        ) : (
          <p className="text-ink-soft">{quote.reason}</p>
        )}
      </div>

      <div className="mt-10 rounded-[var(--radius-card)] border border-ink/15 bg-paper-raised p-6 md:p-8">
        <CheckoutForm
          roomSlug={roomSlug}
          roomName={roomName}
          from={from}
          to={to}
          adults={adults}
          childCount={childCount}
          couponCode={coupon?.code ?? null}
        />
      </div>
    </>
  );
}

function Line({
  label,
  value,
  strong,
  muted,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={tone ?? (muted ? "text-ink/50" : "text-ink-soft")}>{label}</dt>
      <dd
        className={
          tone ?? (strong ? "text-lg font-medium text-ink" : muted ? "text-ink/50" : "text-ink")
        }
      >
        {value}
      </dd>
    </div>
  );
}

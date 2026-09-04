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
  // A preference, not a decision. The host still chooses whether to accept a
  // booking with nothing down — which for a six-room house they often will,
  // because they have already spoken to the guest.
  const [payLater, setPayLater] = useState(false);

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

            <fieldset className="mt-6">
              <legend className="eyebrow text-ink-soft">How you&apos;d like to pay</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <PayChoice
                  selected={!payLater}
                  onSelect={() => setPayLater(false)}
                  title={`${formatInr(quote.depositInr)} deposit`}
                  body={`Holds the room as soon as a host accepts. ${formatInr(quote.balanceInr)} on arrival.`}
                />
                <PayChoice
                  selected={payLater}
                  onSelect={() => setPayLater(true)}
                  title="Pay on arrival"
                  body={`Nothing online. ${formatInr(quote.totalInr)} when you get here — the hosts decide case by case.`}
                />
              </div>

              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                <strong className="font-medium text-ink">Nothing is charged now,</strong>{" "}
                {payLater
                  ? "either way. A host reads every request and will write back — if they're happy to hold the room without a deposit, they'll say so."
                  : "whichever you choose. Send this request, and if a host accepts you'll get a link to pay the deposit. The room is held from that moment."}
              </p>
            </fieldset>
          </>
        ) : quote.kind === "on-request" ? (
          <>
            <p className="display-md text-ink/70">Price on request</p>
            <p className="mt-3 leading-relaxed text-ink-soft">
              We haven&apos;t published a rate for these dates yet. Send the
              request and a host will write back with a price — there&apos;s no
              obligation either way.
            </p>

            <fieldset className="mt-6">
              <legend className="eyebrow text-ink-soft">How you&apos;d like to pay</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <PayChoice
                  selected={!payLater}
                  onSelect={() => setPayLater(false)}
                  title="A deposit to hold it"
                  body="A host will quote you and send a payment link."
                />
                <PayChoice
                  selected={payLater}
                  onSelect={() => setPayLater(true)}
                  title="Pay on arrival"
                  body="Nothing online — settle up when you get here."
                />
              </div>
            </fieldset>
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
          paymentPreference={payLater ? "on_arrival" : "deposit"}
        />
      </div>
    </>
  );
}

function PayChoice({
  selected,
  onSelect,
  title,
  body,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-[var(--radius-kora)] border p-4 text-left transition-colors ${
        selected
          ? "border-deodar-deep bg-deodar/[0.08]"
          : "border-ink/15 bg-paper hover:border-ink/35"
      }`}
    >
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 rounded-full border ${
            selected ? "border-deodar-deep bg-deodar-deep" : "border-ink/30"
          }`}
        />
        <span className="font-medium text-ink">{title}</span>
      </span>
      <span className="mt-1.5 block text-sm leading-relaxed text-ink-soft">{body}</span>
    </button>
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

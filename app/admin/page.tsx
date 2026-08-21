import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { quoteStay } from "@/lib/pricing";
import { loadPricingContext } from "@/lib/pricing-data";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { BookingRow, type BookingRequest } from "./BookingRow";
import { SignOut } from "./SignOut";

export const metadata: Metadata = {
  title: "Booking requests — Kora House",
  robots: { index: false, follow: false },
};

// Guest data must never be cached or statically rendered.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Host view.
 *
 * No animation anywhere in here — the build spec is explicit that the admin
 * stays still, and someone triaging a stranger's holiday at 11pm does not want
 * things moving.
 *
 * Three groups, in the order a host actually works: what needs a decision,
 * what is waiting on a guest to pay, and everything already settled.
 */
export default async function AdminPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24">
        <h1 className="display-lg">Not configured</h1>
        <p className="mt-4 text-ink-soft">
          Supabase isn&apos;t connected to this deployment yet, so there are no
          booking requests to show. See <code className="font-data">BACKEND.md</code>.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  if (!supabase) redirect("/admin/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Release lapsed holds before drawing the page, so a host is never looking at
  // a room that the public site has already put back on sale.
  await supabase.rpc("expire_stale_holds");

  const [{ data: requests, error }, { data: staffRow }, { data: roomRows }, pricing] =
    await Promise.all([
      supabase
        .from("booking_requests")
        .select(
          "id, reference, status, check_in, check_out, adults, children, guest_name, guest_email, guest_phone, guest_country, message, host_note, created_at, accepted_at, hold_expires_at, deposit_paid_at, total_inr, deposit_inr, room_id, rooms(name, room_number)"
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("staff").select("role").maybeSingle(),
      supabase.from("rooms").select("id, slug, name, room_number, base_rate_inr").order("sort_order"),
      loadPricingContext(),
    ]);

  const isStaff = Boolean(staffRow);
  const raw = (requests ?? []) as unknown as (BookingRequest & { room_id: string | null })[];

  // Payment links for anything currently awaiting a deposit.
  const acceptedIds = raw.filter((r) => r.status === "accepted").map((r) => r.id);
  const linkByBooking = new Map<string, string>();
  if (acceptedIds.length) {
    const { data: pays } = await supabase
      .from("payments")
      .select("booking_request_id, razorpay_order_id")
      .in("booking_request_id", acceptedIds);
    for (const p of pays ?? []) {
      if (p.razorpay_order_id) {
        // Razorpay's short_url is not stored; the id is enough to rebuild the
        // dashboard link, and the guest already has the real one.
        linkByBooking.set(p.booking_request_id, `https://rzp.io/i/${p.razorpay_order_id}`);
      }
    }
  }

  const rateByRoom = new Map((roomRows ?? []).map((r) => [r.id, r.base_rate_inr]));

  const rows: BookingRequest[] = raw.map((r) => {
    const quote =
      r.room_id !== null
        ? quoteStay({
            roomId: r.room_id,
            baseRateInr: rateByRoom.get(r.room_id) ?? null,
            checkIn: r.check_in,
            checkOut: r.check_out,
            overrides: pricing.overrides,
            settings: pricing.settings,
          })
        : null;
    return {
      ...r,
      suggestedTotalInr: quote?.kind === "priced" ? quote.totalInr : null,
      paymentUrl: linkByBooking.get(r.id) ?? null,
    };
  });

  const pending = rows.filter((r) => r.status === "pending");
  const awaiting = rows.filter((r) => r.status === "accepted");
  const settled = rows.filter(
    (r) => !["pending", "accepted"].includes(r.status)
  );

  const noRates = (roomRows ?? []).every((r) => r.base_rate_inr === null);

  return (
    <div className="mx-auto max-w-5xl px-5 py-16 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-maroon">Kora House</p>
          <h1 className="display-lg mt-2">Booking requests</h1>
          <p className="mt-2 font-data text-xs text-ink/45">Signed in as {user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/admin/calendar"
            className="rounded-[var(--radius-kora)] border border-ink/25 px-4 py-2.5 text-sm text-ink"
          >
            Calendar
          </Link>
          <Link
            href="/admin/settings"
            className="rounded-[var(--radius-kora)] border border-ink/25 px-4 py-2.5 text-sm text-ink"
          >
            Rates &amp; offers
          </Link>
          <Link href="/" className="text-sm text-ink-soft underline underline-offset-4">
            View site
          </Link>
          <SignOut />
        </div>
      </div>

      {!isStaff && (
        <div className="mt-8 rounded-[var(--radius-card)] border border-butter/50 bg-butter/[0.09] p-5 text-sm leading-relaxed text-ink-soft">
          This account is signed in but is not on the staff list, so it cannot
          see any requests. Add it once:
          <code className="mt-2 block overflow-x-auto whitespace-pre font-data text-xs">
            {`insert into public.staff (user_id, email, role)\nselect id, email, 'admin' from auth.users where email = '${user.email}';`}
          </code>
        </div>
      )}

      {isStaff && noRates && (
        <div className="mt-8 rounded-[var(--radius-card)] border border-butter/50 bg-butter/[0.09] p-5 text-sm leading-relaxed text-ink-soft">
          <strong className="font-medium text-ink">No rates are set.</strong> The
          site shows &ldquo;price on request&rdquo; for every room and you have to
          type a figure each time you accept. Set them under Rates &amp; offers and
          prices appear straight away.
        </div>
      )}

      {isStaff && !isRazorpayConfigured && (
        <div className="mt-4 rounded-[var(--radius-card)] border border-ink/15 bg-paper p-5 text-sm leading-relaxed text-ink-soft">
          Razorpay isn&apos;t connected, so accepting still holds the room but no
          payment link is generated. Add the keys and links start appearing
          automatically — nothing else changes.
        </div>
      )}

      {error && (
        <p className="mt-8 text-sm text-maroon">Couldn&apos;t load requests: {error.message}</p>
      )}

      <Section title="Needs a reply" count={pending.length} rows={pending} empty="Nothing waiting." />
      <Section
        title="Awaiting deposit"
        count={awaiting.length}
        rows={awaiting}
        empty="No rooms are being held."
      />
      <Section title="Settled" count={settled.length} rows={settled} empty={null} />

    </div>
  );
}

function Section({
  title,
  count,
  rows,
  empty,
}: {
  title: string;
  count: number;
  rows: BookingRequest[];
  empty: string | null;
}) {
  if (count === 0 && empty === null) return null;
  return (
    <section className="mt-14">
      <h2 className="display-md">
        {title} <span className="font-data text-base text-ink/40">({count})</span>
      </h2>
      {count === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">{empty}</p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((r) => (
            <BookingRow key={r.id} request={r} />
          ))}
        </div>
      )}
    </section>
  );
}

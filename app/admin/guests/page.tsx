import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/dates";
import { formatInr } from "@/lib/pricing";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { GuestList } from "./GuestList";

export const metadata: Metadata = {
  title: "Guests — Kora House",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Everyone who has ever stayed or asked.
 *
 * Derived from the bookings rather than kept as a second table of people. A
 * guests table would be a duplicate of the same humans, and it would drift the
 * first time somebody corrected a spelling on a booking. Email is the key,
 * because it is the one field always present and always the same person.
 */
export default async function GuestsPage() {
  if (!isSupabaseConfigured) redirect("/admin");

  const supabase = await createClient();
  if (!supabase) redirect("/admin/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data, error } = await supabase.rpc("guest_directory");

  type Row = {
    guest_email: string;
    guest_name: string;
    guest_phone: string | null;
    guest_country: string | null;
    stays: number;
    requests: number;
    nights: number;
    spend_inr: number;
    first_seen: string;
    last_checkout: string | null;
  };

  const guests = ((data ?? []) as Row[]).map((g) => ({
    email: g.guest_email,
    name: g.guest_name,
    phone: g.guest_phone,
    country: g.guest_country,
    stays: g.stays,
    requests: g.requests,
    nights: g.nights,
    spendInr: g.spend_inr,
    firstSeen: g.first_seen,
    lastCheckout: g.last_checkout,
  }));

  const returning = guests.filter((g) => g.stays > 1).length;
  const totalNights = guests.reduce((sum, g) => sum + g.nights, 0);
  const totalSpend = guests.reduce((sum, g) => sum + g.spendInr, 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 md:px-8 md:py-16">
      <Link href="/admin" className="text-sm text-ink-soft underline underline-offset-4">
        ← Requests
      </Link>
      <h1 className="display-lg mt-3">Guests</h1>

      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
        <Stat label="People" value={String(guests.length)} />
        <Stat label="Returning" value={String(returning)} hint="stayed more than once" />
        <Stat label="Nights sold" value={String(totalNights)} />
        <Stat label="Taken" value={formatInr(totalSpend)} hint="confirmed bookings only" />
      </div>

      {error && (
        <p className="mt-8 text-sm text-maroon">Couldn&apos;t load guests: {error.message}</p>
      )}

      {guests.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft">
          Nobody yet. Guests appear here as soon as the first request comes in.
        </p>
      ) : (
        <GuestList guests={guests} />
      )}

      <p className="mt-8 text-xs leading-relaxed text-ink/45">
        Built from the bookings themselves, so it is never out of step with
        them. Spend and nights count confirmed stays only —
        enquiries and cancellations are shown but not totalled.
        {guests.length > 0 &&
          ` Longest-standing guest since ${formatDate(
            [...guests].sort((a, b) => a.firstSeen.localeCompare(b.firstSeen))[0].firstSeen.slice(0, 10)
          )}.`}
      </p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="font-data text-[11px] uppercase tracking-wide text-ink/45">{label}</p>
      <p className="display-md mt-1">{value}</p>
      {hint && <p className="text-xs text-ink/40">{hint}</p>}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
 * Host view of incoming booking requests.
 *
 * No animation anywhere in here — the build spec is explicit that the admin
 * stays still, and someone triaging a stranger's holiday at 11pm does not want
 * things moving.
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // RLS decides what comes back. A signed-in account that isn't in `staff`
  // gets an empty list rather than an error, which is the correct behaviour —
  // it reveals nothing about whether any data exists.
  const { data: requests, error } = await supabase
    .from("booking_requests")
    .select(
      "id, reference, status, check_in, check_out, adults, children, guest_name, guest_email, guest_phone, guest_country, message, host_note, created_at, rooms(name, room_number)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: staffRow } = await supabase.from("staff").select("role").maybeSingle();
  const isStaff = Boolean(staffRow);

  const rows = (requests ?? []) as unknown as BookingRequest[];
  const pending = rows.filter((r) => r.status === "pending");
  const decided = rows.filter((r) => r.status !== "pending");

  return (
    <div className="mx-auto max-w-5xl px-5 py-16 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-maroon">Kora House</p>
          <h1 className="display-lg mt-2">Booking requests</h1>
          <p className="mt-2 font-data text-xs text-ink/45">Signed in as {user.email}</p>
        </div>
        <div className="flex items-center gap-4">
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

      {error && (
        <p className="mt-8 text-sm text-maroon">Couldn&apos;t load requests: {error.message}</p>
      )}

      <section className="mt-12">
        <h2 className="display-md">
          Needs a reply{" "}
          <span className="font-data text-base text-ink/40">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">Nothing waiting.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {pending.map((r) => (
              <BookingRow key={r.id} request={r} />
            ))}
          </div>
        )}
      </section>

      {decided.length > 0 && (
        <section className="mt-16">
          <h2 className="display-md">
            Decided <span className="font-data text-base text-ink/40">({decided.length})</span>
          </h2>
          <div className="mt-6 space-y-4">
            {decided.map((r) => (
              <BookingRow key={r.id} request={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

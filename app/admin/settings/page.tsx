import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { loadPricingContext } from "@/lib/pricing-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { HouseSettings } from "../HouseSettings";
import { CouponsPanel } from "./CouponsPanel";
import { BlocksPanel, ContentPanel, FaqPanel, RoomsPanel } from "./OperationsPanels";
import { PackagesPanel } from "./PackagesPanel";
import { SeasonsPanel } from "./SeasonsPanel";
import { StaffPanel } from "./StaffPanel";

export const metadata: Metadata = {
  title: "Manage — Kora House",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Everything a host sets up, in one place: rates, seasons, discount codes,
 * packages, and who else can get in.
 *
 * Kept off /admin because that page is for triage — the thing you open twenty
 * times a day — and this is the thing you open once a season.
 */
export default async function SettingsPage() {
  if (!isSupabaseConfigured) redirect("/admin");

  const supabase = await createClient();
  if (!supabase) redirect("/admin/login");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const [
    { data: rooms },
    { data: seasons },
    { data: coupons },
    { data: packages },
    { data: staff },
    { data: blocks },
    { data: content },
    { data: faqs },
    pricing,
  ] =
    await Promise.all([
      supabase
        .from("rooms")
        .select("id, name, room_number, base_rate_inr, max_occupancy, has_kitchenette, is_active")
        .order("sort_order"),
      supabase
        .from("rate_overrides")
        .select("id, room_id, starts_on, ends_on, nightly_rate_inr, min_nights, label, priority")
        .order("starts_on"),
      supabase
        .from("coupons")
        .select(
          "id, code, kind, value, description, is_public, is_active, starts_on, ends_on, min_nights, max_redemptions, redeemed_count, room_id"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("packages")
        .select("id, slug, name, description, inclusions, min_nights, coupon_code, is_active")
        .order("sort_order"),
      supabase.rpc("list_staff"),
      supabase
        .from("blocked_dates")
        .select("id, room_id, starts_on, ends_on, reason")
        .order("starts_on"),
      supabase.from("site_content").select("key, label, hint, kind, value").order("sort_order"),
      supabase.from("faqs").select("id, question, answer, is_active").order("sort_order"),
      loadPricingContext(),
    ]);

  const roomList = (rooms ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    number: r.room_number,
    rateInr: r.base_rate_inr,
  }));

  const isAdmin = ((staff ?? []) as { user_id: string; role: string }[]).some(
    (s) => s.user_id === user.id && s.role === "admin"
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 md:px-8 md:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-ink-soft underline underline-offset-4">
            ← Requests
          </Link>
          <h1 className="display-lg mt-3">Manage the house</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Rates, closed dates, rooms, offers, wording and who can get in.
          </p>
        </div>
        <Link
          href="/admin/calendar"
          className="rounded-[var(--radius-kora)] border border-ink/25 px-4 py-2.5 text-sm"
        >
          Calendar
        </Link>
      </div>

      <HouseSettings
        rooms={roomList}
        settings={{
          depositPercent: pricing.settings.depositPercent,
          holdHours: pricing.holdHours,
          taxPercent: pricing.settings.taxPercent,
          minNights: pricing.settings.minNights,
        }}
        startOpen
      />

      <BlocksPanel
        rooms={roomList}
        blocks={(blocks ?? []).map((b) => ({
          id: b.id,
          roomId: b.room_id,
          startsOn: b.starts_on,
          endsOn: b.ends_on,
          reason: b.reason,
        }))}
      />

      <RoomsPanel
        rooms={(rooms ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          number: r.room_number,
          maxOccupancy: r.max_occupancy,
          hasKitchenette: r.has_kitchenette,
          isActive: r.is_active,
        }))}
      />

      <SeasonsPanel
        rooms={roomList}
        seasons={(seasons ?? []).map((s) => ({
          id: s.id,
          roomId: s.room_id,
          startsOn: s.starts_on,
          endsOn: s.ends_on,
          nightlyRateInr: s.nightly_rate_inr,
          minNights: s.min_nights,
          label: s.label,
          priority: s.priority,
        }))}
      />

      <CouponsPanel
        rooms={roomList}
        coupons={(coupons ?? []).map((c) => ({
          id: c.id,
          code: c.code,
          kind: c.kind as "percent" | "amount",
          value: Number(c.value),
          description: c.description,
          isPublic: c.is_public,
          isActive: c.is_active,
          startsOn: c.starts_on,
          endsOn: c.ends_on,
          minNights: c.min_nights,
          maxRedemptions: c.max_redemptions,
          redeemedCount: c.redeemed_count,
          roomId: c.room_id,
        }))}
      />

      <PackagesPanel
        packages={(packages ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          inclusions: p.inclusions ?? [],
          minNights: p.min_nights,
          couponCode: p.coupon_code,
          isActive: p.is_active,
        }))}
        couponCodes={(coupons ?? []).map((c) => c.code)}
      />

      <ContentPanel
        entries={(content ?? []).map((c) => ({
          key: c.key,
          label: c.label,
          hint: c.hint,
          kind: c.kind,
          value: c.value,
        }))}
      />

      <FaqPanel
        faqs={(faqs ?? []).map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          isActive: f.is_active,
        }))}
      />

      <StaffPanel
        staff={((staff ?? []) as { user_id: string; email: string; role: string }[]).map((s) => ({
          userId: s.user_id,
          email: s.email,
          role: s.role,
        }))}
        currentUserId={user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}

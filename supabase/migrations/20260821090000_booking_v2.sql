-- Booking v2 — priced requests, host approval, then payment.
--
-- The shape, which is Airbnb's "Request to Book" rather than instant booking:
--
--   pending  -> guest asked. Holds nothing. Several people may ask for the
--               same dates; that is fine and deliberate.
--   accepted -> a host said yes and quoted a price. THIS HOLDS THE ROOM, on a
--               clock. The guest has settings.hold_hours to pay the deposit.
--   confirmed-> deposit received. The stay is real.
--   expired  -> accepted, but nobody paid in time. Room released automatically.
--   declined -> host said no. Nothing was ever charged, so nothing to refund.
--   cancelled-> called off after confirmation. Refund is a human decision.
--
-- Money never moves before a host has said yes. That is the whole point of the
-- design: declining someone costs nothing and needs no refund, which is what
-- makes it safe to actually vet guests rather than vet them theoretically.
--
-- All amounts are integer RUPEES. Not floats — money must never be a float.
-- Not paise either, despite Razorpay wanting paise: rupee amounts are what the
-- hosts quote and what guests read, and the ×100 happens at the Razorpay
-- boundary only (see lib/razorpay.ts). One unit, one place it changes.

-- --------------------------------------------------------------- settings ----

-- Single-row table. A key/value store would be more flexible and much worse:
-- these are typed, constrained values that the pricing engine depends on.
create table if not exists public.settings (
  id                  boolean primary key default true check (id),
  deposit_percent     int not null default 25 check (deposit_percent between 0 and 100),
  hold_hours          int not null default 24 check (hold_hours between 1 and 168),
  tax_percent         numeric(5,2) not null default 0 check (tax_percent >= 0 and tax_percent <= 50),
  currency            text not null default 'INR',
  min_nights          int not null default 1 check (min_nights between 1 and 30),
  cancellation_policy text,
  updated_at          timestamptz not null default now()
);

insert into public.settings (id) values (true) on conflict (id) do nothing;

comment on column public.settings.deposit_percent is
  'Percentage of the total taken online to hold the room. Balance is paid on arrival.';
comment on column public.settings.hold_hours is
  'How long an accepted request holds the room while awaiting the deposit.';

-- --------------------------------------------------------- rate overrides ----

-- Seasonal pricing. McLeodganj has a real high season, and a flat annual rate
-- would be wrong most of the year. Null room_id means "every room".
create table if not exists public.rate_overrides (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid references public.rooms(id) on delete cascade,
  starts_on       date not null,
  ends_on         date not null,
  nightly_rate_inr int not null check (nightly_rate_inr > 0),
  min_nights      int check (min_nights between 1 and 30),
  label           text,
  -- Higher wins when ranges overlap, so a specific event can sit on top of a
  -- broad season without having to carve the season up.
  priority        int not null default 0,
  created_at      timestamptz not null default now(),
  constraint override_ends_after_start check (ends_on > starts_on)
);

create index if not exists rate_overrides_lookup_idx
  on public.rate_overrides (starts_on, ends_on);

-- ------------------------------------------------- booking status rewrite ----

-- The exclusion constraint and the availability functions both reference the
-- enum, so they are dropped and rebuilt around the new type. Swapping the type
-- wholesale rather than using ALTER TYPE ... ADD VALUE is deliberate: a value
-- added by ALTER TYPE cannot be USED in the same transaction, which would make
-- this migration unrunnable as a single paste.
alter table public.booking_requests
  drop constraint if exists no_overlapping_confirmed_stays;

alter table public.booking_requests alter column status drop default;

do $$
begin
  if not exists (
    select 1 from pg_type t join pg_enum e on e.enumtypid = t.oid
     where t.typname = 'booking_status' and e.enumlabel = 'accepted'
  ) then
    create type public.booking_status_v2 as enum
      ('pending', 'accepted', 'confirmed', 'declined', 'cancelled', 'expired');

    alter table public.booking_requests
      alter column status type public.booking_status_v2
      using status::text::public.booking_status_v2;

    drop type public.booking_status;
    alter type public.booking_status_v2 rename to booking_status;
  end if;
end;
$$;

alter table public.booking_requests alter column status set default 'pending';

-- ------------------------------------------------------------ money on it ----

alter table public.booking_requests
  add column if not exists accepted_at      timestamptz,
  add column if not exists hold_expires_at  timestamptz,
  add column if not exists decided_by       uuid references auth.users(id) on delete set null,
  add column if not exists currency         text not null default 'INR',
  -- Snapshot of what each night cost when the quote was made. Kept so that
  -- changing a rate later never silently rewrites an existing quote.
  add column if not exists nightly_rates    jsonb,
  add column if not exists subtotal_inr     int check (subtotal_inr >= 0),
  add column if not exists tax_inr          int check (tax_inr >= 0),
  add column if not exists total_inr        int check (total_inr >= 0),
  add column if not exists deposit_inr      int check (deposit_inr >= 0),
  add column if not exists deposit_paid_at  timestamptz;

comment on column public.booking_requests.nightly_rates is
  'Per-night rate snapshot at quote time: [{"date":"2027-04-01","rate_inr":2500}]. Never recomputed.';

-- An accepted request holds the room just as firmly as a confirmed one — that
-- is what the guest is being asked to pay against. Leaving 'accepted' out of
-- this constraint would let two guests be quoted the same room at once, and
-- one of them would have paid for a room that was already gone.
alter table public.booking_requests
  add constraint no_overlapping_held_stays
  exclude using gist (
    room_id with =,
    stay    with &&
  ) where (status in ('accepted', 'confirmed') and room_id is not null);

-- --------------------------------------------------------------- payments ----

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum
      ('created', 'authorized', 'captured', 'failed', 'refunded');
  end if;
end;
$$;

create table if not exists public.payments (
  id                 uuid primary key default gen_random_uuid(),
  booking_request_id uuid not null references public.booking_requests(id) on delete cascade,
  razorpay_order_id   text unique,
  razorpay_payment_id text unique,
  amount_inr         int not null check (amount_inr > 0),
  status             public.payment_status not null default 'created',
  method             text,
  error_code         text,
  error_description  text,
  -- Whole verified webhook body, so a disputed payment can be reconstructed
  -- from what Razorpay actually sent rather than from what we inferred.
  raw                jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists payments_booking_idx on public.payments (booking_request_id);

drop trigger if exists payments_touch_updated_at on public.payments;
create trigger payments_touch_updated_at
  before update on public.payments
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------- guests cannot self-quote ----

-- Replaces the v1 trigger. Every field below is a host decision or a payment
-- fact; a crafted insert must not be able to set any of them. Without this a
-- guest could submit a request that is already accepted, already paid, and
-- priced at one rupee.
create or replace function public.force_pending_on_insert()
returns trigger
language plpgsql
as $$
begin
  new.status          := 'pending';
  new.host_note       := null;
  new.quoted_total_inr := null;
  new.accepted_at     := null;
  new.hold_expires_at := null;
  new.decided_by      := null;
  new.nightly_rates   := null;
  new.subtotal_inr    := null;
  new.tax_inr         := null;
  new.total_inr       := null;
  new.deposit_inr     := null;
  new.deposit_paid_at := null;
  return new;
end;
$$;

-- ------------------------------------------------------------ hold expiry ----

-- An accepted request that nobody paid for must not hold the room forever.
-- Called opportunistically whenever availability is read, so the calendar is
-- always honest even without a scheduler; also safe to run from pg_cron.
create or replace function public.expire_stale_holds()
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n int;
begin
  update public.booking_requests
     set status = 'expired'
   where status = 'accepted'
     and hold_expires_at is not null
     and hold_expires_at < now()
     and deposit_paid_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.expire_stale_holds() from public;
grant execute on function public.expire_stale_holds() to anon, authenticated;

-- ---------------------------------------------------------- availability ----

-- Rewritten so that an accepted-but-unpaid hold also blocks the room, and so
-- that stale holds are cleared before the answer is computed.
create or replace function public.is_room_taken(p_room_id uuid, p_from date, p_to date)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.booking_requests b
    where b.room_id = p_room_id
      and b.status in ('accepted', 'confirmed')
      -- An expired hold that expire_stale_holds() has not swept yet must not
      -- block the room; this function is STABLE and cannot write.
      and not (b.status = 'accepted'
               and b.hold_expires_at is not null
               and b.hold_expires_at < now()
               and b.deposit_paid_at is null)
      and b.stay && daterange(p_from, p_to, '[)')
  ) or exists (
    select 1 from public.blocked_dates d
    where (d.room_id = p_room_id or d.room_id is null)
      and daterange(d.starts_on, d.ends_on, '[)') && daterange(p_from, p_to, '[)')
  );
$$;

revoke all on function public.is_room_taken(uuid, date, date) from public;
grant execute on function public.is_room_taken(uuid, date, date) to anon, authenticated;

-- Availability now carries the standing rate and occupancy, so the results
-- page can price a stay in one round trip instead of one per room. Dropped
-- and recreated rather than replaced: the return type is changing, and
-- CREATE OR REPLACE cannot change a function's output columns.
drop function if exists public.room_availability(date, date);

create function public.room_availability(
  from_date date,
  to_date   date
)
returns table (
  room_id         uuid,
  slug            text,
  name            text,
  room_number     int,
  has_kitchenette boolean,
  base_rate_inr   int,
  max_occupancy   int,
  is_available    boolean
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    rm.id,
    rm.slug,
    rm.name,
    rm.room_number,
    rm.has_kitchenette,
    rm.base_rate_inr,
    rm.max_occupancy,
    not public.is_room_taken(rm.id, from_date, to_date) as is_available
  from public.rooms rm
  where rm.is_active
  order by rm.sort_order, rm.room_number;
$$;

grant execute on function public.room_availability(date, date) to anon, authenticated;

-- ------------------------------------------------------------------ RLS ----

alter table public.settings       enable row level security;
alter table public.rate_overrides enable row level security;
alter table public.payments       enable row level security;

-- Prices and the deposit percentage are not secrets — the site has to show
-- them before anyone books.
drop policy if exists "settings are publicly readable" on public.settings;
create policy "settings are publicly readable"
  on public.settings for select to anon, authenticated using (true);

drop policy if exists "staff manage settings" on public.settings;
create policy "staff manage settings"
  on public.settings for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "rates are publicly readable" on public.rate_overrides;
create policy "rates are publicly readable"
  on public.rate_overrides for select to anon, authenticated using (true);

drop policy if exists "staff manage rates" on public.rate_overrides;
create policy "staff manage rates"
  on public.rate_overrides for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Payments are staff-only. A guest checks payment state through their
-- reference via a definer function, never by reading this table.
drop policy if exists "staff read payments" on public.payments;
create policy "staff read payments"
  on public.payments for select to authenticated using (public.is_staff());

drop policy if exists "staff manage payments" on public.payments;
create policy "staff manage payments"
  on public.payments for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

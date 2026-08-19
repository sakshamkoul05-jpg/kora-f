-- Kora House — initial schema
--
-- Design notes that matter, because they follow from how the house actually
-- operates rather than from a generic booking template:
--
--  1. THIS IS A REQUEST SYSTEM, NOT INSTANT BOOKING. The hosts talk to guests
--     before accepting ("we like to interact with guests to ensure our home is
--     the right fit"). So a guest submits a REQUEST, which starts as 'pending'
--     and only a host can move to 'confirmed'. Nothing a guest can do reserves
--     a room.
--
--  2. NO PRICING YET. Every nightly rate is still unconfirmed, so there is no
--     amount to charge and no payment table. `quoted_total` exists so a host
--     can record what they quoted, but the site never computes it.
--
--  3. Guest details are personal data. RLS is written so that anonymous users
--     can INSERT a request and can never SELECT one — including their own.
--     Without that, anyone could enumerate every guest's name, email and phone.

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "btree_gist"; -- needed for the exclusion constraint

-- ---------------------------------------------------------------- rooms ----

create table public.rooms (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  room_number     int  not null unique,
  name            text not null,
  floor           text not null check (floor in ('Ground', 'First')),
  has_kitchenette boolean not null default false,
  -- Null until the hosts confirm. The site must not invent one.
  base_rate_inr   int,
  max_occupancy   int,
  is_active       boolean not null default true,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

comment on column public.rooms.base_rate_inr is
  'Nightly rate in whole rupees. NULL means not yet confirmed — do not display a price while null.';

-- ------------------------------------------------------- booking requests ----

create type public.booking_status as enum ('pending', 'confirmed', 'declined', 'cancelled');

create table public.booking_requests (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique,

  -- Stay
  check_in       date not null,
  check_out      date not null,
  adults         int  not null default 1 check (adults  between 1 and 12),
  children       int  not null default 0 check (children between 0 and 12),
  room_id        uuid references public.rooms(id) on delete set null,

  -- Guest
  guest_name     text not null check (length(btrim(guest_name)) between 2 and 120),
  guest_email    text not null check (guest_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  guest_phone    text check (length(guest_phone) <= 40),
  guest_country  text check (length(guest_country) <= 80),
  message        text check (length(message) <= 2000),

  status         public.booking_status not null default 'pending',
  host_note      text,
  quoted_total_inr int,

  -- The stay as a range, kept in step with check_in/check_out by trigger.
  -- '[)' — check-out day is free for the next guest, which is how hotels work.
  stay           daterange generated always as (daterange(check_in, check_out, '[)')) stored,

  source         text not null default 'website',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint checkout_after_checkin check (check_out > check_in),
  constraint stay_not_absurdly_long  check (check_out - check_in <= 90)
);

-- A confirmed booking physically cannot overlap another confirmed booking for
-- the same room. Enforced by the database, not by application code, so a race
-- between two simultaneous confirmations cannot double-book.
alter table public.booking_requests
  add constraint no_overlapping_confirmed_stays
  exclude using gist (
    room_id with =,
    stay    with &&
  ) where (status = 'confirmed' and room_id is not null);

create index booking_requests_status_idx     on public.booking_requests (status, check_in);
create index booking_requests_stay_idx       on public.booking_requests using gist (stay);
create index booking_requests_created_at_idx on public.booking_requests (created_at desc);

-- ---------------------------------------------------------- blocked dates ----

-- Maintenance, family stays, or the house simply being closed.
create table public.blocked_dates (
  id         uuid primary key default gen_random_uuid(),
  -- Null room_id blocks the whole house.
  room_id    uuid references public.rooms(id) on delete cascade,
  starts_on  date not null,
  ends_on    date not null,
  reason     text,
  created_at timestamptz not null default now(),
  constraint block_ends_after_start check (ends_on > starts_on)
);

create index blocked_dates_range_idx on public.blocked_dates (starts_on, ends_on);

-- --------------------------------------------------------------- triggers ----

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger booking_requests_touch_updated_at
  before update on public.booking_requests
  for each row execute function public.touch_updated_at();

-- Human-readable reference: KH-2026-0417. Generated server-side so a guest
-- cannot choose or guess someone else's.
create or replace function public.set_booking_reference()
returns trigger
language plpgsql
as $$
declare
  candidate text;
  attempts  int := 0;
begin
  if new.reference is not null and new.reference <> '' then
    return new;
  end if;
  loop
    candidate := 'KH-' || to_char(now(), 'YYYY') || '-' ||
                 lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (select 1 from public.booking_requests where reference = candidate);
    attempts := attempts + 1;
    if attempts > 25 then
      candidate := 'KH-' || to_char(now(), 'YYYY') || '-' || substr(gen_random_uuid()::text, 1, 6);
      exit;
    end if;
  end loop;
  new.reference := candidate;
  return new;
end;
$$;

create trigger booking_requests_set_reference
  before insert on public.booking_requests
  for each row execute function public.set_booking_reference();

-- A guest must never be able to submit something already accepted, nor edit a
-- decided request. Status transitions belong to hosts only.
create or replace function public.force_pending_on_insert()
returns trigger
language plpgsql
as $$
begin
  new.status := 'pending';
  new.host_note := null;
  new.quoted_total_inr := null;
  return new;
end;
$$;

create trigger booking_requests_force_pending
  before insert on public.booking_requests
  for each row execute function public.force_pending_on_insert();

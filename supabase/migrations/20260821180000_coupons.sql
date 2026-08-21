-- Coupons and packages.
--
-- The rule that shapes all of this: a discount shown in the browser is a
-- SUGGESTION. The authoritative figure is computed server-side when a host
-- accepts, from the coupon row as it stands at that moment. Anything else and
-- a guest edits a number in devtools and pays what they like.
--
-- So the guest-facing validate function returns what a code is worth and
-- reserves nothing; the redemption counter only moves when a booking is
-- actually confirmed.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'discount_kind') then
    create type public.discount_kind as enum ('percent', 'amount');
  end if;
end;
$$;

create table if not exists public.coupons (
  id              uuid primary key default gen_random_uuid(),
  -- Stored and compared uppercase, so MONSOON and monsoon are one coupon and
  -- a host cannot accidentally create both.
  code            text not null unique check (code = upper(code) and length(code) between 3 and 24),
  kind            public.discount_kind not null,
  -- Percent 1-100, or a flat rupee amount. Checked per kind below.
  value           numeric(10,2) not null check (value > 0),
  description     text,

  -- Shown on the site under "Offers". A private code still works if typed —
  -- this only controls whether it is advertised.
  is_public       boolean not null default false,
  is_active       boolean not null default true,

  -- Limits. All optional; null means no limit of that sort.
  starts_on       date,
  ends_on         date,
  min_nights      int check (min_nights between 1 and 90),
  min_total_inr   int check (min_total_inr >= 0),
  max_redemptions int check (max_redemptions > 0),
  redeemed_count  int not null default 0 check (redeemed_count >= 0),
  room_id         uuid references public.rooms(id) on delete cascade,

  created_at      timestamptz not null default now(),

  constraint percent_within_range check (kind <> 'percent' or value <= 100),
  constraint coupon_dates_sane   check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index if not exists coupons_code_idx on public.coupons (code);

-- ---------------------------------------------------------------- packages ---

-- A package is a named offer a guest reads, not a pricing mechanism. It can
-- carry a coupon code, and that coupon does the arithmetic.
create table if not exists public.packages (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  inclusions  text[] not null default '{}',
  min_nights  int check (min_nights between 1 and 90),
  coupon_code text references public.coupons(code) on delete set null,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------- coupon on the booking ---

alter table public.booking_requests
  add column if not exists coupon_code   text,
  add column if not exists discount_inr  int check (discount_inr >= 0);

-- A guest may name a code; they may not decide what it is worth.
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
  -- The code survives; the money it is worth is recomputed on accept.
  new.discount_inr    := null;
  new.coupon_code     := nullif(upper(btrim(coalesce(new.coupon_code, ''))), '');
  return new;
end;
$$;

-- ------------------------------------------------------------- validation ---

-- What a code is worth for a given stay, or why it does not apply.
-- SECURITY DEFINER so anon can check a code without being able to read the
-- coupons table and enumerate every unpublished one.
create or replace function public.validate_coupon(
  p_code      text,
  p_check_in  date,
  p_check_out date,
  p_subtotal_inr int,
  p_room_slug text default null
)
returns table (
  valid        boolean,
  reason       text,
  code         text,
  description  text,
  discount_inr int
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  c       public.coupons%rowtype;
  v_code  text := upper(btrim(coalesce(p_code, '')));
  v_nights int := p_check_out - p_check_in;
  v_room  uuid;
  v_disc  int;
begin
  if v_code = '' then
    return query select false, 'No code given', null::text, null::text, 0; return;
  end if;

  select * into c from public.coupons where coupons.code = v_code;

  -- One message for "no such code" and "switched off", so this cannot be used
  -- to discover which codes exist.
  if c.id is null or not c.is_active then
    return query select false, 'That code is not valid', null::text, null::text, 0; return;
  end if;
  if c.starts_on is not null and p_check_in < c.starts_on then
    return query select false, 'That code does not apply to these dates', null::text, null::text, 0; return;
  end if;
  if c.ends_on is not null and p_check_in > c.ends_on then
    return query select false, 'That code has expired', null::text, null::text, 0; return;
  end if;
  if c.min_nights is not null and v_nights < c.min_nights then
    return query select false, format('That code needs a stay of %s nights or more', c.min_nights),
      null::text, null::text, 0; return;
  end if;
  if c.min_total_inr is not null and p_subtotal_inr < c.min_total_inr then
    return query select false, 'That code does not apply to this stay', null::text, null::text, 0; return;
  end if;
  if c.max_redemptions is not null and c.redeemed_count >= c.max_redemptions then
    return query select false, 'That code has been fully used', null::text, null::text, 0; return;
  end if;

  if c.room_id is not null then
    select id into v_room from public.rooms where slug = p_room_slug;
    if v_room is null or v_room <> c.room_id then
      return query select false, 'That code applies to a different room', null::text, null::text, 0; return;
    end if;
  end if;

  v_disc := case
    when c.kind = 'percent' then round(p_subtotal_inr * c.value / 100.0)
    else least(round(c.value), p_subtotal_inr)
  end;

  -- Never let a discount exceed the stay, or produce a negative total.
  v_disc := greatest(0, least(v_disc, p_subtotal_inr));

  return query select true, null::text, c.code, c.description, v_disc;
end;
$$;

revoke all on function public.validate_coupon(text, date, date, int, text) from public;
grant execute on function public.validate_coupon(text, date, date, int, text) to anon, authenticated;

-- Counted when a stay is actually confirmed, never when a code is typed.
create or replace function public.redeem_coupon(p_code text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.coupons
     set redeemed_count = redeemed_count + 1
   where code = upper(btrim(p_code));
$$;

revoke all on function public.redeem_coupon(text) from public;
grant execute on function public.redeem_coupon(text) to authenticated;

-- ------------------------------------------------------------------- RLS ----

alter table public.coupons  enable row level security;
alter table public.packages enable row level security;

-- Only PUBLIC coupons are readable, and only the fields needed to advertise
-- them. A private code still works when typed — it is simply not listed.
drop policy if exists "public offers are readable" on public.coupons;
create policy "public offers are readable"
  on public.coupons for select to anon, authenticated
  using (is_public and is_active);

drop policy if exists "staff manage coupons" on public.coupons;
create policy "staff manage coupons"
  on public.coupons for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "active packages are readable" on public.packages;
create policy "active packages are readable"
  on public.packages for select to anon, authenticated
  using (is_active);

drop policy if exists "staff manage packages" on public.packages;
create policy "staff manage packages"
  on public.packages for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ------------------------------------------- submitting with a coupon code ---

-- The submit function gains a coupon parameter. Dropped and recreated rather
-- than given a defaulted extra argument: two overloads differing only by a
-- default make PostgREST's function resolution ambiguous, and it starts
-- answering 300 Multiple Choices instead of taking the booking.
drop function if exists public.submit_booking_request(
  date, date, int, int, text, text, text, text, text, text);

create or replace function public.submit_booking_request(
  p_check_in      date,
  p_check_out     date,
  p_adults        int,
  p_children      int,
  p_guest_name    text,
  p_guest_email   text,
  p_guest_phone   text default null,
  p_guest_country text default null,
  p_message       text default null,
  p_room_slug     text default null,
  p_coupon_code   text default null
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_room_id   uuid;
  v_reference text;
begin
  if p_check_out <= p_check_in then
    raise exception 'check_out must be after check_in' using errcode = '22023';
  end if;
  if p_check_out - p_check_in > 90 then
    raise exception 'stay too long' using errcode = '22023';
  end if;
  if p_check_in < current_date then
    raise exception 'check_in is in the past' using errcode = '22023';
  end if;
  if p_check_in > current_date + interval '2 years' then
    raise exception 'check_in too far ahead' using errcode = '22023';
  end if;

  if p_room_slug is not null and btrim(p_room_slug) <> '' then
    select id into v_room_id
      from public.rooms
     where slug = p_room_slug and is_active
     limit 1;
  end if;

  -- The code is recorded, never priced here. What it is worth is settled when
  -- a host accepts, and the BEFORE INSERT trigger nulls discount_inr besides.
  insert into public.booking_requests (
    check_in, check_out, adults, children, room_id,
    guest_name, guest_email, guest_phone, guest_country, message, source, coupon_code
  ) values (
    p_check_in, p_check_out, coalesce(p_adults, 1), coalesce(p_children, 0), v_room_id,
    btrim(p_guest_name), lower(btrim(p_guest_email)),
    nullif(btrim(coalesce(p_guest_phone, '')), ''),
    nullif(btrim(coalesce(p_guest_country, '')), ''),
    nullif(btrim(coalesce(p_message, '')), ''),
    'website',
    nullif(upper(btrim(coalesce(p_coupon_code, ''))), '')
  )
  returning reference into v_reference;

  return v_reference;
end;
$$;

revoke all on function public.submit_booking_request(
  date, date, int, int, text, text, text, text, text, text, text) from public;
grant execute on function public.submit_booking_request(
  date, date, int, int, text, text, text, text, text, text, text) to anon, authenticated;

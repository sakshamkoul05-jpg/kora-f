-- Paying on arrival.
--
-- Not every guest wants to put money down online, and for a six-room house
-- where the hosts speak to everyone first, taking a booking on trust is a
-- normal thing to do. The guest says how they would rather pay; the host still
-- decides whether to accept it, and can insist on a deposit for any particular
-- booking.
--
-- Text with a check rather than an enum: this is a two-value preference that
-- may well grow a third, and swapping an enum in place is the awkward
-- migration this codebase has already done once.

alter table public.booking_requests
  add column if not exists payment_preference text not null default 'deposit';

alter table public.booking_requests
  drop constraint if exists payment_preference_known;
alter table public.booking_requests
  add constraint payment_preference_known
  check (payment_preference in ('deposit', 'on_arrival'));

comment on column public.booking_requests.payment_preference is
  'What the GUEST asked for. A host decides what actually happens on accept.';

-- The guest may state a preference. Everything about money still belongs to
-- the host, so the rest of the stripping is unchanged.
create or replace function public.force_pending_on_insert()
returns trigger
language plpgsql
as $$
begin
  new.coupon_code := nullif(upper(btrim(coalesce(new.coupon_code, ''))), '');

  if new.payment_preference not in ('deposit', 'on_arrival') then
    new.payment_preference := 'deposit';
  end if;

  if public.is_staff() then
    return new;
  end if;

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
  new.discount_inr    := null;
  return new;
end;
$$;

-- The guest-facing lookup carries the preference through, so the page can say
-- "you're booked, pay when you arrive" instead of showing a Pay button that
-- would take money nobody asked for.
drop function if exists public.booking_status_for(text, text);

create or replace function public.booking_status_for(
  p_reference text,
  p_email     text
)
returns table (
  reference          text,
  status             text,
  check_in           date,
  check_out          date,
  room_name          text,
  adults             int,
  children           int,
  guest_name         text,
  total_inr          int,
  deposit_inr        int,
  discount_inr       int,
  hold_expires_at    timestamptz,
  deposit_paid_at    timestamptz,
  payment_preference text,
  payment_url        text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    b.reference,
    b.status::text,
    b.check_in,
    b.check_out,
    r.name,
    b.adults,
    b.children,
    b.guest_name,
    b.total_inr,
    b.deposit_inr,
    b.discount_inr,
    b.hold_expires_at,
    b.deposit_paid_at,
    b.payment_preference,
    case
      when b.status = 'accepted'
       and b.payment_preference = 'deposit'
       and b.deposit_paid_at is null
       and (b.hold_expires_at is null or b.hold_expires_at > now())
      then (
        select p.payment_url from public.payments p
         where p.booking_request_id = b.id
           and p.payment_url is not null
           and p.status in ('created', 'authorized')
         order by p.created_at desc
         limit 1
      )
      else null
    end as payment_url
  from public.booking_requests b
  left join public.rooms r on r.id = b.room_id
  where upper(btrim(b.reference)) = upper(btrim(p_reference))
    and lower(btrim(b.guest_email)) = lower(btrim(p_email))
  limit 1;
$$;

revoke all on function public.booking_status_for(text, text) from public;
grant execute on function public.booking_status_for(text, text) to anon, authenticated;

-- Submitting with a preference. Dropped and recreated rather than defaulted,
-- for the same reason as last time: two overloads differing only by a default
-- make PostgREST answer 300 Multiple Choices instead of taking the booking.
drop function if exists public.submit_booking_request(
  date, date, int, int, text, text, text, text, text, text, text);

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
  p_coupon_code   text default null,
  p_payment_preference text default 'deposit'
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

  insert into public.booking_requests (
    check_in, check_out, adults, children, room_id,
    guest_name, guest_email, guest_phone, guest_country, message, source,
    coupon_code, payment_preference
  ) values (
    p_check_in, p_check_out, coalesce(p_adults, 1), coalesce(p_children, 0), v_room_id,
    btrim(p_guest_name), lower(btrim(p_guest_email)),
    nullif(btrim(coalesce(p_guest_phone, '')), ''),
    nullif(btrim(coalesce(p_guest_country, '')), ''),
    nullif(btrim(coalesce(p_message, '')), ''),
    'website',
    nullif(upper(btrim(coalesce(p_coupon_code, ''))), ''),
    case when p_payment_preference = 'on_arrival' then 'on_arrival' else 'deposit' end
  )
  returning reference into v_reference;

  return v_reference;
end;
$$;

revoke all on function public.submit_booking_request(
  date, date, int, int, text, text, text, text, text, text, text, text) from public;
grant execute on function public.submit_booking_request(
  date, date, int, int, text, text, text, text, text, text, text, text) to anon, authenticated;

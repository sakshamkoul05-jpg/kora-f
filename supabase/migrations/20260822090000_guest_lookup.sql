-- A guest can find their own booking, and pay for it.
--
-- Until now the deposit link existed only in whatever message a host sent by
-- hand. Lose that message and the booking stalls with nobody at fault. This
-- closes the loop: reference plus email, and the guest can see where things
-- stand and pay if it is their turn to.

-- ------------------------------------------------- store the real pay URL ---
--
-- The admin was rebuilding links as rzp.io/i/<order_id>, which is not how
-- Razorpay short URLs are formed — the id and the short URL are unrelated
-- strings. The link was therefore wrong wherever it was shown. Keep the one
-- Razorpay actually gives us.
alter table public.payments
  add column if not exists payment_url text;

-- --------------------------------------------------------------- lookup ----
--
-- BOTH the reference and the email are required. A reference alone is
-- KH-YYYY-NNNN — ten thousand possibilities a year, trivially enumerable, and
-- it would expose a stranger's dates and phone number. Requiring the address
-- the booking was made with means an attacker needs the thing they were trying
-- to steal.
--
-- Returns a deliberately narrow set of columns: no host notes, no internal
-- state, nothing about other bookings.
create or replace function public.booking_status_for(
  p_reference text,
  p_email     text
)
returns table (
  reference       text,
  status          text,
  check_in        date,
  check_out       date,
  room_name       text,
  adults          int,
  children        int,
  guest_name      text,
  total_inr       int,
  deposit_inr     int,
  discount_inr    int,
  hold_expires_at timestamptz,
  deposit_paid_at timestamptz,
  payment_url     text
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
    -- Only hand back a payment link while one is actually due. A paid or
    -- declined booking has no business offering a way to pay again.
    case
      when b.status = 'accepted'
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

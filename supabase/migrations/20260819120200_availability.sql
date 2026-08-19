-- Availability.
--
-- Exposed as a function rather than a view over the tables, so the public
-- surface is exactly "is this room free on these dates" — never who booked it,
-- their contact details, or why a date is blocked ("family staying" is not the
-- internet's business).
--
-- Only CONFIRMED requests hold a room. Pending ones do not, deliberately: the
-- hosts decide, and a flood of speculative requests must not lock the calendar.

create or replace function public.room_availability(
  from_date date,
  to_date   date
)
returns table (
  room_id         uuid,
  slug            text,
  name            text,
  room_number     int,
  has_kitchenette boolean,
  is_available    boolean
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with window_range as (
    select daterange(from_date, to_date, '[)') as r
  )
  select
    rm.id,
    rm.slug,
    rm.name,
    rm.room_number,
    rm.has_kitchenette,
    not (
      exists (
        select 1
        from public.booking_requests b, window_range w
        where b.room_id = rm.id
          and b.status  = 'confirmed'
          and b.stay && w.r
      )
      or exists (
        select 1
        from public.blocked_dates d, window_range w
        where (d.room_id = rm.id or d.room_id is null)
          and daterange(d.starts_on, d.ends_on, '[)') && w.r
      )
    ) as is_available
  from public.rooms rm
  where rm.is_active
  order by rm.sort_order, rm.room_number;
$$;

-- Callable by the public site. It reads the underlying tables as the caller
-- (security invoker), but returns only non-sensitive columns.
grant execute on function public.room_availability(date, date) to anon, authenticated;

-- The function reads booking_requests, which anon cannot SELECT under RLS.
-- A stable SECURITY DEFINER wrapper does the overlap test without ever
-- returning a row from that table.
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
      and b.status = 'confirmed'
      and b.stay && daterange(p_from, p_to, '[)')
  ) or exists (
    select 1 from public.blocked_dates d
    where (d.room_id = p_room_id or d.room_id is null)
      and daterange(d.starts_on, d.ends_on, '[)') && daterange(p_from, p_to, '[)')
  );
$$;

revoke all on function public.is_room_taken(uuid, date, date) from public;
grant execute on function public.is_room_taken(uuid, date, date) to anon, authenticated;

-- Rewritten to use the definer wrapper so it works for anonymous callers.
create or replace function public.room_availability(
  from_date date,
  to_date   date
)
returns table (
  room_id         uuid,
  slug            text,
  name            text,
  room_number     int,
  has_kitchenette boolean,
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
    not public.is_room_taken(rm.id, from_date, to_date) as is_available
  from public.rooms rm
  where rm.is_active
  order by rm.sort_order, rm.room_number;
$$;

grant execute on function public.room_availability(date, date) to anon, authenticated;

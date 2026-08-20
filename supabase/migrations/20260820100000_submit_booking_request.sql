-- Submitting a booking request.
--
-- Why this function exists at all:
--
-- `INSERT ... RETURNING` requires a SELECT privilege on the returned columns,
-- and anon deliberately has no SELECT policy on booking_requests — that is the
-- single most important rule in this schema, because the table holds guests'
-- names, emails and phone numbers. So the obvious implementation (insert, then
-- read the generated reference back) is refused by RLS with 42501. Caught by
-- supabase/verify-live.mjs against the real project; a plain insert succeeds
-- and the identical insert with RETURNING does not.
--
-- The wrong fix is to add an anon SELECT policy. That would expose every guest
-- record to anyone holding the publishable key, which is everyone.
--
-- The right fix is this: a SECURITY DEFINER function whose return type is a
-- single text reference. It can write the row and read back that one value,
-- and there is no way to make it yield anything else. Same pattern as
-- is_room_taken() in 20260819120200_availability.sql.
--
-- Being SECURITY DEFINER, it bypasses RLS — so the date guards from the INSERT
-- policy are repeated here. They are the real enforcement for this path.

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
  p_room_slug     text default null
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
  -- RLS does not run for a definer function, so these are not belt-and-braces;
  -- they are the only thing standing here.
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

  -- Resolve the room from its slug in here. The caller never supplies an id,
  -- so it cannot point a request at an inactive or non-existent room.
  if p_room_slug is not null and btrim(p_room_slug) <> '' then
    select id into v_room_id
      from public.rooms
     where slug = p_room_slug and is_active
     limit 1;
  end if;

  -- Note what is absent from this insert: status, host_note, quoted_total_inr.
  -- There is no parameter for any of them, so self-confirmation is impossible
  -- by construction rather than by a trigger having to undo it.
  insert into public.booking_requests (
    check_in, check_out, adults, children, room_id,
    guest_name, guest_email, guest_phone, guest_country, message, source
  ) values (
    p_check_in, p_check_out, coalesce(p_adults, 1), coalesce(p_children, 0), v_room_id,
    btrim(p_guest_name), lower(btrim(p_guest_email)),
    nullif(btrim(coalesce(p_guest_phone, '')), ''),
    nullif(btrim(coalesce(p_guest_country, '')), ''),
    nullif(btrim(coalesce(p_message, '')), ''),
    'website'
  )
  returning reference into v_reference;

  return v_reference;
end;
$$;

-- `public` includes every future role; name the two that should have it.
revoke all on function public.submit_booking_request(
  date, date, int, int, text, text, text, text, text, text) from public;
grant execute on function public.submit_booking_request(
  date, date, int, int, text, text, text, text, text, text) to anon, authenticated;

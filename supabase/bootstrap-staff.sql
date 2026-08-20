-- Kora House — promote the first host to staff, and clear the test data.
--
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- Until a row exists in public.staff, nobody can read a booking request —
-- signing in to /admin will work and the list will be empty. That is the
-- intended closed-by-default state, not a fault. This is what opens it.

do $$
declare
  v_email text := 'sakshamkoul48@gmail.com';   -- <- change if promoting someone else
  v_uid   uuid;
  v_removed int;
begin
  select id into v_uid from auth.users where lower(email) = lower(v_email);

  if v_uid is null then
    raise exception
      'No auth user with email %. Create it first: Authentication -> Users -> Add user (tick Auto Confirm), then run this again.',
      v_email;
  end if;

  insert into public.staff (user_id, email, role)
  values (v_uid, v_email, 'admin')
  on conflict (user_id) do update set role = 'admin', email = excluded.email;

  raise notice 'OK: % is now an admin (user_id %)', v_email, v_uid;

  -- Remove the rows left behind by verify-live.mjs and the end-to-end tests.
  delete from public.booking_requests where guest_name like 'DELETE ME%';
  get diagnostics v_removed = row_count;
  raise notice 'Removed % test booking request(s).', v_removed;
end;
$$;

-- Should return exactly one row: the host, as admin.
select email, role, created_at from public.staff order by created_at;

-- Should return 0 — no test data left behind.
select count(*) as leftover_test_rows
  from public.booking_requests
 where guest_name like 'DELETE ME%';

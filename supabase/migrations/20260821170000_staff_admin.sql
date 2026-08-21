-- Managing staff from the admin panel instead of by SQL.
--
-- Adding staff needs auth.users, which PostgREST does not expose — so it has
-- to go through SECURITY DEFINER. That means RLS does not apply, which means
-- the authorisation check has to be written out by hand, first, in every one
-- of these functions. A definer function that forgets it is a hole straight
-- through the whole permission model.

-- --------------------------------------------- fixing a recursive policy ----
--
-- `admins manage staff` in 20260819120050_staff.sql was written as
--
--     for all ... using (exists (select 1 from public.staff where ...))
--
-- FOR ALL includes SELECT, so reading public.staff evaluates a policy whose
-- own USING clause reads public.staff — infinite recursion, error 42P17. It
-- never surfaced because the only writes to that table so far were made as
-- superuser in the SQL editor, where policies do not apply.
--
-- The fix is the same shape as is_staff(): a SECURITY DEFINER function, which
-- runs as its owner and therefore does not re-enter the policy.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.staff s
     where s.user_id = auth.uid() and s.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "admins manage staff" on public.staff;
create policy "admins manage staff"
  on public.staff for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------ list staff ----

-- Staff can already SELECT public.staff under RLS. This exists so the panel
-- can show who is on the list without needing auth.users at all.
create or replace function public.list_staff()
returns table (user_id uuid, email text, role text, created_at timestamptz)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select s.user_id, s.email, s.role, s.created_at
  from public.staff s
  order by s.created_at;
$$;

grant execute on function public.list_staff() to authenticated;

-- ------------------------------------------------------------- add staff ----

create or replace function public.add_staff(p_email text, p_role text default 'host')
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid;
  v_email text := lower(btrim(p_email));
begin
  -- FIRST, always: definer bypasses RLS, so this is the only gate.
  if not public.is_admin() then
    raise exception 'Only an admin can change the staff list' using errcode = '42501';
  end if;

  if p_role not in ('host', 'admin') then
    raise exception 'Role must be host or admin' using errcode = '22023';
  end if;

  select id into v_uid from auth.users where lower(email) = v_email;
  if v_uid is null then
    -- Deliberately not creating the account here. Account creation belongs in
    -- Supabase Auth, where the password is set by the person who owns it.
    raise exception 'No account exists for %. Create the user in Supabase Auth first, then add them here.', v_email
      using errcode = '22023';
  end if;

  insert into public.staff (user_id, email, role)
  values (v_uid, v_email, p_role)
  on conflict (user_id) do update set role = excluded.role, email = excluded.email;

  return v_email;
end;
$$;

revoke all on function public.add_staff(text, text) from public;
grant execute on function public.add_staff(text, text) to authenticated;

-- ---------------------------------------------------------- remove staff ----

create or replace function public.remove_staff(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admins int;
  v_role   text;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can change the staff list' using errcode = '42501';
  end if;

  select role into v_role from public.staff where user_id = p_user_id;
  if v_role is null then
    raise exception 'That person is not on the staff list' using errcode = '22023';
  end if;

  -- Removing the last admin would lock everyone out of the booking requests
  -- permanently, recoverable only by SQL. Refuse.
  if v_role = 'admin' then
    select count(*) into v_admins from public.staff where role = 'admin';
    if v_admins <= 1 then
      raise exception 'That is the only admin — promote someone else first, or you will lock yourself out'
        using errcode = '22023';
    end if;
  end if;

  delete from public.staff where user_id = p_user_id;
  return 'removed';
end;
$$;

revoke all on function public.remove_staff(uuid) from public;
grant execute on function public.remove_staff(uuid) to authenticated;

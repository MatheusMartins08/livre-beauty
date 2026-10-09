-- Individual panel access for each professional, accounts that can be
-- deactivated, and weekly hours per professional. A professional without own
-- periods follows the salon; with them, their hours are their own periods
-- within the salon's. Bookings see the difference only as blocked ranges.
set search_path = public, extensions;

-- Staff sign in with a username mapped to an internal e-mail by the app.
-- Owners always stay active so the salon cannot lock itself out.
alter table public.staff_profiles
  add column login text unique check (login ~ '^[a-z0-9][a-z0-9._-]{2,31}$'),
  add column active boolean not null default true,
  add constraint staff_profiles_owner_active_check check (role <> 'owner' or active);

-- An inactive account fails every policy and definer check immediately, even
-- while its session token is still valid. Same OID, so policies keep working.
create or replace function private.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_profiles
    where user_id = (select auth.uid()) and role = 'owner' and active);
$$;
create or replace function private.current_stylist_id() returns text
language sql stable security definer set search_path = '' as $$
  select stylist_id from public.staff_profiles where user_id = (select auth.uid()) and active;
$$;

-- stylist_id null: the salon's hours. Set: that professional's own hours.
alter table public.opening_periods
  add column stylist_id text references public.stylists(id) on delete cascade;
create index opening_periods_stylist_id_idx on public.opening_periods(stylist_id);
alter table public.opening_periods
  drop constraint opening_periods_no_overlap,
  add constraint opening_periods_no_overlap exclude using gist (
    (coalesce(stylist_id, '')) with =, weekday with =,
    tsrange(date '2000-01-01' + opens_at, date '2000-01-01' + closes_at, '[)') with &&);

-- Professionals may now have their own special hours, one range of dates each.
do $$
declare
  constraint_name text;
  dropped integer := 0;
begin
  for constraint_name in
    select c.conname from pg_constraint c
    where c.conrelid = 'public.schedule_exceptions'::regclass and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%horario_especial%'
      and pg_get_constraintdef(c.oid) like '%stylist_id IS NULL%'
  loop
    execute format('alter table public.schedule_exceptions drop constraint %I', constraint_name);
    dropped := dropped + 1;
  end loop;
  if dropped <> 1 then
    raise exception 'Expected one salon-only special hours check, found %', dropped;
  end if;
end;
$$;
alter table public.schedule_exceptions
  drop constraint schedule_exceptions_special_no_overlap,
  add constraint schedule_exceptions_special_no_overlap exclude using gist (
    (coalesce(stylist_id, '')) with =, daterange(starts_on, ends_on, '[]') with &&)
    where (kind = 'horario_especial');

-- Visitors see only the salon's hours. The team sees the salon's and their own;
-- the owner sees everything. Each professional edits only their own rows.
drop policy opening_periods_public_read on public.opening_periods;
drop policy schedule_exceptions_staff_read on public.schedule_exceptions;
create policy opening_periods_anon_read on public.opening_periods for select to anon
using (stylist_id is null);
create policy opening_periods_authenticated_read on public.opening_periods for select
to authenticated using (stylist_id is null or (select private.is_owner())
  or stylist_id = (select private.current_stylist_id()));
create policy schedule_exceptions_authenticated_read on public.schedule_exceptions for select
to authenticated using ((select private.is_owner())
  or ((select private.current_stylist_id()) is not null
    and (stylist_id is null or stylist_id = (select private.current_stylist_id()))));
do $$
declare table_name text;
begin
  foreach table_name in array array['opening_periods', 'schedule_exceptions'] loop
    execute format('drop policy %I on public.%I', table_name || '_owner_insert', table_name);
    execute format('drop policy %I on public.%I', table_name || '_owner_update', table_name);
    execute format('drop policy %I on public.%I', table_name || '_owner_delete', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_owner()) or (stylist_id is not null and stylist_id = (select private.current_stylist_id())))', table_name || '_editor_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.is_owner()) or (stylist_id is not null and stylist_id = (select private.current_stylist_id()))) with check ((select private.is_owner()) or (stylist_id is not null and stylist_id = (select private.current_stylist_id())))', table_name || '_editor_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_owner()) or (stylist_id is not null and stylist_id = (select private.current_stylist_id())))', table_name || '_editor_delete', table_name);
  end loop;
end;
$$;

-- The salon's periods of one date: closed > special hours > weekly periods.
create or replace function private.day_periods(p_day date)
returns table (opens_at time, closes_at time)
language sql stable security definer set search_path = '' as $$
  with closed as (
    select 1 from public.schedule_exceptions e
    where e.kind = 'fechado' and e.stylist_id is null and p_day between e.starts_on and e.ends_on
  ), special as (
    select e.opens_at, e.closes_at from public.schedule_exceptions e
    where e.kind = 'horario_especial' and e.stylist_id is null
      and p_day between e.starts_on and e.ends_on
  )
  select s.opens_at, s.closes_at from special s where not exists (select 1 from closed)
  union all
  select p.opens_at, p.closes_at from public.opening_periods p
  where p.stylist_id is null and p.weekday = extract(dow from p_day)
    and not exists (select 1 from closed) and not exists (select 1 from special)
  order by 1;
$$;

-- Unavailable ranges of one date; stylist_id null applies to everyone.
-- Besides blocks and days off, a professional with own hours (weekly periods,
-- or special hours that day) is unavailable for the rest of the day.
create or replace function private.day_blocks(p_day date)
returns table (stylist_id text, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = '' as $$
  with special as (
    select e.stylist_id, e.opens_at, e.closes_at from public.schedule_exceptions e
    where e.kind = 'horario_especial' and e.stylist_id is not null
      and p_day between e.starts_on and e.ends_on
  ), customized as (
    select p.stylist_id from public.opening_periods p where p.stylist_id is not null
    union
    select s.stylist_id from special s
  ), own as (
    select s.stylist_id, s.opens_at, s.closes_at from special s
    union all
    select p.stylist_id, p.opens_at, p.closes_at from public.opening_periods p
    where p.stylist_id is not null and p.weekday = extract(dow from p_day)
      and not exists (select 1 from special s where s.stylist_id = p.stylist_id)
  )
  select e.stylist_id,
    case when e.kind = 'fechado' then p_day::timestamp at time zone 'America/Sao_Paulo'
      else (p_day + e.opens_at) at time zone 'America/Sao_Paulo' end,
    case when e.kind = 'fechado' then (p_day + 1)::timestamp at time zone 'America/Sao_Paulo'
      else (p_day + e.closes_at) at time zone 'America/Sao_Paulo' end
  from public.schedule_exceptions e
  where p_day between e.starts_on and e.ends_on
    and (e.kind = 'bloqueio' or (e.kind = 'fechado' and e.stylist_id is not null))
  union all
  select c.stylist_id, lower(gap.r), upper(gap.r)
  from customized c
  cross join lateral unnest(
    tstzmultirange(tstzrange(p_day::timestamp at time zone 'America/Sao_Paulo',
      (p_day + 1)::timestamp at time zone 'America/Sao_Paulo', '[)'))
    - coalesce((select range_agg(tstzrange((p_day + o.opens_at) at time zone 'America/Sao_Paulo',
        (p_day + o.closes_at) at time zone 'America/Sao_Paulo', '[)'))
      from own o where o.stylist_id = c.stylist_id), '{}'::tstzmultirange)
  ) as gap(r);
$$;

-- Replaces one owner's week: the salon (null) or a professional. For a
-- professional, an empty list means following the salon's hours again.
drop function public.save_opening_periods(jsonb);
create function public.save_opening_periods(p_periods jsonb, p_stylist_id text default null)
returns void
language plpgsql security invoker set search_path = '' as $$
begin
  -- coalesce: an inactive account has no stylist id, and a null comparison
  -- must deny instead of slipping through "if not".
  if not coalesce((select private.is_owner())
    or p_stylist_id = (select private.current_stylist_id()), false) then
    raise insufficient_privilege using message = 'Acesso não autorizado.';
  end if;
  if jsonb_typeof(p_periods) is distinct from 'array' or jsonb_array_length(p_periods) > 42 then
    raise exception using errcode = 'LB007', message = 'Confira os horários da semana.';
  end if;
  delete from public.opening_periods where stylist_id is not distinct from p_stylist_id;
  insert into public.opening_periods (weekday, opens_at, closes_at, stylist_id)
  select (e->>'weekday')::smallint, (e->>'opens_at')::time, (e->>'closes_at')::time, p_stylist_id
  from jsonb_array_elements(p_periods) e;
end;
$$;
revoke all on function public.save_opening_periods(jsonb, text) from public, anon, authenticated;
grant execute on function public.save_opening_periods(jsonb, text) to authenticated;

-- Definer functions read staff_profiles directly, so they check active too.
create or replace function public.get_staff_settings()
returns table (commission_rate numeric)
language sql stable security definer set search_path = '' as $$
  select s.demo_commission_rate from public.salon_settings s
  where s.id and exists (select 1 from public.staff_profiles p
    where p.user_id = (select auth.uid()) and p.active);
$$;

create or replace function public.save_appointment(
  p_id text, p_client_id text, p_service_ids text[], p_performed_by text,
  p_starts_at timestamptz, p_status public.appointment_status, p_price numeric,
  p_payment_method public.payment_method, p_notes text
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  me public.staff_profiles%rowtype;
  existing public.appointments%rowtype;
  is_update boolean;
  current_ids text[];
  total_duration integer;
  service_count integer;
begin
  select * into me from public.staff_profiles where user_id = (select auth.uid()) and active;
  if not found then
    raise insufficient_privilege using message = 'Acesso não autorizado.';
  end if;
  if p_id is null or p_id !~ '^[A-Za-z0-9:_-]{1,80}$' or p_client_id is null
    or p_performed_by is null or p_starts_at is null or not isfinite(p_starts_at)
    or p_status is null or p_price is null or p_price < 0 or p_price > 100000
    or char_length(coalesce(p_notes, '')) > 1000 then
    raise exception using errcode = 'LB003', message = 'Confira os dados do atendimento.';
  end if;
  select * into existing from public.appointments where id = p_id for update;
  is_update := found;
  if me.role <> 'owner' and (me.stylist_id is null or p_performed_by <> me.stylist_id
    or (is_update and existing.performed_by <> me.stylist_id)) then
    raise insufficient_privilege using message = 'Acesso não autorizado.';
  end if;
  if not exists (select 1 from public.clients where id = p_client_id) then
    raise exception using errcode = 'LB003', message = 'Escolha um cliente cadastrado.';
  end if;
  if is_update then
    select array_agg(i.service_id order by i.sort_order) into current_ids
    from public.appointment_services i where i.appointment_id = p_id;
  end if;
  if is_update and current_ids = p_service_ids then
    -- Same services keep their booked duration, names and list prices.
    select sum(i.duration) into total_duration
    from public.appointment_services i where i.appointment_id = p_id;
  else
    select count(*), sum(r.r_duration) into service_count, total_duration
    from private.resolve_services(p_service_ids) r
    join public.services s on s.id = r.r_id
    where s.active or r.r_id = any(coalesce(current_ids, '{}'));
    if service_count <> cardinality(p_service_ids) then
      raise exception using errcode = 'LB004', message = 'Escolha serviços ativos.';
    end if;
    if exists (
      select 1 from unnest(p_service_ids) wanted(service_id)
      where not exists (
        select 1 from public.stylist_services ss
        join public.services s on s.id = ss.service_id
        join public.stylists st on st.id = ss.stylist_id
        where ss.stylist_id = p_performed_by and ss.service_id = wanted.service_id
          and ss.active and s.active and st.active)
    ) then
      raise check_violation using message = 'O profissional não atende este serviço.';
    end if;
    delete from public.appointment_services where appointment_id = p_id;
    insert into public.appointment_services (appointment_id, sort_order, service_id, service_name, duration, price)
    select p_id, r.r_order, r.r_id, r.r_name, r.r_duration, r.r_price
    from private.resolve_services(p_service_ids) r;
  end if;
  if is_update then
    update public.appointments set
      client_id = p_client_id, service_id = p_service_ids[1], performed_by = p_performed_by,
      starts_at = p_starts_at, ends_at = p_starts_at + make_interval(mins => total_duration),
      status = p_status, price = p_price, payment_method = p_payment_method,
      notes = btrim(coalesce(p_notes, ''))
    where id = p_id;
  else
    insert into public.appointments (id, client_id, service_id, booked_with, performed_by,
      starts_at, ends_at, status, price, payment_method, source, notes)
    values (p_id, p_client_id, p_service_ids[1], p_performed_by, p_performed_by,
      p_starts_at, p_starts_at + make_interval(mins => total_duration), p_status, p_price,
      p_payment_method, 'painel', btrim(coalesce(p_notes, '')));
  end if;
  return p_id;
end;
$$;
reset search_path;

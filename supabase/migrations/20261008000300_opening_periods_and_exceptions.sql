-- Weekly hours with several periods per day, plus dated exceptions.
-- business_hours stays for compatibility; opening_periods replaces it everywhere.
set search_path = public, extensions;

create table public.opening_periods (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at > opens_at),
  -- Periods of the same weekday may touch (half-open) but never overlap.
  constraint opening_periods_no_overlap exclude using gist (weekday with =,
    tsrange(date '2000-01-01' + opens_at, date '2000-01-01' + closes_at, '[)') with &&)
);

insert into public.opening_periods (weekday, opens_at, closes_at)
select weekday, opens_at, closes_at from public.business_hours where active
on conflict do nothing;

-- fechado: the salon (stylist_id null) or one professional is off all day.
-- horario_especial: replaces the weekly periods of the salon on those days.
-- bloqueio: a time window unavailable for the salon or one professional.
create table public.schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('fechado', 'horario_especial', 'bloqueio')),
  stylist_id text references public.stylists(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  opens_at time,
  closes_at time,
  reason text not null default '' check (char_length(reason) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on and ends_on - starts_on <= 366),
  check ((kind = 'fechado' and opens_at is null and closes_at is null)
    or (kind <> 'fechado' and opens_at is not null and closes_at is not null
      and closes_at > opens_at)),
  check (kind <> 'horario_especial' or stylist_id is null),
  constraint schedule_exceptions_special_no_overlap exclude using gist (
    daterange(starts_on, ends_on, '[]') with &&) where (kind = 'horario_especial')
);
create index schedule_exceptions_stylist_id_idx on public.schedule_exceptions(stylist_id);
create index schedule_exceptions_ends_on_idx on public.schedule_exceptions(ends_on);

do $$
declare table_name text;
begin
  foreach table_name in array array['opening_periods', 'schedule_exceptions'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant insert, update, delete on public.%I to authenticated', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_owner()))', table_name || '_owner_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()))', table_name || '_owner_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_owner()))', table_name || '_owner_delete', table_name);
  end loop;
end;
$$;
grant select on public.opening_periods to anon, authenticated;
create policy opening_periods_public_read on public.opening_periods for select
to anon, authenticated using (true);
-- Reasons may be internal, so only the team reads exceptions directly.
grant select on public.schedule_exceptions to authenticated;
create policy schedule_exceptions_staff_read on public.schedule_exceptions for select
to authenticated using ((select private.is_owner()) or (select private.current_stylist_id()) is not null);

-- Precedence: salon closed > special hours > weekly periods.
create function private.day_periods(p_day date)
returns table (opens_at time, closes_at time)
language sql stable security definer set search_path = '' as $$
  with closed as (
    select 1 from public.schedule_exceptions e
    where e.kind = 'fechado' and e.stylist_id is null and p_day between e.starts_on and e.ends_on
  ), special as (
    select e.opens_at, e.closes_at from public.schedule_exceptions e
    where e.kind = 'horario_especial' and p_day between e.starts_on and e.ends_on
  )
  select s.opens_at, s.closes_at from special s where not exists (select 1 from closed)
  union all
  select p.opens_at, p.closes_at from public.opening_periods p
  where p.weekday = extract(dow from p_day)
    and not exists (select 1 from closed) and not exists (select 1 from special)
  order by 1;
$$;

-- Blocks of one day: stylist_id null applies to everyone. A professional's day
-- off becomes a block covering the whole local day.
create function private.day_blocks(p_day date)
returns table (stylist_id text, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select e.stylist_id,
    case when e.kind = 'fechado' then p_day::timestamp at time zone 'America/Sao_Paulo'
      else (p_day + e.opens_at) at time zone 'America/Sao_Paulo' end,
    case when e.kind = 'fechado' then (p_day + 1)::timestamp at time zone 'America/Sao_Paulo'
      else (p_day + e.closes_at) at time zone 'America/Sao_Paulo' end
  from public.schedule_exceptions e
  where p_day between e.starts_on and e.ends_on
    and (e.kind = 'bloqueio' or (e.kind = 'fechado' and e.stylist_id is not null));
$$;
revoke all on function private.day_periods(date), private.day_blocks(date)
from public, anon, authenticated;

-- Public calendar: opening periods per day, without reasons or professional data.
create function public.get_opening_calendar(p_from date, p_to date)
returns table (day date, opens_at time, closes_at time)
language sql stable security definer set search_path = '' as $$
  select d::date, p.opens_at, p.closes_at
  from generate_series(p_from, least(p_to, p_from + 400), interval '1 day') d
  cross join lateral private.day_periods(d::date) p
  order by 1, 2;
$$;
revoke all on function public.get_opening_calendar(date, date) from public, anon, authenticated;
grant execute on function public.get_opening_calendar(date, date) to anon, authenticated;
reset search_path;

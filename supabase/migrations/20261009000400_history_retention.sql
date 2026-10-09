-- Optional retention of the appointment history. Null keeps everything; a
-- period removes, once a day, appointments that started before it, clients
-- left without appointments and unchanged since then, and exceptions that ended.
alter table public.salon_settings
  add column history_retention_months integer
    check (history_retention_months between 6 and 120);

-- First local day that is kept.
create function private.history_cutoff(p_months integer) returns date
language sql stable set search_path = '' as $$
  select ((now() at time zone 'America/Sao_Paulo')::date - make_interval(months => p_months))::date;
$$;

create function private.expired_history_counts(p_months integer)
returns table (appointments bigint, clients bigint, exceptions bigint, cutoff date)
language sql stable security definer set search_path = '' as $$
  with limits as (
    select private.history_cutoff(p_months) as day,
      private.history_cutoff(p_months)::timestamp at time zone 'America/Sao_Paulo' as instant
  )
  select
    (select count(*) from public.appointments a, limits l where a.starts_at < l.instant),
    (select count(*) from public.clients c, limits l where c.updated_at < l.instant
      and not exists (select 1 from public.appointments a
        where a.client_id = c.id and a.starts_at >= l.instant)),
    (select count(*) from public.schedule_exceptions e, limits l where e.ends_on < l.day),
    (select day from limits);
$$;

-- Runs from pg_cron as the database owner; nobody else may execute it.
create function private.purge_expired_history() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  months integer;
  cutoff_day date;
  cutoff timestamptz;
  removed_appointments integer;
  removed_clients integer;
  removed_exceptions integer;
begin
  select history_retention_months into months from public.salon_settings where id;
  if months is null then return jsonb_build_object('skipped', true); end if;
  cutoff_day := private.history_cutoff(months);
  cutoff := cutoff_day::timestamp at time zone 'America/Sao_Paulo';
  -- Items go with their appointment (on delete cascade).
  delete from public.appointments where starts_at < cutoff;
  get diagnostics removed_appointments = row_count;
  delete from public.clients c where c.updated_at < cutoff
    and not exists (select 1 from public.appointments a where a.client_id = c.id);
  get diagnostics removed_clients = row_count;
  delete from public.schedule_exceptions where ends_on < cutoff_day;
  get diagnostics removed_exceptions = row_count;
  return jsonb_build_object('cutoff', cutoff_day, 'appointments', removed_appointments,
    'clients', removed_clients, 'exceptions', removed_exceptions);
end;
$$;

-- The owner sees what a period would remove before turning it on.
create function public.preview_history_purge(p_months integer)
returns table (appointments bigint, clients bigint, exceptions bigint, cutoff date)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not coalesce((select private.is_owner()), false) then
    raise insufficient_privilege using message = 'Acesso não autorizado.';
  end if;
  if p_months is null or p_months not between 6 and 120 then
    raise exception using errcode = 'LB008', message = 'Escolha um prazo de 6 a 120 meses.';
  end if;
  return query select * from private.expired_history_counts(p_months);
end;
$$;

revoke all on function private.history_cutoff(integer), private.expired_history_counts(integer),
  private.purge_expired_history() from public, anon, authenticated;
revoke all on function public.preview_history_purge(integer) from public, anon, authenticated;
grant execute on function public.preview_history_purge(integer) to authenticated;

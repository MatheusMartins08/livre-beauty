-- Appointments with up to five services, combos, and scheduling rules that use
-- opening periods and exceptions. The single-service RPC remains as a wrapper.
set search_path = public, extensions;

-- A combo is a regular service with its own price, duration and professionals.
-- Its components only prevent booking the combo together with one of its parts.
create table public.service_components (
  service_id text not null references public.services(id) on delete cascade,
  component_id text not null references public.services(id) on delete cascade,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (service_id, component_id),
  check (service_id <> component_id)
);
create index service_components_component_id_idx on public.service_components(component_id);

create function private.check_service_component() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.service_components c where c.service_id = new.component_id)
    or exists (select 1 from public.service_components c where c.component_id = new.service_id) then
    raise check_violation using message = 'Um combo não pode incluir outro combo.';
  end if;
  return new;
end;
$$;
create trigger service_components_no_nesting before insert or update on public.service_components
for each row execute function private.check_service_component();

-- Items keep the name, duration and list price chosen at booking time.
-- appointments.service_id mirrors the first item for compatibility.
create table public.appointment_services (
  appointment_id text not null references public.appointments(id)
    on delete cascade deferrable initially deferred,
  sort_order smallint not null check (sort_order between 1 and 5),
  service_id text not null references public.services(id) on delete restrict,
  service_name text not null check (char_length(service_name) between 1 and 100),
  duration integer not null check (duration > 0),
  price numeric(10,2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (appointment_id, sort_order),
  unique (appointment_id, service_id)
);
create index appointment_services_service_id_idx on public.appointment_services(service_id);

insert into public.appointment_services (appointment_id, sort_order, service_id, service_name, duration, price)
select a.id, 1, a.service_id, s.name,
  greatest(1, round(extract(epoch from a.ends_at - a.starts_at) / 60))::integer, a.price
from public.appointments a join public.services s on s.id = a.service_id
on conflict do nothing;
-- The backfill queues the deferred foreign key checks, and ALTER TABLE below
-- refuses to run while checks are pending. Run them now.
set constraints all immediate;

do $$
declare table_name text;
begin
  foreach table_name in array array['service_components', 'appointment_services'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
  end loop;
end;
$$;
grant select on public.service_components to anon, authenticated;
grant insert, update, delete on public.service_components to authenticated;
create policy service_components_anon_read on public.service_components for select to anon
using (exists (select 1 from public.services s where s.id = service_id and s.active));
create policy service_components_authenticated_read on public.service_components for select
to authenticated using ((select private.is_owner())
  or exists (select 1 from public.services s where s.id = service_id and s.active));
create policy service_components_owner_insert on public.service_components for insert
to authenticated with check ((select private.is_owner()));
create policy service_components_owner_update on public.service_components for update
to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy service_components_owner_delete on public.service_components for delete
to authenticated using ((select private.is_owner()));
-- Items change only through the definer functions below; nobody writes them directly.
grant select on public.appointment_services to authenticated;
create policy appointment_services_authenticated_read on public.appointment_services for select
to authenticated using ((select private.is_owner()) or exists (
  select 1 from public.appointments a
  where a.id = appointment_id and a.performed_by = (select private.current_stylist_id())));

-- Single-service writes (direct inserts, time or service edits) keep their one
-- item in sync; multi-service appointments must match their items on commit.
create function private.sync_appointment_items(p_appointment_id text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  appointment public.appointments%rowtype;
  minutes integer;
  item_count integer;
  item_minutes integer;
  first_service text;
begin
  select * into appointment from public.appointments where id = p_appointment_id;
  if not found then return; end if;
  minutes := greatest(1, round(extract(epoch from appointment.ends_at - appointment.starts_at) / 60))::integer;
  select count(*), coalesce(sum(i.duration), 0) into item_count, item_minutes
  from public.appointment_services i where i.appointment_id = appointment.id;
  if item_count = 0 then
    insert into public.appointment_services (appointment_id, sort_order, service_id, service_name, duration, price)
    select appointment.id, 1, s.id, s.name, minutes, appointment.price
    from public.services s where s.id = appointment.service_id;
  elsif item_count = 1 then
    update public.appointment_services i set
      service_name = case when i.service_id = appointment.service_id then i.service_name else s.name end,
      price = case when i.service_id = appointment.service_id then i.price else appointment.price end,
      service_id = appointment.service_id,
      duration = minutes
    from public.services s
    where s.id = appointment.service_id and i.appointment_id = appointment.id
      and (i.service_id <> appointment.service_id or i.duration <> minutes);
  else
    select i.service_id into first_service from public.appointment_services i
    where i.appointment_id = appointment.id order by i.sort_order limit 1;
    if first_service <> appointment.service_id or item_minutes <> minutes then
      raise check_violation using message = 'Os serviços do atendimento não conferem com o horário.';
    end if;
  end if;
end;
$$;

create function private.appointments_sync_items() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.sync_appointment_items(new.id);
  return null;
end;
$$;
create constraint trigger appointments_sync_items after insert or update on public.appointments
deferrable initially deferred for each row execute function private.appointments_sync_items();

create function private.appointment_services_sync() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    perform private.sync_appointment_items(old.appointment_id);
  else
    perform private.sync_appointment_items(new.appointment_id);
  end if;
  return null;
end;
$$;
create constraint trigger appointment_services_sync after insert or update or delete
on public.appointment_services deferrable initially deferred
for each row execute function private.appointment_services_sync();

-- Same rules as before, now for every item and with periods and exceptions.
-- Booking functions write items before the appointment (deferred FK), so the
-- first item comes from service_id and the others from appointment_services.
create or replace function public.validate_appointment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  local_start timestamp := new.starts_at at time zone 'America/Sao_Paulo';
  local_end timestamp := new.ends_at at time zone 'America/Sao_Paulo';
  service_ids text[];
begin
  if tg_op = 'UPDATE' then
    if new.service_id = old.service_id and new.performed_by = old.performed_by
      and new.starts_at = old.starts_at and new.ends_at = old.ends_at
      and (new.status not in ('agendado', 'concluido') or old.status in ('agendado', 'concluido')) then
      return new;
    end if;
  end if;
  select array[new.service_id] || coalesce(
    array_agg(i.service_id order by i.sort_order) filter (where i.sort_order > 1), '{}')
  into service_ids from public.appointment_services i where i.appointment_id = new.id;
  if exists (
    select 1 from unnest(service_ids) wanted(service_id)
    where not exists (
      select 1 from public.stylist_services ss
      join public.services s on s.id = ss.service_id
      join public.stylists st on st.id = ss.stylist_id
      where ss.stylist_id = new.performed_by and ss.service_id = wanted.service_id
        and ss.active and s.active and st.active)
  ) then
    raise check_violation using message = 'O profissional não atende este serviço.';
  end if;
  if new.status in ('agendado', 'concluido') then
    if local_start::date <> local_end::date or not exists (
      select 1 from private.day_periods(local_start::date) p
      where local_start::time >= p.opens_at and local_end::time <= p.closes_at
    ) then
      raise check_violation using message = 'O atendimento deve ocorrer dentro do horário de funcionamento.';
    end if;
    if exists (
      select 1 from private.day_blocks(local_start::date) b
      where (b.stylist_id is null or b.stylist_id = new.performed_by)
        and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(new.starts_at, new.ends_at, '[)')
    ) then
      raise check_violation using message = 'O profissional está indisponível nesse horário.';
    end if;
  end if;
  return new;
end;
$$;

-- Blocks are returned like bookings: performed_by null blocks every professional.
create or replace function public.get_booked_ranges(p_date date, p_stylist_id text default null)
returns table (performed_by text, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select a.performed_by, a.starts_at, a.ends_at from public.appointments a
  where a.status in ('agendado', 'concluido')
    and a.starts_at < ((p_date + 1)::timestamp at time zone 'America/Sao_Paulo')
    and a.ends_at > (p_date::timestamp at time zone 'America/Sao_Paulo')
    and (p_stylist_id is null or a.performed_by = p_stylist_id)
  union all
  select b.stylist_id, b.starts_at, b.ends_at from private.day_blocks(p_date) b
  where p_stylist_id is null or b.stylist_id is null or b.stylist_id = p_stylist_id
  order by 2, 1;
$$;

-- Validates a list of services and returns them with catalog values, in order.
-- Two combos sharing a part, or a combo with one of its parts, are rejected.
create function private.resolve_services(p_service_ids text[])
returns table (r_order integer, r_id text, r_name text, r_duration integer, r_price numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  if coalesce(cardinality(p_service_ids), 0) not between 1 and 5
    or array_position(p_service_ids, null) is not null
    or (select count(distinct x.id) from unnest(p_service_ids) x(id)) <> cardinality(p_service_ids) then
    raise exception using errcode = 'LB001', message = 'Escolha de 1 a 5 serviços diferentes.';
  end if;
  if exists (
    select 1 from unnest(p_service_ids) x(id)
    left join public.service_components c on c.service_id = x.id
    group by coalesce(c.component_id, x.id) having count(*) > 1
  ) then
    raise exception using errcode = 'LB002',
      message = 'Um combo escolhido já inclui outro serviço da lista.';
  end if;
  return query
    select x.ord::integer, s.id, s.name, s.duration, s.price::numeric
    from unnest(p_service_ids) with ordinality x(id, ord)
    join public.services s on s.id = x.id
    order by x.ord;
end;
$$;
revoke all on function private.resolve_services(text[]), private.sync_appointment_items(text)
from public, anon, authenticated;

create function public.create_public_booking(
  p_service_ids text[], p_stylist_id text, p_starts_at timestamptz,
  p_name text, p_phone text, p_email text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  settings public.salon_settings%rowtype;
  candidate record;
  client_id text;
  new_appointment_id text;
  phone_digits text;
  local_start timestamp := p_starts_at at time zone 'America/Sao_Paulo';
  local_end timestamp;
  end_at timestamptz;
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  service_count integer;
  total_duration integer;
  total_price numeric(10,2);
  date_text text;
  time_text text;
  unavailable constant jsonb := '{"ok":false,"code":"unavailable","message":"Este horário não está mais disponível. Escolha outro dia ou horário."}';
  invalid_services constant jsonb := '{"ok":false,"code":"services","message":"Revise os serviços escolhidos."}';
begin
  phone_digits := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if phone_digits ~ '^55[0-9]{10,11}$' then phone_digits := substr(phone_digits, 3); end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 100
    or p_phone is null or p_phone !~ '^[+()0-9[:space:].-]+$' or phone_digits !~ '^[0-9]{10,11}$'
    or p_email is null or char_length(btrim(p_email)) > 254
    or btrim(p_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return jsonb_build_object('ok', false, 'code', 'contact', 'message', 'Confira seus dados antes de continuar.');
  end if;
  begin
    select count(*), sum(r.r_duration), sum(r.r_price)
    into service_count, total_duration, total_price
    from private.resolve_services(p_service_ids) r
    join public.services s on s.id = r.r_id
    where s.active;
  exception when sqlstate 'LB001' or sqlstate 'LB002' then
    return invalid_services;
  end;
  if service_count <> cardinality(p_service_ids) then return invalid_services; end if;
  select * into settings from public.salon_settings where id;
  if not found then return unavailable; end if;
  if p_starts_at is null or not isfinite(p_starts_at) or p_starts_at <= now()
    or local_start::date < today or local_start::date >= today + settings.booking_window_days then
    return unavailable;
  end if;
  end_at := p_starts_at + make_interval(mins => total_duration);
  local_end := end_at at time zone 'America/Sao_Paulo';
  if local_start::date <> local_end::date or not exists (
    select 1 from private.day_periods(local_start::date) p
    where local_start::time >= p.opens_at and local_end::time <= p.closes_at
      and mod(extract(epoch from (local_start::time - p.opens_at))::numeric,
        settings.slot_interval_minutes * 60) = 0
  ) then
    return unavailable;
  end if;
  date_text := to_char(local_start, 'YYYY-MM-DD');
  time_text := to_char(local_start, 'HH24:MI');

  for candidate in
    select st.id from public.stylists st
    where st.active and (p_stylist_id is null or st.id = p_stylist_id)
      and (select count(*) from public.stylist_services ss
        where ss.stylist_id = st.id and ss.active and ss.service_id = any(p_service_ids))
        = cardinality(p_service_ids)
      and not exists (select 1 from public.appointments a
        where a.performed_by = st.id and a.status in ('agendado', 'concluido')
          and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(p_starts_at, end_at, '[)'))
      and not exists (select 1 from private.day_blocks(local_start::date) b
        where (b.stylist_id is null or b.stylist_id = st.id)
          and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(p_starts_at, end_at, '[)'))
    order by st.sort_order, st.id
  loop
    -- Each attempt is atomic. A racing reservation rolls back the client and the
    -- items too; the exclusion constraints are the final arbiter.
    begin
      insert into public.clients (name, phone, email)
      values (btrim(p_name), phone_digits, btrim(p_email))
      on conflict (phone) do nothing returning id into client_id;
      if client_id is null then
        select c.id into client_id from public.clients c where c.phone = phone_digits;
      end if;
      new_appointment_id := gen_random_uuid()::text;
      insert into public.appointment_services (appointment_id, sort_order, service_id, service_name, duration, price)
      select new_appointment_id, r.r_order, r.r_id, r.r_name, r.r_duration, r.r_price
      from private.resolve_services(p_service_ids) r;
      insert into public.appointments (id, client_id, service_id, booked_with, performed_by,
        starts_at, ends_at, status, price, source)
      values (new_appointment_id, client_id, p_service_ids[1], p_stylist_id, candidate.id,
        p_starts_at, end_at, 'agendado', total_price, 'site');
      return jsonb_build_object('ok', true, 'slot', jsonb_build_object(
        'id', array_to_string(p_service_ids, '+') || ':' || candidate.id || ':' || date_text || ':' || time_text,
        'serviceId', p_service_ids[1], 'serviceIds', to_jsonb(p_service_ids),
        'stylistId', candidate.id, 'date', date_text, 'time', time_text,
        'startAt', to_char(p_starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
    exception when exclusion_violation or deadlock_detected then
      if p_stylist_id is not null then return unavailable; end if;
    end;
  end loop;
  return unavailable;
end;
$$;

-- The original single-service signature keeps working for older clients.
create or replace function public.create_public_booking(
  p_service_id text, p_stylist_id text, p_starts_at timestamptz,
  p_name text, p_phone text, p_email text
) returns jsonb
language sql volatile security definer set search_path = '' as $$
  select public.create_public_booking(array[p_service_id], p_stylist_id, p_starts_at,
    p_name, p_phone, p_email);
$$;
revoke all on function public.create_public_booking(text[], text, timestamptz, text, text, text)
from public, anon, authenticated;
grant execute on function public.create_public_booking(text[], text, timestamptz, text, text, text)
to anon, authenticated;

-- Panel writes. Definer so items can change atomically with the appointment;
-- authorization mirrors the appointments policies: owner for all, staff only
-- for their own appointments, never transferring them to someone else.
create function public.save_appointment(
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
  select * into me from public.staff_profiles where user_id = (select auth.uid());
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
revoke all on function public.save_appointment(text, text, text[], text, timestamptz,
  public.appointment_status, numeric, public.payment_method, text) from public, anon, authenticated;
grant execute on function public.save_appointment(text, text, text[], text, timestamptz,
  public.appointment_status, numeric, public.payment_method, text) to authenticated;

-- Commission rate for the team's reports; salon_settings stays owner-only.
create function public.get_staff_settings()
returns table (commission_rate numeric)
language sql stable security definer set search_path = '' as $$
  select s.demo_commission_rate from public.salon_settings s
  where s.id and exists (select 1 from public.staff_profiles p where p.user_id = (select auth.uid()));
$$;
revoke all on function public.get_staff_settings() from public, anon, authenticated;
grant execute on function public.get_staff_settings() to authenticated;

revoke all on function private.check_service_component(), private.appointments_sync_items(),
  private.appointment_services_sync() from public, anon, authenticated;
reset search_path;

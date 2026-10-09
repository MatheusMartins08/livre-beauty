-- Reservation codes that let clients look up and cancel their booking, and
-- consent to receive WhatsApp messages from the salon (LGPD).
set search_path = public, extensions;

-- Consent is recorded with its date and cleared when withdrawn.
alter table public.clients
  add column whatsapp_opt_in boolean not null default false,
  add column whatsapp_opt_in_at timestamptz,
  add constraint clients_whatsapp_opt_in_check
    check (whatsapp_opt_in = (whatsapp_opt_in_at is not null));

create function private.record_whatsapp_consent() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not new.whatsapp_opt_in then
    new.whatsapp_opt_in_at := null;
  elsif tg_op = 'INSERT' or not old.whatsapp_opt_in then
    new.whatsapp_opt_in_at := now();
  else
    new.whatsapp_opt_in_at := old.whatsapp_opt_in_at;
  end if;
  return new;
end;
$$;
create trigger clients_whatsapp_consent before insert or update on public.clients
for each row execute function private.record_whatsapp_consent();

-- Codes like LB-7KQ2MX, without 0/O, 1/I/L. Existing appointments receive one
-- through the column default, evaluated per row without firing triggers.
create function private.new_reservation_code() returns text
language sql volatile set search_path = '' as $$
  select 'LB-' || string_agg(
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::integer, 1), '')
  from generate_series(1, 6);
$$;
-- The default runs with the inserting role's privileges; visitors never insert.
revoke all on function private.new_reservation_code() from public, anon;
grant execute on function private.new_reservation_code() to authenticated;

alter table public.appointments
  add column code text not null default private.new_reservation_code(),
  add column client_cancelled_at timestamptz,
  add constraint appointments_code_key unique (code),
  add constraint appointments_code_check check (code ~ '^LB-[A-HJKMNP-Z2-9]{6}$');

-- New codes never repeat; a code never changes; reactivating an appointment
-- forgets that the client had cancelled it.
create function private.appointments_bookkeeping() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    new.code := old.code;
    if new.status <> 'cancelado' then new.client_cancelled_at := null; end if;
    return new;
  end if;
  while new.code is null or exists (select 1 from public.appointments a where a.code = new.code) loop
    new.code := private.new_reservation_code();
  end loop;
  return new;
end;
$$;
create trigger appointments_bookkeeping before insert or update on public.appointments
for each row execute function private.appointments_bookkeeping();

-- Clients cancel on the site up to this long before the start. Default: 24 h.
alter table public.salon_settings
  add column cancel_min_notice_minutes integer not null default 1440
    check (cancel_min_notice_minutes between 0 and 43200);

-- Accepts "lb-7kq2mx", "LB 7KQ2MX" or "7KQ2MX"; returns null when malformed.
create function private.normalize_reservation_code(p_code text) returns text
language sql immutable set search_path = '' as $$
  select case
    when c ~ '^LB[A-HJKMNP-Z2-9]{6}$' then 'LB-' || substr(c, 3)
    when c ~ '^[A-HJKMNP-Z2-9]{6}$' then 'LB-' || c
  end
  from (select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')) as c) x;
$$;

-- The appointment of a code, only when the phone matches its client.
create function private.find_reservation(p_code text, p_phone text) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  phone_digits text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  found_id text;
begin
  if phone_digits ~ '^55[0-9]{10,11}$' then phone_digits := substr(phone_digits, 3); end if;
  if phone_digits !~ '^[0-9]{10,11}$' then return null; end if;
  select a.id into found_id from public.appointments a
  join public.clients c on c.id = a.client_id
  where a.code = private.normalize_reservation_code(p_code) and c.phone = phone_digits;
  return found_id;
end;
$$;

-- What a client may see: no contact data, notes, payment or internal ids.
create function private.reservation_json(p_appointment_id text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'code', a.code,
    'status', a.status,
    'cancelledByClient', a.client_cancelled_at is not null,
    'services', (select coalesce(jsonb_agg(i.service_name order by i.sort_order), '[]'::jsonb)
      from public.appointment_services i where i.appointment_id = a.id),
    'stylistName', st.name,
    'date', to_char(a.starts_at at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
    'time', to_char(a.starts_at at time zone 'America/Sao_Paulo', 'HH24:MI'),
    'startAt', to_char(a.starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'durationMinutes', round(extract(epoch from a.ends_at - a.starts_at) / 60)::integer,
    'price', case when s.show_prices then a.price end,
    'cancelUntil', to_char((a.starts_at - make_interval(mins => s.cancel_min_notice_minutes))
      at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'canCancel', a.status = 'agendado'
      and now() <= a.starts_at - make_interval(mins => s.cancel_min_notice_minutes))
  from public.appointments a
  join public.stylists st on st.id = a.performed_by
  cross join public.salon_settings s
  where a.id = p_appointment_id and s.id;
$$;

create function public.get_reservation(p_code text, p_phone text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare found_id text := private.find_reservation(p_code, p_phone);
begin
  if found_id is null then
    return '{"ok":false,"code":"not_found","message":"Não encontramos uma reserva com esse código e esse celular."}';
  end if;
  return jsonb_build_object('ok', true, 'reservation', private.reservation_json(found_id));
end;
$$;

create function public.cancel_reservation(p_code text, p_phone text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  found_id text := private.find_reservation(p_code, p_phone);
  booking public.appointments%rowtype;
  notice integer;
begin
  if found_id is null then
    return '{"ok":false,"code":"not_found","message":"Não encontramos uma reserva com esse código e esse celular."}';
  end if;
  select * into booking from public.appointments where id = found_id for update;
  select cancel_min_notice_minutes into notice from public.salon_settings where id;
  if booking.status <> 'agendado' then
    return jsonb_build_object('ok', false, 'code', 'not_active',
      'message', 'Esta reserva não está mais ativa.', 'reservation', private.reservation_json(found_id));
  end if;
  if now() > booking.starts_at - make_interval(mins => coalesce(notice, 0)) then
    return jsonb_build_object('ok', false, 'code', 'too_late',
      'message', 'O prazo para cancelar pelo site terminou. Fale com o ateliê pelo WhatsApp.',
      'reservation', private.reservation_json(found_id));
  end if;
  update public.appointments set status = 'cancelado', client_cancelled_at = now()
  where id = found_id;
  return jsonb_build_object('ok', true, 'reservation', private.reservation_json(found_id));
end;
$$;

-- Same booking rules, now with WhatsApp consent and the reservation code.
-- Consent from the site only grants; withdrawing is done with the salon.
drop function public.create_public_booking(text[], text, timestamptz, text, text, text);
create function public.create_public_booking(
  p_service_ids text[], p_stylist_id text, p_starts_at timestamptz,
  p_name text, p_phone text, p_email text, p_whatsapp_opt_in boolean default false
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  settings public.salon_settings%rowtype;
  candidate record;
  client_id text;
  new_appointment_id text;
  new_code text;
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
    -- Each attempt is atomic. A racing reservation rolls back the client, the
    -- consent and the items too; the exclusion constraints are the final arbiter.
    begin
      insert into public.clients (name, phone, email, whatsapp_opt_in)
      values (btrim(p_name), phone_digits, btrim(p_email), coalesce(p_whatsapp_opt_in, false))
      on conflict (phone) do nothing returning id into client_id;
      if client_id is null then
        select c.id into client_id from public.clients c where c.phone = phone_digits;
        if coalesce(p_whatsapp_opt_in, false) then
          update public.clients set whatsapp_opt_in = true
          where id = client_id and not whatsapp_opt_in;
        end if;
      end if;
      new_appointment_id := gen_random_uuid()::text;
      insert into public.appointment_services (appointment_id, sort_order, service_id, service_name, duration, price)
      select new_appointment_id, r.r_order, r.r_id, r.r_name, r.r_duration, r.r_price
      from private.resolve_services(p_service_ids) r;
      insert into public.appointments (id, client_id, service_id, booked_with, performed_by,
        starts_at, ends_at, status, price, source)
      values (new_appointment_id, client_id, p_service_ids[1], p_stylist_id, candidate.id,
        p_starts_at, end_at, 'agendado', total_price, 'site')
      returning code into new_code;
      return jsonb_build_object('ok', true, 'slot', jsonb_build_object(
        'id', array_to_string(p_service_ids, '+') || ':' || candidate.id || ':' || date_text || ':' || time_text,
        'serviceId', p_service_ids[1], 'serviceIds', to_jsonb(p_service_ids),
        'stylistId', candidate.id, 'date', date_text, 'time', time_text,
        'startAt', to_char(p_starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'code', new_code));
    exception when exclusion_violation or deadlock_detected then
      if p_stylist_id is not null then return unavailable; end if;
    end;
  end loop;
  return unavailable;
end;
$$;

revoke all on function private.record_whatsapp_consent(), private.appointments_bookkeeping(),
  private.normalize_reservation_code(text), private.find_reservation(text, text),
  private.reservation_json(text) from public, anon, authenticated;
revoke all on function public.create_public_booking(text[], text, timestamptz, text, text, text, boolean),
  public.get_reservation(text, text), public.cancel_reservation(text, text)
  from public, anon, authenticated;
grant execute on function public.create_public_booking(text[], text, timestamptz, text, text, text, boolean),
  public.get_reservation(text, text), public.cancel_reservation(text, text) to anon, authenticated;
reset search_path;

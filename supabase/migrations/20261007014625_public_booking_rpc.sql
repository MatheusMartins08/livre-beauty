create function public.get_booked_ranges(p_date date, p_stylist_id text default null)
returns table (performed_by text, starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select a.performed_by, a.starts_at, a.ends_at from public.appointments a
  where a.status in ('agendado', 'concluido')
    and a.starts_at < ((p_date + 1)::timestamp at time zone 'America/Sao_Paulo')
    and a.ends_at > (p_date::timestamp at time zone 'America/Sao_Paulo')
    and (p_stylist_id is null or a.performed_by = p_stylist_id)
  order by a.starts_at, a.performed_by;
$$;

create function public.create_public_booking(
  p_service_id text, p_stylist_id text, p_starts_at timestamptz,
  p_name text, p_phone text, p_email text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  service public.services%rowtype;
  settings public.salon_settings%rowtype;
  hours public.business_hours%rowtype;
  candidate record;
  client_id text;
  phone_digits text;
  local_start timestamp := p_starts_at at time zone 'America/Sao_Paulo';
  local_end timestamp;
  end_at timestamptz;
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  date_text text;
  time_text text;
  unavailable constant jsonb := '{"ok":false,"code":"unavailable","message":"Este horário não está mais disponível. Escolha outro dia ou horário."}';
begin
  phone_digits := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if phone_digits ~ '^55[0-9]{10,11}$' then phone_digits := substr(phone_digits, 3); end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 100
    or p_phone is null or p_phone !~ '^[+()0-9[:space:].-]+$' or phone_digits !~ '^[0-9]{10,11}$'
    or p_email is null or char_length(btrim(p_email)) > 254
    or btrim(p_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return jsonb_build_object('ok', false, 'code', 'contact', 'message', 'Confira seus dados antes de continuar.');
  end if;
  select * into service from public.services where id = p_service_id and active;
  if not found then return unavailable; end if;
  select * into settings from public.salon_settings where id;
  if not found then return unavailable; end if;
  if p_starts_at is null or not isfinite(p_starts_at) or p_starts_at <= now()
    or local_start::date < today or local_start::date >= today + settings.booking_window_days then
    return unavailable;
  end if;
  end_at := p_starts_at + make_interval(mins => service.duration);
  local_end := end_at at time zone 'America/Sao_Paulo';
  select * into hours from public.business_hours where weekday = extract(dow from local_start);
  if not found or not hours.active or local_start::date <> local_end::date
    or local_start::time < hours.opens_at or local_end::time > hours.closes_at
    or mod(extract(epoch from (local_start::time - hours.opens_at))::numeric, settings.slot_interval_minutes * 60) <> 0 then
    return unavailable;
  end if;
  date_text := to_char(local_start, 'YYYY-MM-DD');
  time_text := to_char(local_start, 'HH24:MI');

  for candidate in
    select st.id from public.stylists st
    join public.stylist_services ss on ss.stylist_id = st.id
    where st.active and ss.active and ss.service_id = p_service_id
      and (p_stylist_id is null or st.id = p_stylist_id)
      and not exists (select 1 from public.appointments a
        where a.performed_by = st.id and a.status in ('agendado', 'concluido')
          and tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(p_starts_at, end_at, '[)'))
    order by st.sort_order, st.id
  loop
    -- Each attempt is atomic. A racing reservation rolls back the client insertion
    -- too; the exclusion constraints are the final arbiter, not the availability read.
    begin
      insert into public.clients (name, phone, email)
      values (btrim(p_name), phone_digits, btrim(p_email))
      on conflict (phone) do nothing returning id into client_id;
      if client_id is null then
        select c.id into client_id from public.clients c where c.phone = phone_digits;
      end if;
      insert into public.appointments (client_id, service_id, booked_with, performed_by,
        starts_at, ends_at, status, price, source)
      values (client_id, p_service_id, p_stylist_id, candidate.id,
        p_starts_at, end_at, 'agendado', service.price, 'site');
      return jsonb_build_object('ok', true, 'slot', jsonb_build_object(
        'id', p_service_id || ':' || candidate.id || ':' || date_text || ':' || time_text,
        'serviceId', p_service_id, 'stylistId', candidate.id, 'date', date_text,
        'time', time_text, 'startAt', to_char(p_starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));
    exception when exclusion_violation then
      if p_stylist_id is not null then return unavailable; end if;
    end;
  end loop;
  return unavailable;
end;
$$;
revoke all on function public.get_booked_ranges(date, text) from public, anon, authenticated;
revoke all on function public.create_public_booking(text, text, timestamptz, text, text, text) from public, anon, authenticated;
grant execute on function public.get_booked_ranges(date, text) to anon, authenticated;
grant execute on function public.create_public_booking(text, text, timestamptz, text, text, text) to anon, authenticated;

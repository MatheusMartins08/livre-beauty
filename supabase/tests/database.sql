-- Run with MCP execute_sql after catalog seed, on an empty DEVELOPMENT project.
-- All fixtures and public reservations are rolled back. Stop on any assertion failure.
begin;

insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');
insert into public.staff_profiles (user_id, role, stylist_id) values
  ('00000000-0000-4000-8000-000000000001', 'owner', 'lia'),
  ('00000000-0000-4000-8000-000000000002', 'staff', 'rafael');
insert into public.clients (id, name, phone, email) values
  ('test-client-lia', 'Teste Lia', '+55 (11) 98888-0001', 'lia@example.com'),
  ('test-client-rafael', 'Teste Rafael', '11988880002', 'rafael@example.com'),
  ('test-client-other', 'Teste Outro', '11988880003', 'outro@example.com');

-- A future Tuesday within the 30-day public booking window.
select set_config('livrebeauty.test_date', (
  (now() at time zone 'America/Sao_Paulo')::date +
  (9 - extract(dow from now() at time zone 'America/Sao_Paulo')::integer) % 7 + 7
)::text, true);
insert into public.appointments (id, client_id, service_id, booked_with, performed_by, starts_at, ends_at, price) values
  ('test-lia', 'test-client-lia', 'corte', 'lia', 'lia',
    (current_setting('livrebeauty.test_date')::date + time '09:00') at time zone 'America/Sao_Paulo',
    (current_setting('livrebeauty.test_date')::date + time '10:00') at time zone 'America/Sao_Paulo', 180),
  ('test-rafael', 'test-client-rafael', 'cor', 'rafael', 'rafael',
    (current_setting('livrebeauty.test_date')::date + time '09:00') at time zone 'America/Sao_Paulo',
    (current_setting('livrebeauty.test_date')::date + time '11:00') at time zone 'America/Sao_Paulo', 320);

do $$
declare
  start_time timestamptz := (current_setting('livrebeauty.test_date')::date + time '09:30') at time zone 'America/Sao_Paulo';
begin
  if (select count(*) from pg_tables where schemaname = 'public' and rowsecurity
      and tablename in ('services','stylists','stylist_services','business_hours','clients','appointments','staff_profiles','salon_settings')) <> 8 then
    raise exception 'Expected eight tables with RLS';
  end if;
  if (select count(*) from public.services) <> 6 or (select count(*) from public.stylists) <> 4 then
    raise exception 'Catalog seed counts differ';
  end if;
  begin
    insert into public.appointments (client_id, service_id, performed_by, starts_at, ends_at, price)
    values ('test-client-other', 'corte', 'lia', start_time, start_time + interval '1 hour', 180);
    raise exception 'Stylist overlap was accepted';
  exception when exclusion_violation then null; end;
  begin
    insert into public.appointments (client_id, service_id, performed_by, starts_at, ends_at, price)
    values ('test-client-lia', 'corte', 'marina', start_time, start_time + interval '1 hour', 180);
    raise exception 'Client overlap was accepted';
  exception when exclusion_violation then null; end;
  begin
    insert into public.appointments (client_id, service_id, performed_by, starts_at, ends_at, price)
    values ('test-client-other', 'extensoes', 'lia', start_time, start_time + interval '4 hours', 980);
    raise exception 'Unsupported service was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.appointments (client_id, service_id, performed_by, starts_at, ends_at, price)
    values ('test-client-other', 'corte', 'lia', start_time + interval '10 hours', start_time + interval '11 hours', 180);
    raise exception 'Outside opening hours was accepted';
  exception when check_violation then null; end;
  -- Adjacent half-open ranges are allowed; cancellation releases the slot.
  insert into public.appointments (id, client_id, service_id, performed_by, starts_at, ends_at, price)
  values ('test-adjacent', 'test-client-other', 'corte', 'lia', start_time + interval '30 minutes', start_time + interval '90 minutes', 180);
  update public.appointments set status = 'cancelado' where id = 'test-adjacent';
  insert into public.appointments (id, client_id, service_id, performed_by, starts_at, ends_at, price)
  values ('test-replacement', 'test-client-other', 'corte', 'lia', start_time + interval '30 minutes', start_time + interval '90 minutes', 180);
  begin
    update public.appointments set status = 'agendado' where id = 'test-adjacent';
    raise exception 'Conflicting reactivation was accepted';
  exception when exclusion_violation then null; end;
end;
$$;

set local role anon;
do $$
declare
  booking jsonb;
  start_time timestamptz := (current_setting('livrebeauty.test_date')::date + time '14:00') at time zone 'America/Sao_Paulo';
begin
  if exists (select 1 from public.clients) or exists (select 1 from public.appointments) then
    raise exception 'Anon can see personal data';
  end if;
  if (select count(*) from public.business_hours) <> 5 then raise exception 'Anon sees closed days'; end if;
  if public.create_public_booking('corte', 'lia', start_time, 'A', 'bad', 'bad')->>'code' <> 'contact' then
    raise exception 'Invalid contact was accepted';
  end if;
  if public.create_public_booking('corte', 'lia', start_time + interval '5 minutes', 'Teste', '11977770000', 'teste@example.com')->>'code' <> 'unavailable' then
    raise exception 'Off-grid slot was accepted';
  end if;
  booking := public.create_public_booking('corte', 'lia', start_time, 'Teste Publico', '11977770001', 'publico@example.com');
  if booking->>'ok' <> 'true' or booking->'slot'->>'stylistId' <> 'lia'
    or booking->'slot'->>'time' <> '14:00' or booking->'slot'->>'startAt' <> to_char(start_time at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') then
    raise exception 'Public booking shape or timezone differs: %', booking;
  end if;
  booking := public.create_public_booking('corte', null, start_time, 'Teste Livre', '11977770002', 'livre@example.com');
  if booking->>'ok' <> 'true' or booking->'slot'->>'stylistId' <> 'marina' then
    raise exception 'No-preference fallback failed: %', booking;
  end if;
  if public.create_public_booking('corte', 'lia', start_time, 'Teste Conflito', '11977770003', 'conflito@example.com')->>'code' <> 'unavailable' then
    raise exception 'Duplicate public booking accepted';
  end if;
  if public.create_public_booking('tratamento', 'rafael', start_time, 'Nome alterado', '11977770001', 'alterado@example.com')->>'code' <> 'unavailable' then
    raise exception 'Public client overlap accepted';
  end if;
  booking := public.create_public_booking('tratamento', 'rafael', start_time + interval '2 hours', 'Nome alterado', '+55 (11) 97777-0001', 'alterado@example.com');
  if booking->>'ok' <> 'true' then raise exception 'Existing client reuse failed: %', booking; end if;
  if not exists (select 1 from public.get_booked_ranges(current_setting('livrebeauty.test_date')::date, 'lia') where starts_at = start_time) then
    raise exception 'Booked ranges missing reservation';
  end if;
end;
$$;
reset role;
do $$
begin
  if exists (select 1 from public.clients where phone = '11977770003') then
    raise exception 'Failed booking left orphan client';
  end if;
  if not exists (select 1 from public.clients where phone = '11977770001' and name = 'Teste Publico' and email = 'publico@example.com') then
    raise exception 'Public booking overwrote existing contact';
  end if;
  if (select count(*) from public.clients where phone = '11977770001') <> 1 then raise exception 'Phone normalization duplicated client'; end if;
  if not exists (select 1 from public.appointments a join public.clients c on c.id = a.client_id
    where c.phone = '11977770001' and a.source = 'site' and a.status = 'agendado'
      and a.price = 180 and a.ends_at - a.starts_at = interval '1 hour') then
    raise exception 'Public source, price or duration differs';
  end if;
end;
$$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
do $$
declare row_count integer;
begin
  if private.is_owner() or private.current_stylist_id() <> 'rafael' then raise exception 'Staff identity failed'; end if;
  if (select count(*) from public.appointments) <> 2 or exists (select 1 from public.appointments where performed_by <> 'rafael') then
    raise exception 'Staff sees other appointments';
  end if;
  if (select count(*) from public.clients) <> 2 or exists (select 1 from public.clients where id <> 'test-client-rafael' and phone <> '11977770001') then
    raise exception 'Staff sees unrelated clients';
  end if;
  if (select count(*) from public.staff_profiles) <> 1 or exists (select 1 from public.salon_settings) then
    raise exception 'Staff sees private settings or other profiles';
  end if;
  update public.appointments set notes = 'Atualização da equipe' where id = 'test-rafael';
  get diagnostics row_count = row_count;
  if row_count <> 1 then raise exception 'Staff cannot update own appointment'; end if;
  insert into public.appointments (id, client_id, service_id, performed_by, starts_at, ends_at, price)
  values ('test-staff-create', 'test-client-rafael', 'cor', 'rafael',
    (current_setting('livrebeauty.test_date')::date + time '12:00') at time zone 'America/Sao_Paulo',
    (current_setting('livrebeauty.test_date')::date + time '14:00') at time zone 'America/Sao_Paulo', 320);
  if not exists (select 1 from public.appointments where id = 'test-staff-create') then raise exception 'Staff cannot create own appointment'; end if;
  begin
    insert into public.appointments (client_id, service_id, performed_by, starts_at, ends_at, price)
    values ('test-client-rafael', 'tratamento', 'lia',
      (current_setting('livrebeauty.test_date')::date + time '17:00') at time zone 'America/Sao_Paulo',
      (current_setting('livrebeauty.test_date')::date + time '18:00') at time zone 'America/Sao_Paulo', 160);
    raise exception 'Staff created another stylist appointment';
  exception when insufficient_privilege then null; end;
  begin
    update public.appointments set performed_by = 'lia', service_id = 'tratamento' where id = 'test-rafael';
    raise exception 'Staff reassigned appointment';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.clients (name, phone, email) values ('Proibido', '11966660000', 'proibido@example.com');
    raise exception 'Staff created client';
  exception when insufficient_privilege then null; end;
  update public.clients set notes = 'Proibido' where id = 'test-client-rafael';
  get diagnostics row_count = row_count;
  if row_count <> 0 then raise exception 'Staff edited client'; end if;
  begin
    update public.staff_profiles set role = 'owner' where user_id = '00000000-0000-4000-8000-000000000002';
    get diagnostics row_count = row_count;
    if row_count <> 0 then raise exception 'Staff escalated role'; end if;
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if not private.is_owner() or not exists (select 1 from public.salon_settings) then raise exception 'Owner access failed'; end if;
  update public.appointments set performed_by = 'marina' where id = 'test-lia';
  if not exists (select 1 from public.appointments where id = 'test-lia' and performed_by = 'marina') then raise exception 'Owner cannot reassign'; end if;
  begin
    delete from public.appointments where id = 'test-lia';
    raise exception 'Owner deleted appointment';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;
rollback;

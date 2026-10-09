-- Site editor, opening hours and multi-service booking. Run with execute_sql
-- after database.sql, on a DEVELOPMENT project with the catalog seed.
-- Everything is rolled back. Stop on any assertion failure.
begin;

insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000011'),
  ('00000000-0000-4000-8000-000000000012');
insert into public.staff_profiles (user_id, role, stylist_id) values
  ('00000000-0000-4000-8000-000000000011', 'owner', null),
  ('00000000-0000-4000-8000-000000000012', 'staff', 'marina');
insert into public.clients (id, name, phone, email) values
  ('test-editor-client', 'Teste Editor', '11988881001', 'editor@example.com'),
  ('test-editor-other', 'Teste Editor Dois', '11988881002', 'editor2@example.com');
-- A combo of two services, offered by Lia.
insert into public.services (id, slug, name, category, description, duration, price, image, sort_order) values
  ('test-combo', 'test-combo', 'Corte e tratamento', 'Combos', 'Combo de teste.', 120, 300, '/images/service-haircut.jpg', 9);
insert into public.service_components (service_id, component_id, sort_order) values
  ('test-combo', 'corte', 1), ('test-combo', 'tratamento', 2);
insert into public.stylist_services (stylist_id, service_id) values ('lia', 'test-combo');

-- A future Wednesday within the 30-day public booking window.
select set_config('livrebeauty.test_date', (
  (now() at time zone 'America/Sao_Paulo')::date +
  (10 - extract(dow from now() at time zone 'America/Sao_Paulo')::integer) % 7 + 7
)::text, true);
create function pg_temp.at_time(value text) returns timestamptz language sql stable as $$
  select (current_setting('livrebeauty.test_date')::date + value::time) at time zone 'America/Sao_Paulo'
$$;

do $$
declare
  test_day date := current_setting('livrebeauty.test_date')::date;
begin
  if (select count(*) from pg_tables where schemaname = 'public' and rowsecurity
      and tablename in ('site_content','opening_periods','schedule_exceptions',
        'service_components','appointment_services')) <> 5 then
    raise exception 'Expected RLS on the five new tables';
  end if;
  if (select count(*) from public.opening_periods) <> 5 then
    raise exception 'Weekly periods were not seeded from business_hours';
  end if;
  begin
    insert into public.opening_periods (weekday, opens_at, closes_at) values (3, '18:00', '20:00');
    raise exception 'Overlapping period was accepted';
  exception when exclusion_violation then null; end;
  begin
    insert into public.service_components (service_id, component_id) values ('corte', 'test-combo');
    raise exception 'Nested combo was accepted';
  exception when check_violation then null; end;

  -- Closed salon day, special hours and blocks.
  insert into public.schedule_exceptions (kind, starts_on, ends_on, reason)
  values ('fechado', test_day, test_day, 'Feriado');
  if exists (select 1 from public.get_opening_calendar(test_day, test_day)) then
    raise exception 'Closed day still has periods';
  end if;
  delete from public.schedule_exceptions where reason = 'Feriado';
  insert into public.schedule_exceptions (kind, starts_on, ends_on, opens_at, closes_at, reason)
  values ('horario_especial', test_day, test_day, '10:00', '14:00', 'Evento');
  if (select count(*) from public.get_opening_calendar(test_day, test_day)
      where opens_at = '10:00' and closes_at = '14:00') <> 1
    or (select count(*) from public.get_opening_calendar(test_day, test_day)) <> 1 then
    raise exception 'Special hours did not replace the weekly periods';
  end if;
  begin
    insert into public.appointments (client_id, service_id, performed_by, starts_at, ends_at, price)
    values ('test-editor-client', 'corte', 'lia', pg_temp.at_time('15:00'), pg_temp.at_time('16:00'), 180);
    raise exception 'Appointment outside special hours was accepted';
  exception when check_violation then null; end;
  delete from public.schedule_exceptions where reason = 'Evento';
  insert into public.schedule_exceptions (kind, stylist_id, starts_on, ends_on, opens_at, closes_at, reason)
  values ('bloqueio', 'lia', test_day, test_day, '12:00', '13:00', 'Almoço');
  insert into public.schedule_exceptions (kind, stylist_id, starts_on, ends_on, reason)
  values ('fechado', 'rafael', test_day, test_day, 'Folga');
  begin
    insert into public.appointments (client_id, service_id, performed_by, starts_at, ends_at, price)
    values ('test-editor-client', 'corte', 'lia', pg_temp.at_time('12:00'), pg_temp.at_time('13:00'), 180);
    raise exception 'Blocked professional was booked';
  exception when check_violation then null; end;
  if not exists (select 1 from public.get_booked_ranges(test_day, 'lia')
      where performed_by = 'lia' and starts_at = pg_temp.at_time('12:00'))
    or not exists (select 1 from public.get_booked_ranges(test_day)
      where performed_by = 'rafael' and starts_at = pg_temp.at_time('00:00')) then
    raise exception 'Blocks missing from booked ranges';
  end if;
end;
$$;

-- Deferred item sync for direct single-service writes.
insert into public.appointments (id, client_id, service_id, performed_by, starts_at, ends_at, price)
values ('test-direct', 'test-editor-other', 'corte', 'marina', pg_temp.at_time('09:00'), pg_temp.at_time('10:00'), 150);
set constraints all immediate;
do $$
begin
  if not exists (select 1 from public.appointment_services where appointment_id = 'test-direct'
      and sort_order = 1 and service_id = 'corte' and service_name = 'Corte autoral'
      and duration = 60 and price = 150) then
    raise exception 'Direct insert did not create its item';
  end if;
  update public.appointments set service_id = 'tratamento' where id = 'test-direct';
end;
$$;
set constraints all immediate;
do $$
begin
  if not exists (select 1 from public.appointment_services where appointment_id = 'test-direct'
      and service_id = 'tratamento' and service_name = 'Ritual de tratamento') then
    raise exception 'Service change did not update the single item';
  end if;
end;
$$;
set constraints all deferred;

set local role anon;
do $$
declare
  booking jsonb;
  denied boolean := false;
begin
  if (select count(*) from public.opening_periods) <> 5 then raise exception 'Anon cannot read hours'; end if;
  begin
    perform 1 from public.schedule_exceptions;
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'Anon can read exception reasons'; end if;
  begin
    insert into public.site_content (key, content) values ('hero', '{}');
    raise exception 'Anon wrote site content';
  exception when insufficient_privilege then null; end;
  booking := public.create_public_booking(array['corte', 'tratamento'], 'lia', pg_temp.at_time('14:00'),
    'Teste Multi', '11977771001', 'multi@example.com');
  if booking->>'ok' <> 'true' or booking->'slot'->>'stylistId' <> 'lia'
    or booking->'slot'->'serviceIds' <> '["corte", "tratamento"]'::jsonb
    or booking->'slot'->>'serviceId' <> 'corte' then
    raise exception 'Multi-service booking failed: %', booking;
  end if;
  if public.create_public_booking(array['test-combo', 'corte'], null, pg_temp.at_time('16:30'),
      'Teste Combo', '11977771002', 'combo@example.com')->>'code' <> 'services' then
    raise exception 'Combo with its own part was accepted';
  end if;
  if public.create_public_booking(array['corte', 'corte'], null, pg_temp.at_time('16:30'),
      'Teste Repetido', '11977771003', 'repetido@example.com')->>'code' <> 'services' then
    raise exception 'Repeated service was accepted';
  end if;
  if public.create_public_booking(array['corte', 'cor'], null, pg_temp.at_time('16:30'),
      'Teste Sem', '11977771004', 'sem@example.com')->>'code' <> 'unavailable' then
    raise exception 'No professional offers both services, yet booking succeeded';
  end if;
  if public.create_public_booking(array['corte'], 'lia', pg_temp.at_time('12:00'),
      'Teste Bloqueio', '11977771005', 'bloqueio@example.com')->>'code' <> 'unavailable' then
    raise exception 'Blocked time was booked';
  end if;
  if public.create_public_booking(array['cor'], 'rafael', pg_temp.at_time('10:00'),
      'Teste Folga', '11977771006', 'folga@example.com')->>'code' <> 'unavailable' then
    raise exception 'Professional day off was booked';
  end if;
  booking := public.create_public_booking(array['corte'], null, pg_temp.at_time('12:00'),
    'Teste Livre', '11977771007', 'livre2@example.com');
  if booking->>'ok' <> 'true' or booking->'slot'->>'stylistId' <> 'marina' then
    raise exception 'No-preference booking did not skip the blocked professional: %', booking;
  end if;
  booking := public.create_public_booking(array['test-combo'], null, pg_temp.at_time('16:00'),
    'Teste Combo Ok', '11977771008', 'combo-ok@example.com');
  if booking->>'ok' <> 'true' or booking->'slot'->>'stylistId' <> 'lia' then
    raise exception 'Combo booking failed: %', booking;
  end if;
  booking := public.create_public_booking('tratamento', 'sofia', pg_temp.at_time('10:00'),
    'Teste Legado', '11977771009', 'legado@example.com');
  if booking->>'ok' <> 'true' then raise exception 'Legacy signature failed: %', booking; end if;
end;
$$;
reset role;
set constraints all immediate;
do $$
begin
  if not exists (
    select 1 from public.appointments a join public.clients c on c.id = a.client_id
    where c.phone = '11977771001' and a.price = 340 and a.service_id = 'corte'
      and a.ends_at - a.starts_at = interval '2 hours'
      and (select count(*) from public.appointment_services i where i.appointment_id = a.id) = 2
      and exists (select 1 from public.appointment_services i
        where i.appointment_id = a.id and i.sort_order = 2 and i.service_id = 'tratamento')
  ) then
    raise exception 'Multi-service appointment totals or items differ';
  end if;
  if exists (select 1 from public.clients where phone in ('11977771002', '11977771003', '11977771004', '11977771005', '11977771006')) then
    raise exception 'Rejected booking left an orphan client';
  end if;
end;
$$;
set constraints all deferred;

-- Owner editing through the API role.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000011","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  result text;
  duration interval;
begin
  insert into public.site_content (key, content) values ('hero', '{"eyebrow":"Teste"}')
  on conflict (key) do update set content = excluded.content;
  result := public.save_service('test-novo', 'test-novo', 'Escova teste', 'Finalização',
    'Descrição do teste.', 'Resumo.', 45, 90, '/images/service-styling.jpg', '50% 40%',
    null, '', '50% 50%', true, array['marina', 'sofia'], '{}');
  if result <> 'test-novo' or (select count(*) from public.stylist_services where service_id = 'test-novo') <> 2 then
    raise exception 'save_service did not create the service and its links';
  end if;
  perform public.save_service('test-novo', null, 'Escova teste', 'Finalização',
    'Descrição do teste.', 'Resumo.', 45, 95, '/images/service-styling.jpg', '50% 40%',
    null, '', '50% 50%', true, array['sofia'], '{}');
  if (select price from public.services where id = 'test-novo') <> 95
    or exists (select 1 from public.stylist_services where service_id = 'test-novo' and stylist_id = 'marina') then
    raise exception 'save_service did not update the service or remove a link';
  end if;
  begin
    perform public.save_service('test-ruim', 'test-ruim', 'Imagem ruim', 'Teste', 'Descrição.', '',
      30, 10, 'javascript:alert(1)', '50% 50%', null, '', '50% 50%', true, '{}', '{}');
    raise exception 'Unsafe image URL was accepted';
  exception when check_violation then null; end;
  result := public.save_appointment('test-panel', 'test-editor-other', array['finalizacao', 'tratamento'],
    'sofia', pg_temp.at_time('15:00'), 'agendado', 280, null, 'Duas etapas');
  if (select ends_at - starts_at from public.appointments where id = 'test-panel') <> interval '2 hours'
    or (select count(*) from public.appointment_services where appointment_id = 'test-panel') <> 2 then
    raise exception 'Panel multi-service appointment differs';
  end if;
  update public.services set duration = 90 where id = 'finalizacao';
  perform public.save_appointment('test-panel', 'test-editor-other', array['finalizacao', 'tratamento'],
    'sofia', pg_temp.at_time('16:00'), 'agendado', 280, 'pix', 'Movido');
  select ends_at - starts_at into duration from public.appointments where id = 'test-panel';
  if duration <> interval '2 hours' then
    raise exception 'Moving an appointment changed its booked duration: %', duration;
  end if;
  begin
    perform public.save_appointment('test-panel-bad', 'test-editor-other', array['cor'],
      'sofia', pg_temp.at_time('17:00'), 'agendado', 100, null, '');
    raise exception 'Panel accepted a service the professional does not offer';
  exception when check_violation then null; end;
  perform public.reorder_catalog('stylists', array['sofia', 'marina', 'rafael', 'lia']);
  if (select sort_order from public.stylists where id = 'sofia') <> 0
    or (select sort_order from public.stylists where id = 'lia') <> 3 then
    raise exception 'reorder_catalog did not reorder';
  end if;
  perform public.save_stylist('test-pro', 'test-pro', 'Profissional Teste', 'Stylist', 3,
    array['Cortes'], 'Descrição.', 'Biografia.', '/images/stylist-01.jpg', '50% 30%', true, array['corte']);
  -- Separate statements: a query does not see changes made by its own function calls.
  result := public.delete_stylist('test-pro');
  if result <> 'deleted' or exists (select 1 from public.stylists where id = 'test-pro') then
    raise exception 'Stylist without history was not deleted';
  end if;
  if public.delete_service('test-novo') <> 'deleted' then raise exception 'Unused service was not deleted'; end if;
  result := public.delete_service('tratamento');
  if result <> 'archived'
    or not exists (select 1 from public.services where id = 'tratamento' and not active and deleted_at is not null) then
    raise exception 'Service with history was not archived';
  end if;
  begin
    perform public.save_opening_periods('[{"weekday":2,"opens_at":"09:00","closes_at":"13:00"},{"weekday":2,"opens_at":"12:00","closes_at":"18:00"}]');
    raise exception 'Overlapping week was accepted';
  exception when exclusion_violation then null; end;
  perform public.save_opening_periods('[{"weekday":2,"opens_at":"09:00","closes_at":"12:00"},{"weekday":2,"opens_at":"13:00","closes_at":"19:00"},{"weekday":3,"opens_at":"09:00","closes_at":"19:00"}]');
  if (select count(*) from public.opening_periods) <> 3 then raise exception 'save_opening_periods failed'; end if;
end;
$$;
reset role;

-- Staff cannot edit the site or other professionals' appointments.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000012","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  begin
    insert into public.site_content (key, content) values ('about', '{}');
    raise exception 'Staff wrote site content';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_service('test-staff', 'test-staff', 'Serviço', 'Teste', 'Descrição.', '',
      30, 10, '/images/service-haircut.jpg', '50% 50%', null, '', '50% 50%', true, '{}', '{}');
    raise exception 'Staff saved a service';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_appointment('test-panel', 'test-editor-other', array['finalizacao', 'tratamento'],
      'marina', pg_temp.at_time('16:00'), 'cancelado', 0, null, '');
    raise exception 'Staff took over another appointment';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_appointment('test-staff-other', 'test-editor-other', array['finalizacao'],
      'sofia', pg_temp.at_time('17:00'), 'agendado', 140, null, '');
    raise exception 'Staff created an appointment for someone else';
  exception when insufficient_privilege then null; end;
  if public.save_appointment('test-staff-own', 'test-editor-client', array['corte'],
      'marina', pg_temp.at_time('17:00'), 'agendado', 180, null, '') <> 'test-staff-own' then
    raise exception 'Staff cannot create their own appointment';
  end if;
  -- Lia's lunch and Rafael's day off exist, but belong to other professionals.
  if exists (select 1 from public.schedule_exceptions where stylist_id is distinct from 'marina'
      and stylist_id is not null) then
    raise exception 'Staff reads other professionals'' exceptions';
  end if;
  if exists (select 1 from public.appointment_services i join public.appointments a on a.id = i.appointment_id
      where a.performed_by <> 'marina') then
    raise exception 'Staff sees items of other appointments';
  end if;
  if (select commission_rate from public.get_staff_settings()) <> 0.5 then
    raise exception 'Staff settings missing';
  end if;
end;
$$;
reset role;
set constraints all immediate;
rollback;

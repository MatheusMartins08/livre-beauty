-- Individual access and hours per professional. Run with execute_sql after
-- database.sql and site_editor.sql, on a DEVELOPMENT project with the catalog
-- seed. Everything is rolled back. Stop on any assertion failure.
begin;

insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000021'),
  ('00000000-0000-4000-8000-000000000022'),
  ('00000000-0000-4000-8000-000000000023');
insert into public.staff_profiles (user_id, role, stylist_id, login, active) values
  ('00000000-0000-4000-8000-000000000021', 'owner', null, null, true),
  ('00000000-0000-4000-8000-000000000022', 'staff', 'marina', 'marina.alves', true),
  ('00000000-0000-4000-8000-000000000023', 'staff', 'rafael', 'rafael', false);
insert into public.clients (id, name, phone, email) values
  ('test-staff-client', 'Teste Equipe', '11988882001', 'equipe@example.com');

-- A future Thursday within the 30-day public booking window.
select set_config('livrebeauty.test_date', (
  (now() at time zone 'America/Sao_Paulo')::date +
  (11 - extract(dow from now() at time zone 'America/Sao_Paulo')::integer) % 7 + 7
)::text, true);
create function pg_temp.at_time(value text, days integer default 0) returns timestamptz
language sql stable as $$
  select (current_setting('livrebeauty.test_date')::date + days + value::time)
    at time zone 'America/Sao_Paulo'
$$;

do $$
begin
  begin
    insert into public.staff_profiles (user_id, role, stylist_id, login)
    values ('00000000-0000-4000-8000-000000000024', 'staff', 'sofia', 'Sofia Dias');
    raise exception 'Invalid login format was accepted';
  exception when check_violation then null; end;
  begin
    update public.staff_profiles set active = false
    where user_id = '00000000-0000-4000-8000-000000000021';
    raise exception 'Owner account was deactivated';
  exception when check_violation then null; end;
end;
$$;

-- The owner sets Marina's week: Thursday afternoons only. A salon period and
-- a professional period may overlap on the same weekday.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000021","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  perform public.save_opening_periods('[{"weekday":4,"opens_at":"13:00","closes_at":"19:00"}]', 'marina');
  perform public.save_opening_periods('[{"weekday":4,"opens_at":"09:00","closes_at":"12:00"}]', 'lia');
  if (select count(*) from public.opening_periods where stylist_id is null) <> 5
    or (select count(*) from public.opening_periods where stylist_id is not null) <> 2 then
    raise exception 'Professional weeks changed the salon week';
  end if;
  begin
    perform public.save_opening_periods('[{"weekday":4,"opens_at":"13:00","closes_at":"16:00"},{"weekday":4,"opens_at":"15:00","closes_at":"19:00"}]', 'marina');
    raise exception 'Overlapping professional periods were accepted';
  exception when exclusion_violation then null; end;
end;
$$;
reset role;

do $$
declare test_day date := current_setting('livrebeauty.test_date')::date;
begin
  -- Outside 13:00–19:00 Marina is blocked; the next day she has no period at all.
  if not exists (select 1 from public.get_booked_ranges(test_day, 'marina')
      where performed_by = 'marina' and starts_at = pg_temp.at_time('00:00') and ends_at = pg_temp.at_time('13:00'))
    or not exists (select 1 from public.get_booked_ranges(test_day, 'marina')
      where performed_by = 'marina' and starts_at = pg_temp.at_time('19:00') and ends_at = pg_temp.at_time('00:00', 1))
    or not exists (select 1 from public.get_booked_ranges(test_day + 1, 'marina')
      where performed_by = 'marina' and starts_at = pg_temp.at_time('00:00', 1) and ends_at = pg_temp.at_time('00:00', 2)) then
    raise exception 'Own hours missing from booked ranges';
  end if;
  if exists (select 1 from public.get_booked_ranges(test_day, 'sofia') where performed_by = 'sofia') then
    raise exception 'A professional without own hours was blocked';
  end if;
  begin
    insert into public.appointments (client_id, service_id, performed_by, starts_at, ends_at, price)
    values ('test-staff-client', 'corte', 'marina', pg_temp.at_time('10:00'), pg_temp.at_time('11:00'), 180);
    raise exception 'Appointment outside own hours was accepted';
  exception when check_violation then null; end;
end;
$$;

set local role anon;
do $$
declare booking jsonb;
begin
  if (select count(*) from public.opening_periods) <> 5 then
    raise exception 'Anon reads professional hours';
  end if;
  if public.create_public_booking(array['corte'], 'marina', pg_temp.at_time('10:00'),
      'Teste Fora', '11977772001', 'fora@example.com')->>'code' <> 'unavailable' then
    raise exception 'Public booking outside own hours was accepted';
  end if;
  booking := public.create_public_booking(array['corte'], 'marina', pg_temp.at_time('14:00'),
    'Teste Dentro', '11977772002', 'dentro@example.com');
  if booking->>'ok' <> 'true' then raise exception 'Booking inside own hours failed: %', booking; end if;
  -- Lia works only mornings now; without preference at 15:00 nobody offers a cut.
  if public.create_public_booking(array['corte'], null, pg_temp.at_time('15:00'),
      'Teste Livre', '11977772003', 'livre3@example.com')->>'code' <> 'unavailable' then
    raise exception 'No-preference booking ignored own hours';
  end if;
end;
$$;
reset role;

-- Marina edits only her own week and exceptions.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000022","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  test_day date := current_setting('livrebeauty.test_date')::date;
  row_count integer;
begin
  if exists (select 1 from public.opening_periods where stylist_id = 'lia') then
    raise exception 'Staff reads another professional''s hours';
  end if;
  perform public.save_opening_periods('[{"weekday":4,"opens_at":"12:00","closes_at":"19:00"}]', 'marina');
  if not exists (select 1 from public.opening_periods where stylist_id = 'marina' and opens_at = '12:00') then
    raise exception 'Staff cannot save own week';
  end if;
  begin
    perform public.save_opening_periods('[]', 'lia');
    raise exception 'Staff saved another professional''s week';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_opening_periods('[]');
    raise exception 'Staff saved the salon week';
  exception when insufficient_privilege then null; end;
  insert into public.schedule_exceptions (kind, stylist_id, starts_on, ends_on, opens_at, closes_at, reason)
  values ('horario_especial', 'marina', test_day + 7, test_day + 7, '10:00', '12:00', 'Curso');
  begin
    insert into public.schedule_exceptions (kind, stylist_id, starts_on, ends_on, reason)
    values ('fechado', 'lia', test_day, test_day, 'Proibido');
    raise exception 'Staff created another professional''s day off';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.schedule_exceptions (kind, stylist_id, starts_on, ends_on, reason)
    values ('fechado', null, test_day, test_day, 'Proibido');
    raise exception 'Staff closed the salon';
  exception when insufficient_privilege then null; end;
  update public.opening_periods set opens_at = '08:00' where stylist_id = 'lia';
  get diagnostics row_count = row_count;
  if row_count <> 0 then raise exception 'Staff edited another professional''s hours'; end if;
end;
$$;
reset role;

do $$
declare test_day date := current_setting('livrebeauty.test_date')::date;
begin
  -- Special hours replace Marina's week on that date.
  if not exists (select 1 from public.get_booked_ranges(test_day + 7, 'marina')
      where performed_by = 'marina' and starts_at = pg_temp.at_time('12:00', 7)
        and ends_at = pg_temp.at_time('00:00', 8)) then
    raise exception 'Own special hours did not replace the week';
  end if;
end;
$$;

-- An empty week brings Marina back to the salon's hours.
set local role authenticated;
do $$
begin
  perform public.save_opening_periods('[]', 'marina');
  delete from public.schedule_exceptions where stylist_id = 'marina';
end;
$$;
reset role;
do $$
begin
  if exists (select 1 from public.get_booked_ranges(current_setting('livrebeauty.test_date')::date, 'marina')
      where performed_by = 'marina' and ends_at - starts_at > interval '2 hours') then
    raise exception 'Reset did not restore the salon hours';
  end if;
end;
$$;

-- A deactivated account loses access at once, even with a valid token.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000023","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if private.current_stylist_id() is not null or private.is_owner() then
    raise exception 'Inactive account kept its identity';
  end if;
  if exists (select 1 from public.appointments) or exists (select 1 from public.clients) then
    raise exception 'Inactive account reads private data';
  end if;
  if exists (select 1 from public.get_staff_settings()) then
    raise exception 'Inactive account reads staff settings';
  end if;
  begin
    perform public.save_appointment('test-inactive', 'test-staff-client', array['cor'], 'rafael',
      pg_temp.at_time('16:00'), 'agendado', 320, null, '');
    raise exception 'Inactive account saved an appointment';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_opening_periods('[]', 'rafael');
    raise exception 'Inactive account saved hours';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;
rollback;

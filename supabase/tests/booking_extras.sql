-- "Mais pedido", WhatsApp consent, reservation codes and history retention.
-- Run with execute_sql after the other SQL tests, on a DEVELOPMENT project
-- with the catalog seed. Everything is rolled back. Stop on any failure.
begin;

insert into auth.users (id) values
  ('00000000-0000-4000-8000-000000000031'),
  ('00000000-0000-4000-8000-000000000032');
insert into public.staff_profiles (user_id, role, stylist_id) values
  ('00000000-0000-4000-8000-000000000031', 'owner', null),
  ('00000000-0000-4000-8000-000000000032', 'staff', 'sofia');

-- A future Friday within the 30-day public booking window.
select set_config('livrebeauty.test_date', (
  (now() at time zone 'America/Sao_Paulo')::date +
  (12 - extract(dow from now() at time zone 'America/Sao_Paulo')::integer) % 7 + 7
)::text, true);
create function pg_temp.at_time(value text) returns timestamptz language sql stable as $$
  select (current_setting('livrebeauty.test_date')::date + value::time) at time zone 'America/Sao_Paulo'
$$;

-- Popular services, through the owner's editor function.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  perform public.save_service('corte', null, 'Corte autoral', 'Cortes', 'Descrição.', '', 60, 180,
    '/images/service-haircut.jpg', '50% 50%', null, '', '50% 50%', true, array['lia', 'marina'], '{}', true);
  if not (select popular from public.services where id = 'corte') then
    raise exception 'Popular flag was not saved';
  end if;
end;
$$;
reset role;

-- Public booking: consent, reservation code and lookup.
set local role anon;
do $$
declare
  booking jsonb;
  reservation jsonb;
begin
  booking := public.create_public_booking(array['corte'], 'lia', pg_temp.at_time('10:00'),
    'Teste Codigo', '11977773001', 'codigo@example.com', true);
  if booking->>'ok' <> 'true' or booking->'slot'->>'code' !~ '^LB-[A-HJKMNP-Z2-9]{6}$' then
    raise exception 'Booking did not return a reservation code: %', booking;
  end if;
  perform set_config('livrebeauty.code', booking->'slot'->>'code', true);
  booking := public.create_public_booking(array['tratamento'], 'sofia', pg_temp.at_time('10:00'),
    'Teste Sem Consentimento', '11977773002', 'sem@example.com');
  if booking->>'ok' <> 'true' then raise exception 'Booking without consent failed: %', booking; end if;

  if public.get_reservation(current_setting('livrebeauty.code'), '11977773002')->>'code' <> 'not_found'
    or public.get_reservation('LB-AAAAAA', '11977773001')->>'code' <> 'not_found'
    or public.get_reservation('qualquer coisa', '11977773001')->>'code' <> 'not_found' then
    raise exception 'Reservation lookup accepted a wrong code or phone';
  end if;
  -- Lower case, no dash, phone with country code and mask.
  reservation := public.get_reservation(
    lower(replace(current_setting('livrebeauty.code'), '-', '')), '+55 (11) 97777-3001');
  if reservation->>'ok' <> 'true'
    or reservation->'reservation'->>'code' <> current_setting('livrebeauty.code')
    or reservation->'reservation'->'services' <> '["Corte autoral"]'::jsonb
    or reservation->'reservation'->>'stylistName' <> 'Lia Monteiro'
    or reservation->'reservation'->>'time' <> '10:00'
    or (reservation->'reservation'->>'canCancel')::boolean is not true
    or reservation->'reservation' ? 'email' or reservation->'reservation' ? 'phone' then
    raise exception 'Reservation lookup differs: %', reservation;
  end if;
  if exists (select 1 from public.appointments) or exists (select 1 from public.clients) then
    raise exception 'Anon reads private data';
  end if;
end;
$$;
reset role;

do $$
declare first_consent timestamptz;
begin
  if not exists (select 1 from public.clients where phone = '11977773001'
      and whatsapp_opt_in and whatsapp_opt_in_at is not null)
    or not exists (select 1 from public.clients where phone = '11977773002'
      and not whatsapp_opt_in and whatsapp_opt_in_at is null) then
    raise exception 'WhatsApp consent was not recorded as given';
  end if;
  select whatsapp_opt_in_at into first_consent from public.clients where phone = '11977773001';
  update public.clients set name = 'Teste Codigo Editado' where phone = '11977773001';
  if (select whatsapp_opt_in_at from public.clients where phone = '11977773001') <> first_consent then
    raise exception 'Editing a client changed the consent date';
  end if;
  update public.clients set whatsapp_opt_in = false where phone = '11977773001';
  if (select whatsapp_opt_in_at from public.clients where phone = '11977773001') is not null then
    raise exception 'Withdrawn consent kept its date';
  end if;
  -- Codes never change.
  update public.appointments set code = 'LB-AAAAAA' where code = current_setting('livrebeauty.code');
  if not exists (select 1 from public.appointments where code = current_setting('livrebeauty.code')) then
    raise exception 'A reservation code was changed';
  end if;
  if exists (select 1 from public.appointments where code !~ '^LB-[A-HJKMNP-Z2-9]{6}$') then
    raise exception 'An appointment has no valid code';
  end if;
end;
$$;

-- An existing client grants consent on a new booking; the site never withdraws it.
set local role anon;
do $$
begin
  if public.create_public_booking(array['finalizacao'], 'sofia', pg_temp.at_time('15:00'),
      'Teste Sem Consentimento', '11977773002', 'sem@example.com', true)->>'ok' <> 'true'
    or public.create_public_booking(array['finalizacao'], 'marina', pg_temp.at_time('16:00'),
      'Teste Codigo', '11977773001', 'codigo@example.com', false)->>'ok' <> 'true' then
    raise exception 'Second bookings failed';
  end if;
end;
$$;
reset role;
do $$
begin
  if not (select whatsapp_opt_in from public.clients where phone = '11977773002') then
    raise exception 'Consent from a new booking was not recorded';
  end if;
end;
$$;

-- Cancellation by the client.
set local role anon;
do $$
declare result jsonb;
begin
  if public.cancel_reservation(current_setting('livrebeauty.code'), '11977773002')->>'code' <> 'not_found' then
    raise exception 'Cancelled with the wrong phone';
  end if;
  result := public.cancel_reservation(current_setting('livrebeauty.code'), '11977773001');
  if result->>'ok' <> 'true' or result->'reservation'->>'status' <> 'cancelado'
    or (result->'reservation'->>'cancelledByClient')::boolean is not true then
    raise exception 'Client cancellation failed: %', result;
  end if;
  if public.cancel_reservation(current_setting('livrebeauty.code'), '11977773001')->>'code' <> 'not_active' then
    raise exception 'A cancelled reservation was cancelled again';
  end if;
end;
$$;
reset role;

do $$
begin
  -- The freed slot can be booked again; reactivating clears the client flag.
  if not exists (select 1 from public.appointments where code = current_setting('livrebeauty.code')
      and status = 'cancelado' and client_cancelled_at is not null) then
    raise exception 'Cancellation was not stored';
  end if;
  update public.salon_settings set cancel_min_notice_minutes = 43200 where id;
end;
$$;
set local role anon;
do $$
declare booking jsonb;
begin
  booking := public.create_public_booking(array['corte'], 'lia', pg_temp.at_time('10:00'),
    'Teste Prazo', '11977773003', 'prazo@example.com');
  if booking->>'ok' <> 'true' then raise exception 'Freed slot was not available: %', booking; end if;
  if (public.get_reservation(booking->'slot'->>'code', '11977773003')->'reservation'->>'canCancel')::boolean
    or public.cancel_reservation(booking->'slot'->>'code', '11977773003')->>'code' <> 'too_late' then
    raise exception 'Cancellation after the notice period was accepted';
  end if;
end;
$$;
reset role;

-- History retention: nothing happens while it is empty.
insert into public.clients (id, name, phone, email, updated_at) values
  ('test-old-client', 'Teste Antigo', '11977773004', 'antigo@example.com', now() - interval '2 years');
select set_config('livrebeauty.old_day', (
  ((now() at time zone 'America/Sao_Paulo')::date - interval '8 months')::date
  + (9 - extract(dow from ((now() at time zone 'America/Sao_Paulo')::date - interval '8 months'))::integer) % 7
)::text, true);
insert into public.appointments (id, client_id, service_id, performed_by, starts_at, ends_at, status, price)
values ('test-old-appointment', 'test-old-client', 'corte', 'lia',
  (current_setting('livrebeauty.old_day')::date + time '10:00') at time zone 'America/Sao_Paulo',
  (current_setting('livrebeauty.old_day')::date + time '11:00') at time zone 'America/Sao_Paulo',
  'concluido', 180);
-- The client keeps the old updated_at: only updates refresh it.
insert into public.schedule_exceptions (kind, starts_on, ends_on, reason)
values ('fechado', current_setting('livrebeauty.old_day')::date, current_setting('livrebeauty.old_day')::date, 'Antigo');

do $$
begin
  if private.purge_expired_history()->>'skipped' <> 'true'
    or not exists (select 1 from public.appointments where id = 'test-old-appointment') then
    raise exception 'History was removed without a retention period';
  end if;
end;
$$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000031","role":"authenticated"}', true);
set local role authenticated;
do $$
declare preview record;
begin
  select * into preview from public.preview_history_purge(6);
  if preview.appointments < 1 or preview.clients < 1 or preview.exceptions < 1 then
    raise exception 'Preview missed old history: %', preview;
  end if;
  begin
    perform public.preview_history_purge(3);
    raise exception 'A period under 6 months was accepted';
  exception when sqlstate 'LB008' then null; end;
  update public.salon_settings set history_retention_months = 6 where id;
end;
$$;
reset role;

-- The team cannot preview, and nobody but the database runs the cleanup.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000032","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  begin
    perform public.preview_history_purge(6);
    raise exception 'Staff previewed the cleanup';
  exception when insufficient_privilege then null; end;
  begin
    perform private.purge_expired_history();
    raise exception 'Staff ran the cleanup';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;

do $$
declare result jsonb;
begin
  result := private.purge_expired_history();
  if (result->>'appointments')::integer < 1 then raise exception 'Cleanup removed nothing: %', result; end if;
  if exists (select 1 from public.appointments where id = 'test-old-appointment')
    or exists (select 1 from public.appointment_services where appointment_id = 'test-old-appointment')
    or exists (select 1 from public.clients where id = 'test-old-client')
    or exists (select 1 from public.schedule_exceptions where reason = 'Antigo') then
    raise exception 'Old history survived the cleanup';
  end if;
  if not exists (select 1 from public.appointments where code = current_setting('livrebeauty.code'))
    or not exists (select 1 from public.clients where phone = '11977773001') then
    raise exception 'Recent history was removed';
  end if;
end;
$$;
set constraints all immediate;
rollback;

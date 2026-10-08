-- Owner operations of the panel's site editor. Each one changes several rows in
-- a single transaction. SECURITY INVOKER keeps every statement under RLS; the
-- explicit owner check only turns a silent no-op into a clear error.
-- Statements always carry WHERE clauses for Supabase's safeupdate guard.

create function public.save_service(
  p_id text, p_slug text, p_name text, p_category text, p_description text,
  p_summary text, p_duration integer, p_price numeric, p_image text,
  p_image_position text, p_home_image text, p_home_image_alt text,
  p_home_image_position text, p_active boolean, p_stylist_ids text[],
  p_component_ids text[]
) returns text
language plpgsql security invoker set search_path = '' as $$
begin
  if not (select private.is_owner()) then
    raise insufficient_privilege using message = 'Acesso não autorizado.';
  end if;
  if exists (select 1 from public.services where id = p_id) then
    update public.services set name = btrim(p_name), category = btrim(p_category),
      description = btrim(p_description), summary = btrim(p_summary), duration = p_duration,
      price = p_price, image = p_image, image_position = p_image_position,
      home_image = p_home_image, home_image_alt = btrim(p_home_image_alt),
      home_image_position = p_home_image_position, active = p_active
    where id = p_id and deleted_at is null;
    if not found then
      raise exception using errcode = 'LB005', message = 'Este serviço foi excluído.';
    end if;
  else
    insert into public.services (id, slug, name, category, description, summary, duration,
      price, image, image_position, home_image, home_image_alt, home_image_position, active, sort_order)
    values (p_id, p_slug, btrim(p_name), btrim(p_category), btrim(p_description),
      btrim(p_summary), p_duration, p_price, p_image, p_image_position, p_home_image,
      btrim(p_home_image_alt), p_home_image_position, p_active,
      (select coalesce(max(sort_order), -1) + 1 from public.services));
  end if;
  delete from public.stylist_services
  where service_id = p_id and stylist_id <> all(coalesce(p_stylist_ids, '{}'));
  insert into public.stylist_services (stylist_id, service_id, active, sort_order)
  select x.id, p_id, true, coalesce((select max(ss.sort_order) + 1
    from public.stylist_services ss where ss.stylist_id = x.id), 0)
  from unnest(coalesce(p_stylist_ids, '{}')) x(id)
  on conflict (stylist_id, service_id) do update set active = true;
  delete from public.service_components where service_id = p_id;
  insert into public.service_components (service_id, component_id, sort_order)
  select p_id, x.id, x.ord from unnest(coalesce(p_component_ids, '{}')) with ordinality x(id, ord);
  return p_id;
end;
$$;

create function public.save_stylist(
  p_id text, p_slug text, p_name text, p_role text, p_experience integer,
  p_specialties text[], p_description text, p_biography text, p_image text,
  p_image_position text, p_active boolean, p_service_ids text[]
) returns text
language plpgsql security invoker set search_path = '' as $$
begin
  if not (select private.is_owner()) then
    raise insufficient_privilege using message = 'Acesso não autorizado.';
  end if;
  if exists (select 1 from public.stylists where id = p_id) then
    update public.stylists set name = btrim(p_name), role = btrim(p_role),
      experience = p_experience, specialties = coalesce(p_specialties, '{}'),
      description = btrim(p_description), biography = btrim(p_biography), image = p_image,
      image_position = p_image_position, active = p_active
    where id = p_id and deleted_at is null;
    if not found then
      raise exception using errcode = 'LB005', message = 'Este profissional foi excluído.';
    end if;
  else
    insert into public.stylists (id, slug, name, role, experience, specialties, description,
      biography, image, image_position, active, sort_order)
    values (p_id, p_slug, btrim(p_name), btrim(p_role), p_experience,
      coalesce(p_specialties, '{}'), btrim(p_description), btrim(p_biography), p_image,
      p_image_position, p_active, (select coalesce(max(sort_order), -1) + 1 from public.stylists));
  end if;
  delete from public.stylist_services
  where stylist_id = p_id and service_id <> all(coalesce(p_service_ids, '{}'));
  insert into public.stylist_services (stylist_id, service_id, active, sort_order)
  select p_id, x.id, true, x.ord - 1
  from unnest(coalesce(p_service_ids, '{}')) with ordinality x(id, ord)
  on conflict (stylist_id, service_id) do update set active = true, sort_order = excluded.sort_order;
  return p_id;
end;
$$;

create function public.reorder_catalog(p_kind text, p_ids text[]) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not (select private.is_owner()) then
    raise insufficient_privilege using message = 'Acesso não autorizado.';
  end if;
  if p_kind = 'services' then
    update public.services s set sort_order = x.ord - 1
    from unnest(p_ids) with ordinality x(id, ord) where s.id = x.id;
  elsif p_kind = 'stylists' then
    update public.stylists s set sort_order = x.ord - 1
    from unnest(p_ids) with ordinality x(id, ord) where s.id = x.id;
  else
    raise exception using errcode = 'LB006', message = 'Lista inválida.';
  end if;
end;
$$;

-- Rows with history are archived (inactive + deleted_at); others are removed.
create function public.delete_service(p_id text) returns text
language plpgsql security invoker set search_path = '' as $$
begin
  if not (select private.is_owner()) then
    raise insufficient_privilege using message = 'Acesso não autorizado.';
  end if;
  if not exists (select 1 from public.services where id = p_id and deleted_at is null) then
    raise exception using errcode = 'LB005', message = 'Este serviço já foi excluído.';
  end if;
  delete from public.service_components where service_id = p_id or component_id = p_id;
  if exists (select 1 from public.appointments where service_id = p_id)
    or exists (select 1 from public.appointment_services where service_id = p_id) then
    update public.services set active = false, deleted_at = now() where id = p_id;
    return 'archived';
  end if;
  delete from public.stylist_services where service_id = p_id;
  delete from public.services where id = p_id;
  return 'deleted';
end;
$$;

-- A removed professional loses panel access; an owner keeps access unlinked.
create function public.delete_stylist(p_id text) returns text
language plpgsql security invoker set search_path = '' as $$
begin
  if not (select private.is_owner()) then
    raise insufficient_privilege using message = 'Acesso não autorizado.';
  end if;
  if not exists (select 1 from public.stylists where id = p_id and deleted_at is null) then
    raise exception using errcode = 'LB005', message = 'Este profissional já foi excluído.';
  end if;
  delete from public.staff_profiles where stylist_id = p_id and role = 'staff';
  update public.staff_profiles set stylist_id = null where stylist_id = p_id and role = 'owner';
  if exists (select 1 from public.appointments where booked_with = p_id or performed_by = p_id) then
    update public.stylists set active = false, deleted_at = now() where id = p_id;
    return 'archived';
  end if;
  delete from public.stylist_services where stylist_id = p_id;
  delete from public.stylists where id = p_id;
  return 'deleted';
end;
$$;

-- Replaces the whole week at once; the exclusion constraint rejects overlaps.
create function public.save_opening_periods(p_periods jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not (select private.is_owner()) then
    raise insufficient_privilege using message = 'Acesso não autorizado.';
  end if;
  if jsonb_typeof(p_periods) is distinct from 'array' or jsonb_array_length(p_periods) > 42 then
    raise exception using errcode = 'LB007', message = 'Confira os horários da semana.';
  end if;
  delete from public.opening_periods where id is not null;
  insert into public.opening_periods (weekday, opens_at, closes_at)
  select (e->>'weekday')::smallint, (e->>'opens_at')::time, (e->>'closes_at')::time
  from jsonb_array_elements(p_periods) e;
end;
$$;

do $$
declare signature text;
begin
  foreach signature in array array[
    'public.save_service(text, text, text, text, text, text, integer, numeric, text, text, text, text, text, boolean, text[], text[])',
    'public.save_stylist(text, text, text, text, integer, text[], text, text, text, text, boolean, text[])',
    'public.reorder_catalog(text, text[])',
    'public.delete_service(text)',
    'public.delete_stylist(text)',
    'public.save_opening_periods(jsonb)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', signature);
    execute format('grant execute on function %s to authenticated', signature);
  end loop;
end;
$$;

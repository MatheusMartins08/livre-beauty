-- Services the owner highlights as "Mais pedido" on the site and in booking.
alter table public.services add column popular boolean not null default false;

-- Same function with the highlight; the old signature is replaced.
drop function public.save_service(text, text, text, text, text, text, integer, numeric,
  text, text, text, text, text, boolean, text[], text[]);
create function public.save_service(
  p_id text, p_slug text, p_name text, p_category text, p_description text,
  p_summary text, p_duration integer, p_price numeric, p_image text,
  p_image_position text, p_home_image text, p_home_image_alt text,
  p_home_image_position text, p_active boolean, p_stylist_ids text[],
  p_component_ids text[], p_popular boolean default false
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
      home_image_position = p_home_image_position, active = p_active,
      popular = coalesce(p_popular, false)
    where id = p_id and deleted_at is null;
    if not found then
      raise exception using errcode = 'LB005', message = 'Este serviço foi excluído.';
    end if;
  else
    insert into public.services (id, slug, name, category, description, summary, duration,
      price, image, image_position, home_image, home_image_alt, home_image_position, active,
      popular, sort_order)
    values (p_id, p_slug, btrim(p_name), btrim(p_category), btrim(p_description),
      btrim(p_summary), p_duration, p_price, p_image, p_image_position, p_home_image,
      btrim(p_home_image_alt), p_home_image_position, p_active, coalesce(p_popular, false),
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
revoke all on function public.save_service(text, text, text, text, text, text, integer, numeric,
  text, text, text, text, text, boolean, text[], text[], boolean) from public, anon, authenticated;
grant execute on function public.save_service(text, text, text, text, text, text, integer, numeric,
  text, text, text, text, text, boolean, text[], text[], boolean) to authenticated;

-- Consolidate overlapping permissive policies while preserving owner/staff access.
-- Authorization helpers belong outside the exposed Data API schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
alter function public.is_owner() set schema private;
alter function public.current_stylist_id() set schema private;
revoke all on function private.is_owner(), private.current_stylist_id() from public, anon, authenticated;
grant execute on function private.is_owner(), private.current_stylist_id() to authenticated;

do $$
declare
  policy_row record;
  table_name text;
begin
  for policy_row in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('services','stylists','stylist_services',
      'business_hours','clients','appointments','staff_profiles') loop
    execute format('drop policy %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
  -- Owner writes are separate actions so they do not duplicate SELECT policies.
  foreach table_name in array array['services','stylists','stylist_services',
    'business_hours','clients','staff_profiles'] loop
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.is_owner()))', table_name || '_owner_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.is_owner())) with check ((select private.is_owner()))', table_name || '_owner_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select private.is_owner()))', table_name || '_owner_delete', table_name);
  end loop;
end;
$$;

create policy services_anon_read on public.services for select to anon using (active);
create policy services_authenticated_read on public.services for select to authenticated
using ((select private.is_owner()) or active);
create policy stylists_anon_read on public.stylists for select to anon using (active);
create policy stylists_authenticated_read on public.stylists for select to authenticated
using ((select private.is_owner()) or active);
create policy business_hours_anon_read on public.business_hours for select to anon using (active);
create policy business_hours_authenticated_read on public.business_hours for select to authenticated
using ((select private.is_owner()) or active);
create policy stylist_services_anon_read on public.stylist_services for select to anon using (
  active and exists (select 1 from public.services s where s.id = service_id and s.active)
    and exists (select 1 from public.stylists st where st.id = stylist_id and st.active)
);
create policy stylist_services_authenticated_read on public.stylist_services for select to authenticated using (
  (select private.is_owner()) or (active
    and exists (select 1 from public.services s where s.id = service_id and s.active)
    and exists (select 1 from public.stylists st where st.id = stylist_id and st.active))
);
create policy clients_authenticated_read on public.clients for select to authenticated using (
  (select private.is_owner()) or exists (select 1 from public.appointments a
    where a.client_id = clients.id and a.performed_by = (select private.current_stylist_id()))
);
create policy staff_profiles_authenticated_read on public.staff_profiles for select to authenticated
using ((select private.is_owner()) or user_id = (select auth.uid()));
create policy appointments_authenticated_read on public.appointments for select to authenticated
using ((select private.is_owner()) or performed_by = (select private.current_stylist_id()));
create policy appointments_authenticated_insert on public.appointments for insert to authenticated
with check ((select private.is_owner()) or performed_by = (select private.current_stylist_id()));
create policy appointments_authenticated_update on public.appointments for update to authenticated
using ((select private.is_owner()) or performed_by = (select private.current_stylist_id()))
with check ((select private.is_owner()) or performed_by = (select private.current_stylist_id()));

-- The existing salon_settings policy follows the function by its OID after SET SCHEMA.
-- No DELETE grant or policy is added for appointments.

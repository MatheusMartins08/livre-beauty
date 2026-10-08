create function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_profiles where user_id = (select auth.uid()) and role = 'owner');
$$;
create function public.current_stylist_id() returns text
language sql stable security definer set search_path = '' as $$
  select stylist_id from public.staff_profiles where user_id = (select auth.uid());
$$;
revoke all on function public.is_owner(), public.current_stylist_id() from public, anon, authenticated;
grant execute on function public.is_owner(), public.current_stylist_id() to authenticated;
grant usage on schema public to anon, authenticated;

grant select on public.services, public.stylists, public.stylist_services, public.business_hours to anon, authenticated;
grant insert, update, delete on public.services, public.stylists, public.stylist_services, public.business_hours to authenticated;
create policy services_public_read on public.services for select to anon, authenticated using (active);
create policy services_owner_all on public.services for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy stylists_public_read on public.stylists for select to anon, authenticated using (active);
create policy stylists_owner_all on public.stylists for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy stylist_services_public_read on public.stylist_services for select to anon, authenticated using (
  active and exists (select 1 from public.services s where s.id = service_id and s.active)
    and exists (select 1 from public.stylists st where st.id = stylist_id and st.active)
);
create policy stylist_services_owner_all on public.stylist_services for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy business_hours_public_read on public.business_hours for select to anon, authenticated using (active);
create policy business_hours_owner_all on public.business_hours for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

-- Anon SELECT gets zero rows. It has no write privileges/policies.
grant select on public.clients, public.appointments to anon;
grant select, insert, update, delete on public.clients to authenticated;
create policy clients_owner_all on public.clients for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy clients_staff_read on public.clients for select to authenticated using (
  exists (select 1 from public.appointments a where a.client_id = clients.id and a.performed_by = (select public.current_stylist_id()))
);

grant select, insert, update on public.appointments to authenticated;
create policy appointments_owner_read on public.appointments for select to authenticated using ((select public.is_owner()));
create policy appointments_owner_insert on public.appointments for insert to authenticated with check ((select public.is_owner()));
create policy appointments_owner_update on public.appointments for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy appointments_staff_read on public.appointments for select to authenticated using (performed_by = (select public.current_stylist_id()));
create policy appointments_staff_insert on public.appointments for insert to authenticated with check (performed_by = (select public.current_stylist_id()));
create policy appointments_staff_update on public.appointments for update to authenticated using (performed_by = (select public.current_stylist_id())) with check (performed_by = (select public.current_stylist_id()));

grant select, insert, update, delete on public.staff_profiles, public.salon_settings to authenticated;
create policy staff_profiles_self_read on public.staff_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy staff_profiles_owner_all on public.staff_profiles for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy salon_settings_owner_all on public.salon_settings for all to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

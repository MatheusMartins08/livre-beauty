-- Public images managed by the owner in the panel's site editor.
-- Visitors read through public URLs; only the owner writes, in known folders.
-- Files are named <folder>/<uuid>.<ext> and never overwritten.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

-- Removing an object through the Storage API also requires SELECT.
create policy site_media_owner_select on storage.objects for select to authenticated
using (bucket_id = 'site-media' and (select private.is_owner()));
create policy site_media_owner_insert on storage.objects for insert to authenticated
with check (bucket_id = 'site-media'
  and (storage.foldername(name))[1] in ('site', 'gallery', 'stylists', 'services')
  and (select private.is_owner()));
create policy site_media_owner_update on storage.objects for update to authenticated
using (bucket_id = 'site-media' and (select private.is_owner()))
with check (bucket_id = 'site-media'
  and (storage.foldername(name))[1] in ('site', 'gallery', 'stylists', 'services')
  and (select private.is_owner()));
create policy site_media_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'site-media' and (select private.is_owner()));

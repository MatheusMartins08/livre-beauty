-- Owner-editable site sections and catalog fields shown on the public pages.
-- A missing site_content row means the page uses the default text in TypeScript.
create table public.site_content (
  key text primary key check (key in ('hero', 'about', 'manifesto', 'services',
    'experts', 'faq', 'reviews', 'visit', 'contact', 'gallery')),
  content jsonb not null check (jsonb_typeof(content) = 'object'
    and pg_column_size(content) <= 65536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
create trigger set_updated_at before update on public.site_content
for each row execute function public.set_updated_at();
revoke all on public.site_content from anon, authenticated;
grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;
create policy site_content_public_read on public.site_content for select
to anon, authenticated using (true);
create policy site_content_owner_insert on public.site_content for insert
to authenticated with check ((select private.is_owner()));
create policy site_content_owner_update on public.site_content for update
to authenticated using ((select private.is_owner())) with check ((select private.is_owner()));
create policy site_content_owner_delete on public.site_content for delete
to authenticated using ((select private.is_owner()));

-- Images are either bundled files or objects of the site-media bucket.
alter table public.services
  add column summary text not null default '' check (char_length(summary) <= 160),
  add column image_position text not null default '50% 50%',
  add column home_image text,
  add column home_image_alt text not null default '' check (char_length(home_image_alt) <= 200),
  add column home_image_position text not null default '50% 50%',
  add column deleted_at timestamptz,
  -- A deleted row stays only to keep appointment history readable.
  add constraint services_deleted_inactive_check check (deleted_at is null or not active),
  add constraint services_text_check check (char_length(btrim(category)) between 1 and 60
    and char_length(btrim(description)) between 1 and 400),
  add constraint services_image_check check (
    image ~ '^(/images/[A-Za-z0-9._-]+|https://[A-Za-z0-9.-]+/storage/v1/object/public/site-media/[A-Za-z0-9/._-]+)$'
    and (home_image is null or home_image ~ '^(/images/[A-Za-z0-9._-]+|https://[A-Za-z0-9.-]+/storage/v1/object/public/site-media/[A-Za-z0-9/._-]+)$')),
  add constraint services_position_check check (
    image_position ~ '^[0-9]{1,3}% [0-9]{1,3}%$' and home_image_position ~ '^[0-9]{1,3}% [0-9]{1,3}%$'),
  add constraint services_duration_price_check check (duration <= 720 and price <= 100000);

alter table public.stylists
  add column image_position text not null default '50% 50%',
  add column deleted_at timestamptz,
  add constraint stylists_deleted_inactive_check check (deleted_at is null or not active),
  add constraint stylists_text_check check (char_length(btrim(name)) between 2 and 100
    and char_length(btrim(role)) between 1 and 80
    and char_length(btrim(description)) between 1 and 400
    and char_length(btrim(biography)) between 1 and 1500
    and experience <= 80 and cardinality(specialties) <= 8),
  add constraint stylists_image_check check (
    image ~ '^(/images/[A-Za-z0-9._-]+|https://[A-Za-z0-9.-]+/storage/v1/object/public/site-media/[A-Za-z0-9/._-]+)$'),
  add constraint stylists_position_check check (image_position ~ '^[0-9]{1,3}% [0-9]{1,3}%$');

-- Homepage summaries and editorial photos previously kept in content/home.ts.
update public.services s set
  summary = v.summary,
  home_image = v.home_image,
  home_image_alt = v.home_image_alt,
  home_image_position = v.home_image_position
from (values
  ('corte', 'Forma e movimento para sua textura natural.', '/images/home-service-haircut.jpg',
    'Detalhe de corte com tesoura e pente', '50% 50%'),
  ('cor', 'Nuances sob medida para o seu estilo.', '/images/home-service-color.jpg',
    'Coloração aplicada por uma profissional no salão', '50% 50%'),
  ('balayage', 'Luz e dimensão com transições suaves.', '/images/home-service-balayage.jpg',
    'Referência de cabelo loiro com ondas e nuances de luz', '85% 50%'),
  ('tratamento', 'Cuidado para devolver vida aos fios.', '/images/home-service-treatment.jpg',
    'Cuidado dos fios durante a lavagem no salão', '50% 50%'),
  ('finalizacao', 'Ondas e penteados para cada ocasião.', '/images/home-service-styling.jpg',
    'Modelagem de ondas em cabelo castanho', '50% 50%'),
  ('extensoes', 'Comprimento e volume com efeito natural.', '/images/home-service-extensions.jpg',
    'Referência de comprimento e volume em cabelo longo ondulado', '50% 50%')
) as v(id, summary, home_image, home_image_alt, home_image_position)
where s.id = v.id and s.home_image is null and s.summary = '';

-- Phase 2: database only. Apply through MCP apply_migration.
create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
set search_path = public, extensions;

create type public.app_role as enum ('owner', 'staff');
create type public.appointment_status as enum ('agendado', 'concluido', 'faltou', 'cancelado');
create type public.payment_method as enum ('pix', 'cartao', 'dinheiro');
create type public.appointment_source as enum ('site', 'painel');

create table public.services (
  id text primary key,
  slug text not null unique,
  name text not null check (char_length(btrim(name)) between 2 and 100),
  category text not null,
  description text not null,
  duration integer not null check (duration > 0),
  price numeric(10,2) not null check (price >= 0),
  image text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stylists (
  id text primary key,
  slug text not null unique,
  name text not null,
  role text not null,
  experience integer not null check (experience >= 0),
  specialties text[] not null default '{}',
  description text not null,
  biography text not null,
  image text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stylist_services (
  stylist_id text not null references public.stylists(id) on delete restrict,
  service_id text not null references public.services(id) on delete restrict,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (stylist_id, service_id)
);
create index stylist_services_service_id_idx on public.stylist_services(service_id);

create table public.business_hours (
  weekday smallint primary key check (weekday between 0 and 6),
  active boolean not null default true,
  opens_at time,
  closes_at time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((not active and opens_at is null and closes_at is null)
    or (active and opens_at is not null and closes_at is not null and closes_at > opens_at))
);

create table public.clients (
  id text primary key default gen_random_uuid()::text,
  name text not null check (char_length(btrim(name)) between 2 and 100),
  phone text not null unique check (phone ~ '^[0-9]{10,11}$'),
  email text not null check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null,
  stylist_id text unique references public.stylists(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role <> 'staff' or stylist_id is not null)
);

create table public.salon_settings (
  id boolean primary key default true check (id),
  show_prices boolean not null default true,
  time_zone text not null default 'America/Sao_Paulo' check (time_zone = 'America/Sao_Paulo'),
  booking_window_days integer not null default 30 check (booking_window_days between 1 and 365),
  slot_interval_minutes integer not null default 30 check (slot_interval_minutes between 1 and 60),
  -- Illustrative rate from lib/admin.ts, not confirmed commercial terms.
  demo_commission_rate numeric(5,4) not null default 0.5 check (demo_commission_rate between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id text primary key default gen_random_uuid()::text,
  client_id text not null references public.clients(id) on delete restrict,
  service_id text not null references public.services(id) on delete restrict,
  booked_with text references public.stylists(id) on delete restrict,
  performed_by text not null references public.stylists(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'agendado',
  price numeric(10,2) not null check (price >= 0),
  payment_method public.payment_method,
  source public.appointment_source not null default 'painel',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  constraint appointments_stylist_no_overlap exclude using gist
    (performed_by with =, tstzrange(starts_at, ends_at, '[)') with &&)
    where (status in ('agendado', 'concluido')),
  constraint appointments_client_no_overlap exclude using gist
    (client_id with =, tstzrange(starts_at, ends_at, '[)') with &&)
    where (status in ('agendado', 'concluido'))
);
create index appointments_client_id_idx on public.appointments(client_id);
create index appointments_service_id_idx on public.appointments(service_id);
create index appointments_booked_with_idx on public.appointments(booked_with);
create index appointments_performed_by_starts_at_idx on public.appointments(performed_by, starts_at);
create index appointments_starts_at_idx on public.appointments(starts_at);

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function public.normalize_client_contact() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.phone !~ '^[+()0-9[:space:].-]+$' then
    raise check_violation using message = 'Informe um celular válido com DDD.';
  end if;
  new.phone := regexp_replace(new.phone, '[^0-9]', '', 'g');
  if new.phone ~ '^55[0-9]{10,11}$' then new.phone := substr(new.phone, 3); end if;
  new.name := btrim(new.name);
  new.email := btrim(new.email);
  return new;
end;
$$;
create trigger normalize_client_contact before insert or update on public.clients
for each row execute function public.normalize_client_contact();

-- Definer is required to validate against closed/inactive catalog rows under RLS.
-- Historical records survive later catalog edits. Reassignment/reactivation revalidates.
create function public.validate_appointment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  local_start timestamp := new.starts_at at time zone 'America/Sao_Paulo';
  local_end timestamp := new.ends_at at time zone 'America/Sao_Paulo';
  hours public.business_hours%rowtype;
begin
  if tg_op = 'UPDATE' then
    if new.service_id = old.service_id and new.performed_by = old.performed_by
      and new.starts_at = old.starts_at and new.ends_at = old.ends_at
      and (new.status not in ('agendado', 'concluido') or old.status in ('agendado', 'concluido')) then
      return new;
    end if;
  end if;
  if not exists (
    select 1 from public.stylist_services ss
    join public.services s on s.id = ss.service_id
    join public.stylists st on st.id = ss.stylist_id
    where ss.stylist_id = new.performed_by and ss.service_id = new.service_id
      and ss.active and s.active and st.active
  ) then
    raise check_violation using message = 'O profissional não atende este serviço.';
  end if;
  if new.status in ('agendado', 'concluido') then
    select * into hours from public.business_hours where weekday = extract(dow from local_start);
    if not found or not hours.active or local_start::date <> local_end::date
      or local_start::time < hours.opens_at or local_end::time > hours.closes_at then
      raise check_violation using message = 'O atendimento deve ocorrer dentro do horário de funcionamento.';
    end if;
  end if;
  return new;
end;
$$;
create trigger validate_appointment before insert or update on public.appointments
for each row execute function public.validate_appointment();

do $$
declare table_name text;
begin
  foreach table_name in array array['services','stylists','stylist_services','business_hours',
    'clients','staff_profiles','salon_settings','appointments'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
  end loop;
end;
$$;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.normalize_client_contact() from public, anon, authenticated;
revoke all on function public.validate_appointment() from public, anon, authenticated;
reset search_path;

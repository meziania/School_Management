-- ============================================================
-- Migration 001 — Init: schools, users, helpers RLS
-- ============================================================

-- ── Helpers JWT ──────────────────────────────────────────────
create or replace function public.request_school_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'school_id', '')::uuid;
$$;

create or replace function public.request_role()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'role';
$$;

-- ── Table: schools ────────────────────────────────────────────
create table if not exists public.schools (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  subdomain           text not null unique,
  plan                text not null default 'trial' check (plan in ('trial', 'starter', 'standard', 'enterprise')),
  subscription_status text not null default 'trial' check (subscription_status in ('trial', 'active', 'past_due', 'canceled')),
  trial_ends_at       timestamptz not null default (now() + interval '30 days'),
  stripe_customer_id  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_schools_subdomain on public.schools(subdomain);

-- ── Table: users (profile lié à auth.users) ──────────────────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  school_id   uuid references public.schools(id) on delete cascade,
  role        text not null check (role in ('super_admin', 'school_admin', 'parent')),
  email       text not null,
  full_name   text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_users_school_id on public.users(school_id);
create index if not exists idx_users_role on public.users(role);

-- ── RLS schools ───────────────────────────────────────────────
alter table public.schools enable row level security;

-- Super admin voit tout (via service role côté serveur)
-- School admin voit uniquement son école
create policy "schools_select_own"
  on public.schools for select
  using (
    id = request_school_id()
    or request_role() = 'super_admin'
  );

-- Seul service role peut INSERT/UPDATE (signup tenant, super admin)
create policy "schools_insert_service"
  on public.schools for insert
  with check (request_role() = 'super_admin');

create policy "schools_update_own"
  on public.schools for update
  using (
    id = request_school_id() and request_role() = 'school_admin'
    or request_role() = 'super_admin'
  );

-- ── RLS users ─────────────────────────────────────────────────
alter table public.users enable row level security;

create policy "users_select_own_school"
  on public.users for select
  using (
    school_id = request_school_id()
    or id = auth.uid()
    or request_role() = 'super_admin'
  );

create policy "users_insert_admin"
  on public.users for insert
  with check (
    school_id = request_school_id() and request_role() = 'school_admin'
    or request_role() = 'super_admin'
  );

create policy "users_update_admin"
  on public.users for update
  using (
    school_id = request_school_id() and request_role() = 'school_admin'
    or id = auth.uid()
    or request_role() = 'super_admin'
  );

-- ── Trigger updated_at ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger schools_updated_at before update on public.schools
  for each row execute function public.set_updated_at();

create trigger users_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- ── Custom claims via trigger (Auth Hook) ────────────────────
-- Ce trigger synchronise school_id et role dans les metadata JWT
-- À activer dans Supabase Dashboard > Auth > Hooks si nécessaire
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- Les claims sont définis via le profil users
  -- Voir app/api/auth/signup-school pour la logique
  return new;
end;
$$;

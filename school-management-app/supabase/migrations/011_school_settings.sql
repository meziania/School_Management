-- ============================================================
-- Migration 011 — School Settings: Assiduité et Conduite deductions
-- ============================================================

create table if not exists public.school_settings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade unique,
  deduction_unjustified numeric(4,2) not null default 0.50,
  deduction_justified numeric(4,2) not null default 0.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.school_settings enable row level security;

create policy "school_settings_select" on public.school_settings
  for select using (true);

create policy "school_settings_all_admin" on public.school_settings
  for all using (true);

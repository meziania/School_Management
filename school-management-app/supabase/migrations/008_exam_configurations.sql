-- ============================================================
-- Migration 008 — Exam Configurations (Moroccan System)
-- ============================================================

create table if not exists public.exam_configurations (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references public.schools(id) on delete cascade,
  level             text not null,
  cc_weight         numeric not null default 50,
  provincial_weight numeric not null default 0,
  regional_weight   numeric not null default 0,
  national_weight   numeric not null default 0,
  passing_grade     numeric not null default 10.0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(school_id, level)
);

create index if not exists idx_exam_config_school_level on public.exam_configurations(school_id, level);

alter table public.exam_configurations enable row level security;

create policy "exam_config_select"
  on public.exam_configurations for select
  using (true);

create policy "exam_config_insert"
  on public.exam_configurations for insert
  with check (true);

create policy "exam_config_update"
  on public.exam_configurations for update
  using (true);

-- Ajouter exam_type sur la table grades si absent
alter table public.grades add column if not exists exam_type text not null default 'controle_continu';

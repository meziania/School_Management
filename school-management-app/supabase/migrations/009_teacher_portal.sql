-- ============================================================
-- Migration 009 — Teacher Portal & Relationships
-- ============================================================

-- ── Table: teacher_classes (Liaison Enseignant <-> Classe & Matière)
create table if not exists public.teacher_classes (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references public.schools(id) on delete cascade,
  teacher_user_id uuid not null references public.users(id) on delete cascade,
  class_id        uuid not null references public.classes(id) on delete cascade,
  subject         text not null,
  created_at      timestamptz not null default now(),
  unique(teacher_user_id, class_id, subject)
);

create index if not exists idx_teacher_classes_school on public.teacher_classes(school_id);
create index if not exists idx_teacher_classes_teacher on public.teacher_classes(teacher_user_id);
create index if not exists idx_teacher_classes_class on public.teacher_classes(class_id);

alter table public.teacher_classes enable row level security;

drop policy if exists "teacher_classes_select" on public.teacher_classes;
create policy "teacher_classes_select" on public.teacher_classes for select using (true);

drop policy if exists "teacher_classes_insert" on public.teacher_classes;
create policy "teacher_classes_insert" on public.teacher_classes for insert with check (true);

drop policy if exists "teacher_classes_delete" on public.teacher_classes;
create policy "teacher_classes_delete" on public.teacher_classes for delete using (true);

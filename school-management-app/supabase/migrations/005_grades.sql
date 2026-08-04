-- ============================================================
-- Migration 005 — Grades (notes)
-- ============================================================

create table if not exists public.grades (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  student_id  uuid not null references public.students(id) on delete cascade,
  subject     text not null,
  score       numeric(5,2) not null check (score >= 0 and score <= 20),
  coefficient numeric(4,2) not null default 1 check (coefficient > 0),
  term        integer not null check (term in (1, 2, 3)),
  date        date not null default current_date,
  comment     text,
  created_by  uuid references public.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_grades_school_id on public.grades(school_id);
create index if not exists idx_grades_student_id on public.grades(student_id);
create index if not exists idx_grades_school_student on public.grades(school_id, student_id);

-- ── RLS ───────────────────────────────────────────────────────
alter table public.grades enable row level security;

create policy "grades_select"
  on public.grades for select
  using (
    school_id = request_school_id()
    and (
      request_role() = 'school_admin'
      or student_id in (
        select student_id from public.parent_students
        where parent_user_id = auth.uid()
          and school_id = request_school_id()
      )
    )
  );

create policy "grades_insert_admin"
  on public.grades for insert
  with check (school_id = request_school_id() and request_role() = 'school_admin');

create policy "grades_update_admin"
  on public.grades for update
  using (school_id = request_school_id() and request_role() = 'school_admin')
  with check (school_id = request_school_id() and request_role() = 'school_admin');

create policy "grades_delete_admin"
  on public.grades for delete
  using (school_id = request_school_id() and request_role() = 'school_admin');

-- ── Trigger updated_at ────────────────────────────────────────
create trigger grades_updated_at before update on public.grades
  for each row execute function public.set_updated_at();

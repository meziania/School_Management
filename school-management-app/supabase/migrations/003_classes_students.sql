-- ============================================================
-- Migration 003 — Classes, Students, ParentStudents
-- ============================================================

-- ── Table: classes ────────────────────────────────────────────
create table if not exists public.classes (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  name       text not null,
  level      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_classes_school_id on public.classes(school_id);

-- ── Table: students ───────────────────────────────────────────
create table if not exists public.students (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  class_id   uuid references public.classes(id) on delete set null,
  last_name  text not null,
  first_name text not null,
  birth_date date,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_students_school_id on public.students(school_id);
create index if not exists idx_students_class_id on public.students(class_id);

-- ── Table: parent_students (many-to-many) ─────────────────────
create table if not exists public.parent_students (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools(id) on delete cascade,
  parent_user_id uuid not null references public.users(id) on delete cascade,
  student_id     uuid not null references public.students(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique(parent_user_id, student_id)
);

create index if not exists idx_parent_students_school_id on public.parent_students(school_id);
create index if not exists idx_parent_students_parent on public.parent_students(parent_user_id);
create index if not exists idx_parent_students_student on public.parent_students(student_id);

-- ── RLS classes ───────────────────────────────────────────────
alter table public.classes enable row level security;

create policy "classes_select_school"
  on public.classes for select
  using (school_id = request_school_id());

create policy "classes_insert_admin"
  on public.classes for insert
  with check (school_id = request_school_id() and request_role() = 'school_admin');

create policy "classes_update_admin"
  on public.classes for update
  using (school_id = request_school_id() and request_role() = 'school_admin')
  with check (school_id = request_school_id() and request_role() = 'school_admin');

create policy "classes_delete_admin"
  on public.classes for delete
  using (school_id = request_school_id() and request_role() = 'school_admin');

-- ── RLS students ──────────────────────────────────────────────
alter table public.students enable row level security;

-- Admin : tous les élèves de son école
-- Parent : seulement ses élèves liés via parent_students
create policy "students_select"
  on public.students for select
  using (
    school_id = request_school_id()
    and (
      request_role() = 'school_admin'
      or id in (
        select student_id from public.parent_students
        where parent_user_id = auth.uid()
          and school_id = request_school_id()
      )
    )
  );

create policy "students_insert_admin"
  on public.students for insert
  with check (school_id = request_school_id() and request_role() = 'school_admin');

create policy "students_update_admin"
  on public.students for update
  using (school_id = request_school_id() and request_role() = 'school_admin')
  with check (school_id = request_school_id() and request_role() = 'school_admin');

create policy "students_delete_admin"
  on public.students for delete
  using (school_id = request_school_id() and request_role() = 'school_admin');

-- ── RLS parent_students ───────────────────────────────────────
alter table public.parent_students enable row level security;

create policy "parent_students_select"
  on public.parent_students for select
  using (
    school_id = request_school_id()
    and (
      request_role() = 'school_admin'
      or parent_user_id = auth.uid()
    )
  );

create policy "parent_students_insert_admin"
  on public.parent_students for insert
  with check (school_id = request_school_id() and request_role() = 'school_admin');

create policy "parent_students_delete_admin"
  on public.parent_students for delete
  using (school_id = request_school_id() and request_role() = 'school_admin');

-- ── Triggers updated_at ───────────────────────────────────────
create trigger classes_updated_at before update on public.classes
  for each row execute function public.set_updated_at();

create trigger students_updated_at before update on public.students
  for each row execute function public.set_updated_at();

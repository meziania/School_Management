-- ============================================================
-- Migration 004 — Attendance (présence quotidienne)
-- ============================================================

create table if not exists public.attendance (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references public.schools(id) on delete cascade,
  student_id     uuid not null references public.students(id) on delete cascade,
  date           date not null,
  status         text not null check (status in ('present', 'absent', 'late')),
  justification  text,
  is_justified   boolean not null default false,
  justified_file text, -- chemin Storage: {school_id}/{student_id}/{id}/{filename}
  created_by     uuid references public.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique(student_id, date)
);

create index if not exists idx_attendance_school_id on public.attendance(school_id);
create index if not exists idx_attendance_student_id on public.attendance(student_id);
create index if not exists idx_attendance_school_date on public.attendance(school_id, date);

-- ── RLS ───────────────────────────────────────────────────────
alter table public.attendance enable row level security;

-- Admin : toutes les présences de son école
-- Parent : seulement les présences de ses enfants
create policy "attendance_select"
  on public.attendance for select
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

create policy "attendance_insert_admin"
  on public.attendance for insert
  with check (school_id = request_school_id() and request_role() = 'school_admin');

create policy "attendance_update_admin"
  on public.attendance for update
  using (school_id = request_school_id() and request_role() = 'school_admin')
  with check (school_id = request_school_id() and request_role() = 'school_admin');

-- Parent peut mettre à jour justification/fichier de ses enfants uniquement
create policy "attendance_update_parent_justify"
  on public.attendance for update
  using (
    school_id = request_school_id()
    and request_role() = 'parent'
    and student_id in (
      select student_id from public.parent_students
      where parent_user_id = auth.uid()
        and school_id = request_school_id()
    )
  );

create policy "attendance_delete_admin"
  on public.attendance for delete
  using (school_id = request_school_id() and request_role() = 'school_admin');

-- ── Trigger updated_at ────────────────────────────────────────
create trigger attendance_updated_at before update on public.attendance
  for each row execute function public.set_updated_at();

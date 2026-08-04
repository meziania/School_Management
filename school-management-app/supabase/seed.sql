-- ============================================================
-- Seed — Données de démo
-- ============================================================
-- ATTENTION : À exécuter APRÈS les migrations 001-007
-- Utilise le service role (bypasse RLS)

-- Nettoyage (ordre inverse des FK)
-- delete from public.notifications;
-- delete from public.messages;
-- delete from public.announcements;
-- delete from public.grades;
-- delete from public.attendance;
-- delete from public.parent_students;
-- delete from public.students;
-- delete from public.classes;
-- delete from public.subscriptions;
-- delete from public.users;
-- delete from public.schools;

-- ── École de démo ─────────────────────────────────────────────
insert into public.schools (id, name, subdomain, plan, subscription_status)
values (
  '00000000-0000-0000-0000-000000000001',
  'École Primaire Les Acacias',
  'les-acacias',
  'trial',
  'trial'
) on conflict (id) do nothing;

-- ── Abonnement trial ──────────────────────────────────────────
insert into public.subscriptions (school_id, plan, status, trial_ends_at)
values (
  '00000000-0000-0000-0000-000000000001',
  'trial',
  'trial',
  now() + interval '30 days'
) on conflict do nothing;

-- ── Classes ───────────────────────────────────────────────────
insert into public.classes (id, school_id, name, level) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'CM1 A', 'CM1'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'CM2 B', 'CM2')
on conflict (id) do nothing;

-- ── Élèves ────────────────────────────────────────────────────
insert into public.students (id, school_id, class_id, last_name, first_name, birth_date) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Dupont', 'Lucas', '2015-03-12'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Martin', 'Emma', '2015-07-22'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Bernard', 'Noah', '2014-11-05'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Petit', 'Léa', '2014-09-18'),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Moreau', 'Hugo', '2015-01-30')
on conflict (id) do nothing;

-- ── Notes de démo ─────────────────────────────────────────────
insert into public.grades (school_id, student_id, subject, score, coefficient, term, date) values
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Mathématiques', 14.5, 2, 1, current_date - 7),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Français', 16.0, 2, 1, current_date - 5),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Histoire-Géo', 13.0, 1, 1, current_date - 3),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Mathématiques', 18.0, 2, 1, current_date - 7),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Français', 15.5, 2, 1, current_date - 5)
on conflict do nothing;

-- ── Présences de démo (7 derniers jours) ─────────────────────
insert into public.attendance (school_id, student_id, date, status) values
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', current_date, 'present'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', current_date - 1, 'present'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', current_date - 2, 'absent'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', current_date, 'present'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', current_date - 1, 'late'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', current_date, 'absent'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', current_date, 'present'),
  ('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', current_date, 'present')
on conflict (student_id, date) do nothing;

-- Note : Les users (admin + parents) sont créés via Supabase Auth
-- Voir la doc docs/13-CHECKLIST-DEMARRAGE.md pour les étapes

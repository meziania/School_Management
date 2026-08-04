-- ============================================================
-- Migration 006 — Announcements, Messages, Notifications
-- ============================================================

-- ── Table: announcements ─────────────────────────────────────
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  title      text not null,
  content    text not null,
  target     text not null default 'all' check (target = 'all' or target::uuid is not null), -- 'all' ou class_id
  class_id   uuid references public.classes(id) on delete set null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_announcements_school_id on public.announcements(school_id);
create index if not exists idx_announcements_created_at on public.announcements(school_id, created_at desc);

-- ── Table: messages ───────────────────────────────────────────
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  sender_id   uuid not null references public.users(id),
  receiver_id uuid not null references public.users(id),
  content     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_messages_school_id on public.messages(school_id);
create index if not exists idx_messages_sender on public.messages(sender_id);
create index if not exists idx_messages_receiver on public.messages(receiver_id);
create index if not exists idx_messages_conversation on public.messages(school_id, sender_id, receiver_id, created_at desc);

-- ── Table: notifications ──────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null check (type in ('announcement', 'absence', 'grade', 'message', 'justification_submitted')),
  content    text not null,
  link       text, -- URL relative de navigation
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_school_id on public.notifications(school_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read) where is_read = false;

-- ── RLS announcements ─────────────────────────────────────────
alter table public.announcements enable row level security;

create policy "announcements_select"
  on public.announcements for select
  using (school_id = request_school_id());

create policy "announcements_insert_admin"
  on public.announcements for insert
  with check (school_id = request_school_id() and request_role() = 'school_admin');

create policy "announcements_update_admin"
  on public.announcements for update
  using (school_id = request_school_id() and request_role() = 'school_admin')
  with check (school_id = request_school_id() and request_role() = 'school_admin');

create policy "announcements_delete_admin"
  on public.announcements for delete
  using (school_id = request_school_id() and request_role() = 'school_admin');

-- ── RLS messages ──────────────────────────────────────────────
alter table public.messages enable row level security;

-- Voir : être sender ou receiver dans la même école
create policy "messages_select"
  on public.messages for select
  using (
    school_id = request_school_id()
    and (sender_id = auth.uid() or receiver_id = auth.uid())
  );

-- Envoyer : sender = soi-même + même école
create policy "messages_insert"
  on public.messages for insert
  with check (
    school_id = request_school_id()
    and sender_id = auth.uid()
  );

-- Marquer comme lu : receiver seulement
create policy "messages_update_read"
  on public.messages for update
  using (
    school_id = request_school_id()
    and receiver_id = auth.uid()
  );

-- ── RLS notifications ─────────────────────────────────────────
alter table public.notifications enable row level security;

create policy "notifications_select"
  on public.notifications for select
  using (
    school_id = request_school_id()
    and user_id = auth.uid()
  );

-- INSERT via trigger/service role uniquement
create policy "notifications_insert_admin_only"
  on public.notifications for insert
  with check (
    school_id = request_school_id()
    and request_role() = 'school_admin'
  );

create policy "notifications_update_read"
  on public.notifications for update
  using (
    school_id = request_school_id()
    and user_id = auth.uid()
  );

-- ── Triggers updated_at ───────────────────────────────────────
create trigger announcements_updated_at before update on public.announcements
  for each row execute function public.set_updated_at();

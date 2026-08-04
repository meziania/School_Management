-- ============================================================
-- Migration 007 — Justifications Storage + Subscriptions
-- ============================================================

-- Bucket Storage "absence-justifications" (à créer dans Supabase Dashboard)
-- Path: {school_id}/{student_id}/{attendance_id}/{filename}

-- ── Table: subscriptions ──────────────────────────────────────
create table if not exists public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  school_id            uuid not null references public.schools(id) on delete cascade,
  plan                 text not null check (plan in ('trial', 'starter', 'standard', 'enterprise')),
  stripe_customer_id   text,
  stripe_subscription_id text,
  status               text not null check (status in ('trial', 'active', 'past_due', 'canceled')),
  current_period_start timestamptz,
  current_period_end   timestamptz,
  trial_ends_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_subscriptions_school_id on public.subscriptions(school_id);
create unique index if not exists idx_subscriptions_stripe_sub on public.subscriptions(stripe_subscription_id) where stripe_subscription_id is not null;

-- ── RLS subscriptions ─────────────────────────────────────────
alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (
    school_id = request_school_id()
    or request_role() = 'super_admin'
  );

-- Insert/update via service role (Stripe webhooks) uniquement
create policy "subscriptions_insert_service"
  on public.subscriptions for insert
  with check (request_role() = 'super_admin');

create policy "subscriptions_update_service"
  on public.subscriptions for update
  using (request_role() = 'super_admin');

-- ── Trigger updated_at ────────────────────────────────────────
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

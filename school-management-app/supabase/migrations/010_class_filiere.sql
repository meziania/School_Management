-- ============================================================
-- Migration 010 — Add filiere (Track) to classes table
-- ============================================================

alter table public.classes add column if not exists filiere text;

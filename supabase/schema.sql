-- 디지몬 덱 아카이브 — Supabase 데이터베이스 스키마
-- Supabase 대시보드 → SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.

create extension if not exists "pgcrypto";

-- ── 디지몬 보관함 ─────────────────────────────────────────
create table if not exists public.digimons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  owned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── 덱 목록 ───────────────────────────────────────────────
create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  tier text not null check (tier in ('S', 'A', 'B', 'C', 'D')),
  effect text not null default '',
  member_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists digimons_user_id_idx on public.digimons(user_id);
create index if not exists decks_user_id_idx on public.decks(user_id);

-- ── RLS: 본인 데이터만 읽고 쓸 수 있도록 제한 ───────────────
alter table public.digimons enable row level security;
alter table public.decks enable row level security;

drop policy if exists "digimons_select_own" on public.digimons;
create policy "digimons_select_own" on public.digimons
  for select using (auth.uid() = user_id);

drop policy if exists "digimons_insert_own" on public.digimons;
create policy "digimons_insert_own" on public.digimons
  for insert with check (auth.uid() = user_id);

drop policy if exists "digimons_update_own" on public.digimons;
create policy "digimons_update_own" on public.digimons
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "digimons_delete_own" on public.digimons;
create policy "digimons_delete_own" on public.digimons
  for delete using (auth.uid() = user_id);

drop policy if exists "decks_select_own" on public.decks;
create policy "decks_select_own" on public.decks
  for select using (auth.uid() = user_id);

drop policy if exists "decks_insert_own" on public.decks;
create policy "decks_insert_own" on public.decks
  for insert with check (auth.uid() = user_id);

drop policy if exists "decks_update_own" on public.decks;
create policy "decks_update_own" on public.decks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "decks_delete_own" on public.decks;
create policy "decks_delete_own" on public.decks
  for delete using (auth.uid() = user_id);

-- ── 실시간 동기화: 다른 기기에서의 변경을 즉시 반영 ─────────
alter publication supabase_realtime add table public.digimons;
alter publication supabase_realtime add table public.decks;

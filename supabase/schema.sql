-- 디지몬 덱 아카이브 — Supabase 데이터베이스 스키마 (v2: 공용 카탈로그 구조)
-- Supabase 대시보드 → SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.
--
-- 구조: 덱/디지몬 목록은 모든 로그인 사용자에게 공통으로 보이는 "카탈로그"이고,
-- 카탈로그를 추가/수정/삭제할 수 있는 사람은 관리자(ADMIN_USER_ID) 한 명뿐입니다.
-- "보유 여부"만 로그인한 사용자 각자 별도로 저장됩니다.

create extension if not exists "pgcrypto";

-- ── 디지몬 카탈로그 (전체 공용) ───────────────────────────────
create table if not exists public.digimons (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  image_url text,
  is_u_grade boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── 덱 카탈로그 (전체 공용) ───────────────────────────────────
create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  tier text not null check (tier in ('S', 'A', 'B', 'C', 'D')),
  description text not null default '',
  effect text not null default '',
  member_ids uuid[] not null default '{}',
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── 사용자별 즐겨찾기 ─────────────────────────────────────────
create table if not exists public.user_deck_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.decks(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, deck_id)
);

-- ── 사용자별 보유 여부 ────────────────────────────────────────
create table if not exists public.user_digimon_ownership (
  user_id uuid not null references auth.users(id) on delete cascade,
  digimon_id uuid not null references public.digimons(id) on delete cascade,
  owned boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, digimon_id)
);

-- 기존에 이미 만들어져 있던 테이블이라면 create table이 무시되므로,
-- 누락됐을 수 있는 컬럼을 안전하게 추가합니다.
alter table public.digimons add column if not exists image_url text;
alter table public.digimons add column if not exists is_u_grade boolean not null default false;
alter table public.decks add column if not exists description text not null default '';
alter table public.decks add column if not exists order_index integer not null default 0;

create index if not exists decks_name_idx on public.decks(name);
create index if not exists ownership_user_idx on public.user_digimon_ownership(user_id);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.digimons enable row level security;
alter table public.decks enable row level security;
alter table public.user_digimon_ownership enable row level security;
alter table public.user_deck_favorites enable row level security;

-- 관리자 UID: dddking17 계정으로 고정됨 (8bc3ac48-a1ea-42ab-8bcb-0a96b60a6eee)

-- 카탈로그 읽기: 로그인한 사람이면 누구나
drop policy if exists "digimons_read_all" on public.digimons;
create policy "digimons_read_all" on public.digimons for select using (auth.uid() is not null);
drop policy if exists "decks_read_all" on public.decks;
create policy "decks_read_all" on public.decks for select using (auth.uid() is not null);

-- 카탈로그 쓰기: 관리자만
drop policy if exists "digimons_admin_insert" on public.digimons;
create policy "digimons_admin_insert" on public.digimons for insert
  with check (auth.uid() = '8bc3ac48-a1ea-42ab-8bcb-0a96b60a6eee'::uuid);
drop policy if exists "digimons_admin_update" on public.digimons;
create policy "digimons_admin_update" on public.digimons for update
  using (auth.uid() = '8bc3ac48-a1ea-42ab-8bcb-0a96b60a6eee'::uuid)
  with check (auth.uid() = '8bc3ac48-a1ea-42ab-8bcb-0a96b60a6eee'::uuid);
drop policy if exists "digimons_admin_delete" on public.digimons;
create policy "digimons_admin_delete" on public.digimons for delete
  using (auth.uid() = '8bc3ac48-a1ea-42ab-8bcb-0a96b60a6eee'::uuid);

drop policy if exists "decks_admin_insert" on public.decks;
create policy "decks_admin_insert" on public.decks for insert
  with check (auth.uid() = '8bc3ac48-a1ea-42ab-8bcb-0a96b60a6eee'::uuid);
drop policy if exists "decks_admin_update" on public.decks;
create policy "decks_admin_update" on public.decks for update
  using (auth.uid() = '8bc3ac48-a1ea-42ab-8bcb-0a96b60a6eee'::uuid)
  with check (auth.uid() = '8bc3ac48-a1ea-42ab-8bcb-0a96b60a6eee'::uuid);
drop policy if exists "decks_admin_delete" on public.decks;
create policy "decks_admin_delete" on public.decks for delete
  using (auth.uid() = '8bc3ac48-a1ea-42ab-8bcb-0a96b60a6eee'::uuid);

-- 보유 여부: 각자 자기 것만 읽고 쓸 수 있음
drop policy if exists "ownership_select_own" on public.user_digimon_ownership;
create policy "ownership_select_own" on public.user_digimon_ownership
  for select using (auth.uid() = user_id);
drop policy if exists "ownership_insert_own" on public.user_digimon_ownership;
create policy "ownership_insert_own" on public.user_digimon_ownership
  for insert with check (auth.uid() = user_id);
drop policy if exists "ownership_update_own" on public.user_digimon_ownership;
create policy "ownership_update_own" on public.user_digimon_ownership
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "ownership_delete_own" on public.user_digimon_ownership;
create policy "ownership_delete_own" on public.user_digimon_ownership
  for delete using (auth.uid() = user_id);

-- 즐겨찾기: 각자 자기 것만 읽고 쓸 수 있음
drop policy if exists "favorites_select_own" on public.user_deck_favorites;
create policy "favorites_select_own" on public.user_deck_favorites
  for select using (auth.uid() = user_id);
drop policy if exists "favorites_insert_own" on public.user_deck_favorites;
create policy "favorites_insert_own" on public.user_deck_favorites
  for insert with check (auth.uid() = user_id);
drop policy if exists "favorites_delete_own" on public.user_deck_favorites;
create policy "favorites_delete_own" on public.user_deck_favorites
  for delete using (auth.uid() = user_id);

-- ── 실시간 동기화 ─────────────────────────────────────────────
-- 이미 등록되어 있으면 건너뛰도록 안전장치를 둬서, 여러 번 실행해도 에러 없이 안전합니다.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'digimons'
  ) then
    alter publication supabase_realtime add table public.digimons;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'decks'
  ) then
    alter publication supabase_realtime add table public.decks;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_digimon_ownership'
  ) then
    alter publication supabase_realtime add table public.user_digimon_ownership;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_deck_favorites'
  ) then
    alter publication supabase_realtime add table public.user_deck_favorites;
  end if;
end $$;

-- ── 디지몬 이미지 저장소 (카탈로그이므로 업로드는 관리자만) ─────
insert into storage.buckets (id, name, public)
values ('digimon-images', 'digimon-images', true)
on conflict (id) do nothing;

drop policy if exists "digimon_images_public_read" on storage.objects;
create policy "digimon_images_public_read" on storage.objects
  for select using (bucket_id = 'digimon-images');

drop policy if exists "digimon_images_own_insert" on storage.objects;
drop policy if exists "digimon_images_admin_insert" on storage.objects;
create policy "digimon_images_admin_insert" on storage.objects
  for insert with check (bucket_id = 'digimon-images' and auth.uid() = '8bc3ac48-a1ea-42ab-8bcb-0a96b60a6eee'::uuid);

drop policy if exists "digimon_images_own_update" on storage.objects;
drop policy if exists "digimon_images_admin_update" on storage.objects;
create policy "digimon_images_admin_update" on storage.objects
  for update using (bucket_id = 'digimon-images' and auth.uid() = '8bc3ac48-a1ea-42ab-8bcb-0a96b60a6eee'::uuid);

drop policy if exists "digimon_images_own_delete" on storage.objects;
drop policy if exists "digimon_images_admin_delete" on storage.objects;
create policy "digimon_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'digimon-images' and auth.uid() = '8bc3ac48-a1ea-42ab-8bcb-0a96b60a6eee'::uuid);

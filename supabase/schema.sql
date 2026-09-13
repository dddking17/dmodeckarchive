-- 디지몬 덱 아카이브 — Supabase 데이터베이스 스키마
-- Supabase 대시보드 → SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.

create extension if not exists "pgcrypto";

-- ── 디지몬 보관함 ─────────────────────────────────────────
create table if not exists public.digimons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  owned boolean not null default false,
  image_url text,
  created_at timestamptz not null default now()
);

-- 기존에 만든 테이블에 새 컬럼만 추가하는 경우를 위한 안전장치
alter table public.digimons add column if not exists image_url text;

-- ── 덱 목록 ───────────────────────────────────────────────
create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  tier text not null check (tier in ('S', 'A', 'B', 'C', 'D')),
  description text not null default '',
  effect text not null default '',
  member_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.decks add column if not exists description text not null default '';

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
-- 이미 등록되어 있으면 "already member of publication" 에러가 뜨는데,
-- 정상입니다 (이미 설정 완료라는 뜻) — 무시하고 넘어가세요.
alter publication supabase_realtime add table public.digimons;
alter publication supabase_realtime add table public.decks;

-- ── 디지몬 이미지 저장소 ─────────────────────────────────────
-- 버킷을 대시보드(Storage → New bucket)에서 이미 만들었다면 이 insert는 건너뛰어도 됩니다.
insert into storage.buckets (id, name, public)
values ('digimon-images', 'digimon-images', true)
on conflict (id) do nothing;

-- 이미지는 누구나 볼 수 있어야 하므로(<img> 태그로 그냥 불러오는 용도) 읽기는 공개,
-- 업로드/수정/삭제는 "자기 폴더(user_id/파일명)"에만 가능하도록 제한합니다.
drop policy if exists "digimon_images_public_read" on storage.objects;
create policy "digimon_images_public_read" on storage.objects
  for select using (bucket_id = 'digimon-images');

drop policy if exists "digimon_images_own_insert" on storage.objects;
create policy "digimon_images_own_insert" on storage.objects
  for insert with check (
    bucket_id = 'digimon-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "digimon_images_own_update" on storage.objects;
create policy "digimon_images_own_update" on storage.objects
  for update using (
    bucket_id = 'digimon-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "digimon_images_own_delete" on storage.objects;
create policy "digimon_images_own_delete" on storage.objects
  for delete using (
    bucket_id = 'digimon-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

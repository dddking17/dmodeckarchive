-- 1회성 마이그레이션: 개인별 저장 → 공용 카탈로그 구조로 전환
-- 이미 seed_decks.sql / update_deck_details.sql 을 실행해서 데이터가 들어있는 상태에서 실행하세요.
-- 이 파일을 실행한 "다음"에 schema.sql(v2)을 실행해서 새 보안 규칙을 적용해야 합니다.

-- 1) 기존 개인별 RLS 정책 제거 (user_id 컬럼을 참조하고 있어서 먼저 지워야 컬럼 삭제 가능)
drop policy if exists "digimons_select_own" on public.digimons;
drop policy if exists "digimons_insert_own" on public.digimons;
drop policy if exists "digimons_update_own" on public.digimons;
drop policy if exists "digimons_delete_own" on public.digimons;
drop policy if exists "decks_select_own" on public.decks;
drop policy if exists "decks_insert_own" on public.decks;
drop policy if exists "decks_update_own" on public.decks;
drop policy if exists "decks_delete_own" on public.decks;

-- 2) 보유 여부를 저장할 새 테이블 (schema.sql에도 있지만 데이터 이관을 위해 먼저 생성)
create table if not exists public.user_digimon_ownership (
  user_id uuid not null references auth.users(id) on delete cascade,
  digimon_id uuid not null references public.digimons(id) on delete cascade,
  owned boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, digimon_id)
);

-- 3) 기존에 "보유"로 체크해뒀던 디지몬을 새 보유 테이블로 이관 (관리자 UID 필요)
do $$
declare
  v_admin_id uuid := '8bc3ac48-a1ea-42ab-8bcb-0a96b60a6eee'; -- 관리자(dddking17) UID
begin
  insert into public.user_digimon_ownership (user_id, digimon_id, owned)
  select v_admin_id, id, true
  from public.digimons
  where owned = true
  on conflict (user_id, digimon_id) do nothing;
end $$;

-- 4) 이제 필요 없어진 컬럼 정리 → 공용 카탈로그화
alter table public.digimons drop column if exists owned;
alter table public.digimons drop column if exists user_id;
alter table public.decks drop column if exists user_id;

-- 여기까지 실행했다면, 이어서 schema.sql(v2) 전체를 실행해서
-- 새로운 읽기/쓰기 보안 규칙을 적용하세요.

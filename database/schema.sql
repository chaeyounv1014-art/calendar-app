-- ============================================================
-- 모임 일정 조율 캘린더 - Supabase 스키마
-- 기존 "my_mbti_app"과 동일한 Supabase 프로젝트를 재사용합니다.
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 실행하세요.
-- (mbti_results 테이블/함수와는 독립적으로 동작하며, 서로 영향을 주지 않습니다.)
-- ============================================================

create extension if not exists pgcrypto;

-- 방(일정 조율 이벤트) 하나 = 특정 연/월을 조율하는 하나의 캘린더
create table if not exists public.schedule_rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 60),
  target_year integer not null check (target_year between 2000 and 2100),
  target_month integer not null check (target_month between 1 and 12),
  created_at timestamptz not null default now()
);

comment on table public.schedule_rooms is '일정 조율 방 (제목 + 대상 연/월)';
comment on column public.schedule_rooms.title is '방 제목 (예: "8월 여행 날짜 정하기")';
comment on column public.schedule_rooms.target_year is '조율 대상 연도 (예: 2026)';
comment on column public.schedule_rooms.target_month is '조율 대상 월 (1-12)';

-- 참여자 한 명이 한 방에 대해 제출한 "그 달 전체"의 가능 여부 맵
-- day_states 예시: {"1": "full", "2": "half", "5": "unavailable"}
-- 키는 해당 월의 일(day) 숫자를 문자열로, 값은 full/half/unavailable 중 하나.
create table if not exists public.schedule_entries (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.schedule_rooms(id) on delete cascade,
  participant_name text not null check (char_length(trim(participant_name)) between 1 and 20),
  day_states jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint schedule_entries_room_participant_unique unique (room_id, participant_name)
);

comment on table public.schedule_entries is '참여자 1명의 방(room) 기준 월간 가능 여부 제출 데이터';
comment on column public.schedule_entries.participant_name is '참여자 표시 이름 (로그인 없이 직접 입력, 동일 이름 = 동일 참여자로 간주)';
comment on column public.schedule_entries.day_states is '일자(문자열 키, 1~31) -> "full" | "half" | "unavailable"';

create index if not exists schedule_entries_room_id_idx
  on public.schedule_entries (room_id);

-- 재제출/수정 시각 자동 갱신
create or replace function public.schedule_entries_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists schedule_entries_set_updated_at_trigger on public.schedule_entries;
create trigger schedule_entries_set_updated_at_trigger
  before update on public.schedule_entries
  for each row
  execute function public.schedule_entries_set_updated_at();

-- Row Level Security 활성화
alter table public.schedule_rooms enable row level security;
alter table public.schedule_entries enable row level security;

-- ------------------------------------------------------------
-- 정책: 이 앱은 로그인이 없는 "링크만 알면 누구나 참여 가능한" 도구입니다.
-- (Doodle/When2Meet과 동일한 구조) 방 생성/조회, 응답 생성/조회/수정을
-- anon 역할에 열어둡니다. 같은 이름을 입력하면 같은 참여자로 간주되어
-- 본인 응답을 덮어쓸 수 있는데, 이는 로그인 없는 MVP의 의도된
-- 트레이드오프입니다 (README에 명시).
-- ------------------------------------------------------------

drop policy if exists "Allow anonymous select rooms" on public.schedule_rooms;
create policy "Allow anonymous select rooms"
  on public.schedule_rooms
  for select
  to anon
  using (true);

drop policy if exists "Allow anonymous insert rooms" on public.schedule_rooms;
create policy "Allow anonymous insert rooms"
  on public.schedule_rooms
  for insert
  to anon
  with check (true);

drop policy if exists "Allow anonymous select entries" on public.schedule_entries;
create policy "Allow anonymous select entries"
  on public.schedule_entries
  for select
  to anon
  using (true);

drop policy if exists "Allow anonymous insert entries" on public.schedule_entries;
create policy "Allow anonymous insert entries"
  on public.schedule_entries
  for insert
  to anon
  with check (true);

drop policy if exists "Allow anonymous update entries" on public.schedule_entries;
create policy "Allow anonymous update entries"
  on public.schedule_entries
  for update
  to anon
  using (true)
  with check (true);

-- 참여자 삭제 허용 (유령/오타 참여자가 결과 캘린더를 막는 문제 해결용)
drop policy if exists "Allow anonymous delete entries" on public.schedule_entries;
create policy "Allow anonymous delete entries"
  on public.schedule_entries
  for delete
  to anon
  using (true);

-- ============================================================
-- 시간 투표: "되는 날"을 골라 몇 시에 볼지 정한다 (시계 드래그)
-- slots 예시: ["11","12","13"] (가능한 시각 0~23을 문자열로)
-- ============================================================

create table if not exists public.schedule_time_votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.schedule_rooms(id) on delete cascade,
  day integer not null check (day between 1 and 31),
  participant_name text not null check (char_length(trim(participant_name)) between 1 and 20),
  slots jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint schedule_time_votes_unique unique (room_id, day, participant_name)
);

comment on table public.schedule_time_votes is '되는 날 하루에 대한 참여자별 가능 시간대 투표';
comment on column public.schedule_time_votes.slots is '가능한 시(hour, 0~23)의 문자열 배열. 예: ["11","12","13"]';

create index if not exists schedule_time_votes_room_id_idx
  on public.schedule_time_votes (room_id);

drop trigger if exists schedule_time_votes_set_updated_at_trigger on public.schedule_time_votes;
create trigger schedule_time_votes_set_updated_at_trigger
  before update on public.schedule_time_votes
  for each row
  execute function public.schedule_entries_set_updated_at();

alter table public.schedule_time_votes enable row level security;

drop policy if exists "Allow anonymous select time votes" on public.schedule_time_votes;
create policy "Allow anonymous select time votes"
  on public.schedule_time_votes
  for select
  to anon
  using (true);

drop policy if exists "Allow anonymous insert time votes" on public.schedule_time_votes;
create policy "Allow anonymous insert time votes"
  on public.schedule_time_votes
  for insert
  to anon
  with check (true);

drop policy if exists "Allow anonymous update time votes" on public.schedule_time_votes;
create policy "Allow anonymous update time votes"
  on public.schedule_time_votes
  for update
  to anon
  using (true)
  with check (true);

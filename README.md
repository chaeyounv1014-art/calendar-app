# 언제볼까? (Schedule Calendar)

여행·모임 날짜 정하기가 어려운 그룹을 위한 초경량 일정 조율 도구입니다.
방을 만들고 링크를 공유하면, 각자 그 달 캘린더에 **O(종일 가능) / △(일부
가능) / ✕(불가)** 만 표시하면 됩니다. 모두의 입력을 합쳐 "다 같이 되는
날짜"를 자동으로 찾아 보여줍니다.

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS 3
- **Backend**: Supabase (my_mbti_app과 동일한 프로젝트 재사용)

## 1. 시작하기

### 1-1. 의존성 설치

```bash
npm install
```

### 1-2. 환경 변수 확인

`.env.local`에 my_mbti_app과 동일한 Supabase 프로젝트 정보가 채워져
있습니다. 다른 프로젝트를 쓰려면 `.env.local.example`을 참고해 교체하세요.

### 1-3. Supabase 테이블 생성 (필수)

Supabase 대시보드 → **SQL Editor** 에서 [database/schema.sql](database/schema.sql)
내용 전체를 실행하세요. 아래가 생성됩니다.

- `schedule_rooms`: 방(제목 + 조율 대상 연/월)
- `schedule_entries`: 참여자별 월간 가능 여부(jsonb), `(room_id, participant_name)`
  unique 제약으로 "같은 이름 재저장 = 본인 입력 덮어쓰기" 구현
- RLS 정책: 익명 사용자에게 방 조회/생성, 응답 조회/생성/수정 허용

기존 `mbti_results` 테이블과는 완전히 독립적이며 서로 영향을 주지 않습니다.

### 1-4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속. (my_mbti_app 서버가 3000번 포트를
사용 중이면 Next.js가 자동으로 3001을 사용합니다 — 터미널에 표시되는 주소를
확인하세요.)

## 2. 사용 흐름

1. **홈**: 열려있는 방 목록 확인 → 방 클릭으로 입장하거나 "새 방 만들기"
2. **방 생성**: 제목 + 조율할 달(연/월) 선택
3. **방 입장**: 처음이면 이름 입력 (같은 브라우저 재방문 시 자동 인식,
   다른 기기에서도 같은 이름을 입력하면 이어서 수정 가능)
4. **내 캘린더 입력**: 날짜 클릭할 때마다 ○ → △ → ✕ → 빈칸 순환, "저장하기"
5. **모두가 되는 날**: 저장 즉시(또는 새로고침 시) 병합 결과 캘린더 갱신

## 3. 병합 규칙 (핵심 로직)

`src/lib/schedule/merge.ts` — 날짜별로:

- 참여자 중 **한 명이라도** 그 날짜를 입력하지 않았거나 ✕로 표시 → **제외** (일반 빈 칸)
- 전원이 ○ → **초록 배경** + ○ 아이콘 + 전체 이름 표시
- ○와 △ 혼합(또는 전원 △) → **노랑 배경** + 상태 그룹별 줄 표시 (예: ○ B D / △ A C)

누군가 나중에 입력을 추가/수정하면 페이지를 다시 불러올 때 결과가 재계산됩니다
(실시간 동기화 대신 단순한 새로고침 반영 방식 채택).

## 4. 프로젝트 구조

```
src/
  app/
    page.tsx                    # 홈: 방 목록
    rooms/new/page.tsx           # 방 생성
    rooms/[roomId]/page.tsx      # 방 상세 (서버에서 room/entries 조회 + 병합 계산)
    layout.tsx / globals.css / icon.tsx / not-found.tsx
  components/
    home/RoomCard.tsx
    rooms/RoomView.tsx           # 이름 게이트 → 입력/결과 화면 전환
    rooms/NameGate.tsx           # 최초 입장 시 이름 입력
    rooms/MonthCalendarInput.tsx # 클릭 순환 입력 캘린더 + 저장(upsert)
    rooms/MergedCalendar.tsx     # 병합 결과 캘린더
    rooms/DayCell.tsx            # 입력용/결과용 날짜 셀
    rooms/ParticipantList.tsx / StatusLegend.tsx / SaveBar.tsx
    ui/GradientBackdrop.tsx / Badge.tsx
  lib/
    supabase.ts                  # Supabase 클라이언트 + 테이블 상수
    schedule/merge.ts            # 병합 알고리즘 (순수 함수)
    schedule/month.ts            # 달력 날짜 계산 (임의 연/월, 윤년 자동 처리)
    schedule/storage.ts          # localStorage 이름 저장
  types/schedule.ts
database/schema.sql
```

## 5. 알려진 한계 (의도된 설계)

로그인이 없는 초경량 도구이므로:

- 링크(방)를 아는 사람은 누구나 모든 참여자의 이름과 입력을 볼 수 있습니다.
- 같은 이름을 입력하면 같은 참여자로 간주됩니다. 이름을 아는 타인이 대신
  수정할 수 있다는 뜻이기도 합니다 — 신뢰 기반의 소규모 그룹용입니다.
- 이름은 앞뒤 공백만 정리(trim)하며 대소문자는 구분합니다 ("Kim" ≠ "kim").

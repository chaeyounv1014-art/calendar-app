import type {
  DayState,
  MergedDayGroup,
  MergedDayResult,
  MergedMonthResult,
  ScheduleEntryRow,
} from "@/types/schedule";
import { getDaysInMonth } from "./month";

/**
 * 모든 참여자의 날짜별 상태를 하나의 결과 캘린더로 병합한다.
 *
 * 규칙 (기획 확정 사항):
 * - 참여자가 0명이면 모든 날짜 제외.
 * - 어느 한 명이라도 그 날짜를 입력하지 않았거나 X(unavailable)로
 *   표시했으면 그 날짜는 제외.
 * - 전원이 O(full)면 all-full (초록), O와 세모가 섞이거나 전원 세모면
 *   mixed (노랑)로 분류하고, 상태별로 이름을 그룹핑한다.
 */
export function mergeMonthEntries(
  entries: ScheduleEntryRow[],
  year: number,
  month: number
): MergedMonthResult {
  const daysInMonth = getDaysInMonth(year, month);
  const days: Record<number, MergedDayResult> = {};

  for (let day = 1; day <= daysInMonth; day++) {
    days[day] = computeDay(entries, day);
  }

  return {
    year,
    month,
    daysInMonth,
    days,
    participantCount: entries.length,
  };
}

function computeDay(
  entries: ScheduleEntryRow[],
  day: number
): MergedDayResult {
  if (entries.length === 0) {
    return { included: false };
  }

  const key = String(day);
  const states: DayState[] = [];

  for (const entry of entries) {
    const state = entry.day_states[key];
    if (state === undefined || state === "unavailable") {
      return { included: false };
    }
    states.push(state);
  }

  const fullNames: string[] = [];
  const halfNames: string[] = [];
  entries.forEach((entry, i) => {
    if (states[i] === "full") {
      fullNames.push(entry.participant_name);
    } else {
      halfNames.push(entry.participant_name);
    }
  });

  const groups: MergedDayGroup[] = [];
  if (fullNames.length > 0) groups.push({ state: "full", names: fullNames });
  if (halfNames.length > 0) groups.push({ state: "half", names: halfNames });

  return {
    included: true,
    level: halfNames.length === 0 ? "all-full" : "mixed",
    groups,
  };
}

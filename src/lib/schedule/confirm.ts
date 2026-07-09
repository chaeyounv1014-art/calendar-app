import type { ConfirmedSlot, ScheduleRoomRow } from "@/types/schedule";
import { formatHour } from "./timeSlots";

export type ConfirmedSlotMap = Record<string, ConfirmedSlot>;

// DB의 confirmed_slots(jsonb)를 안전하게 정리. 비어 있으면
// 예전 단일 확정(confirmed_day/hour)을 같은 형태로 변환해 준다.
export function parseConfirmedSlots(room: ScheduleRoomRow): ConfirmedSlotMap {
  const map: ConfirmedSlotMap = {};
  const raw = room.confirmed_slots;

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [key, value] of Object.entries(raw)) {
      const day = Number(key);
      const start = Number((value as { start?: unknown })?.start);
      const end = Number((value as { end?: unknown })?.end);
      if (
        Number.isInteger(day) &&
        day >= 1 &&
        day <= 31 &&
        Number.isInteger(start) &&
        start >= 0 &&
        start <= 23 &&
        Number.isInteger(end) &&
        end >= start &&
        end <= 24
      ) {
        map[String(day)] = { start, end };
      }
    }
  }

  if (Object.keys(map).length === 0 && room.confirmed_day != null) {
    const hour = room.confirmed_hour ?? 12;
    map[String(room.confirmed_day)] = { start: hour, end: hour };
  }

  return map;
}

export function confirmedDays(map: ConfirmedSlotMap): number[] {
  return Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b);
}

// 이어진 날짜들은 하나의 여행 구간으로 묶는다.
// 시작 = 첫날 확정 시각, 끝 = 마지막 날 확정 시각.
// 예: 5일 12시 + 6일 12시 확정 -> "5일 낮 12시 ~ 6일 낮 12시" (1박 2일)
export interface ConfirmedSegment {
  startDay: number;
  startHour: number;
  endDay: number;
  endHour: number;
}

export function buildConfirmedSegments(
  map: ConfirmedSlotMap
): ConfirmedSegment[] {
  const segments: ConfirmedSegment[] = [];
  for (const day of confirmedDays(map)) {
    const slot = map[String(day)];
    const last = segments[segments.length - 1];
    if (last && day === last.endDay + 1) {
      last.endDay = day;
      last.endHour = slot.end;
    } else {
      segments.push({
        startDay: day,
        startHour: slot.start,
        endDay: day,
        endHour: slot.end,
      });
    }
  }
  return segments;
}

// "5일 낮 12시 ~ 6일 오후 6시" / "5일 낮 12시~오후 3시" / "5일 낮 12시"
export function segmentText(seg: ConfirmedSegment): string {
  if (seg.startDay === seg.endDay) {
    if (seg.startHour === seg.endHour) {
      return `${seg.startDay}일 ${formatHour(seg.startHour)}`;
    }
    return `${seg.startDay}일 ${formatHour(seg.startHour)}~${formatHour(seg.endHour)}`;
  }
  return `${seg.startDay}일 ${formatHour(seg.startHour)} ~ ${seg.endDay}일 ${formatHour(seg.endHour)}`;
}

export function confirmedSummaryText(map: ConfirmedSlotMap): string {
  return buildConfirmedSegments(map).map(segmentText).join(", ");
}

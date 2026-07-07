import type { TimeVoteRow } from "@/types/schedule";

// DB에는 가능한 시(hour, 0~23)를 문자열 배열로 저장한다. 예: ["11","12","13"]
// (예전 형식인 "morning" 같은 값이 남아 있어도 숫자가 아니므로 그냥 무시된다)
export function parseHourSlots(slots: unknown): number[] {
  if (!Array.isArray(slots)) return [];
  const hours = new Set<number>();
  for (const s of slots) {
    const h = Number(s);
    if (Number.isInteger(h) && h >= 0 && h <= 23) hours.add(h);
  }
  return [...hours].sort((a, b) => a - b);
}

export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  if (h === 0) return "밤 12시";
  if (h === 12) return "낮 12시";
  return h < 12 ? `오전 ${h}시` : `오후 ${h - 12}시`;
}

// 선택된 시들을 "오전 11시~오후 5시" 같은 구간 문장으로 만든다.
// 11,12,13 선택 = 11시부터 14시까지이므로 끝은 마지막 시 + 1.
export function hoursToRangeText(hours: number[]): string {
  const set = new Set(hours);
  if (set.size === 0) return "";
  if (set.size === 24) return "하루 종일";

  const runs: Array<{ start: number; end: number }> = [];
  const sorted = [...set].sort((a, b) => a - b);
  for (const h of sorted) {
    const last = runs[runs.length - 1];
    if (last && h === last.end + 1) {
      last.end = h;
    } else {
      runs.push({ start: h, end: h });
    }
  }

  // 23시 구간과 0시 구간이 이어지면 자정을 넘는 하나의 구간으로 합친다
  if (runs.length > 1) {
    const first = runs[0];
    const last = runs[runs.length - 1];
    if (first.start === 0 && last.end === 23) {
      first.start = last.start;
      runs.pop();
    }
  }

  return runs
    .map((r) => `${formatHour(r.start)}~${formatHour(r.end + 1)}`)
    .join(", ");
}

// 시간별로 몇 명이 가능한지 센다 (결과 시계 색칠용)
export function buildHourCounts(votes: TimeVoteRow[]): number[] {
  const counts = new Array<number>(24).fill(0);
  for (const vote of votes) {
    for (const h of parseHourSlots(vote.slots)) {
      counts[h] += 1;
    }
  }
  return counts;
}

// 그 날 되는 사람 전원이 가능하다고 표시한 시간들
export function allAvailableHours(
  votes: TimeVoteRow[],
  participants: string[]
): number[] {
  if (participants.length === 0) return [];

  const byName = new Map(
    votes.map((v) => [v.participant_name, new Set(parseHourSlots(v.slots))])
  );

  const result: number[] = [];
  for (let h = 0; h < 24; h++) {
    if (participants.every((name) => byName.get(name)?.has(h))) {
      result.push(h);
    }
  }
  return result;
}

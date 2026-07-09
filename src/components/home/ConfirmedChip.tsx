"use client";

import { useEffect, useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// [5,6] -> "5~6", [5,9] -> "5, 9", [5] -> "5"
function daysLabel(days: number[]): string {
  const runs: Array<{ start: number; end: number }> = [];
  for (const d of days) {
    const last = runs[runs.length - 1];
    if (last && d === last.end + 1) {
      last.end = d;
    } else {
      runs.push({ start: d, end: d });
    }
  }
  return runs
    .map((r) => (r.start === r.end ? `${r.start}` : `${r.start}~${r.end}`))
    .join(", ");
}

// 홈 방 목록에서 확정된 약속을 알려주는 작은 뱃지 (D-데이 포함)
export default function ConfirmedChip({
  year,
  month,
  days,
}: {
  year: number;
  month: number;
  days: number[];
}) {
  const [dday, setDday] = useState<number | null>(null);
  const firstDay = days[0];

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(year, month - 1, firstDay);
    setDday(Math.round((target.getTime() - today.getTime()) / 86400000));
  }, [year, month, firstDay]);

  const weekday =
    days.length === 1
      ? `(${WEEKDAYS[new Date(year, month - 1, firstDay).getDay()]})`
      : "";
  const ddayLabel =
    dday === null
      ? ""
      : dday === 0
        ? " · 오늘!"
        : dday > 0
          ? ` · D-${dday}`
          : ` · D+${Math.abs(dday)}`;

  return (
    <span className="rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 px-2.5 py-1 font-semibold text-white">
      🎉 {month}/{daysLabel(days)}
      {weekday} 확정{ddayLabel}
    </span>
  );
}

"use client";

import { useEffect, useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 홈 방 목록에서 확정된 약속을 알려주는 작은 뱃지 (D-데이 포함)
export default function ConfirmedChip({
  year,
  month,
  day,
}: {
  year: number;
  month: number;
  day: number;
}) {
  const [dday, setDday] = useState<number | null>(null);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(year, month - 1, day);
    setDday(Math.round((target.getTime() - today.getTime()) / 86400000));
  }, [year, month, day]);

  const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];
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
      🎉 {month}/{day}({weekday}) 확정{ddayLabel}
    </span>
  );
}

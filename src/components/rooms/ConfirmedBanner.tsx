"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScheduleRoomRow } from "@/types/schedule";
import { formatHour } from "@/lib/schedule/timeSlots";
import { supabase, ROOMS_TABLE } from "@/lib/supabase";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function ConfirmedBanner({ room }: { room: ScheduleRoomRow }) {
  const router = useRouter();
  const [dday, setDday] = useState<number | null>(null);
  const [canceling, setCanceling] = useState(false);

  const day = room.confirmed_day;

  // D-데이는 보는 사람 컴퓨터의 오늘 날짜 기준으로 계산
  useEffect(() => {
    if (day == null) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(room.target_year, room.target_month - 1, day);
    setDday(Math.round((target.getTime() - today.getTime()) / 86400000));
  }, [room.target_year, room.target_month, day]);

  if (day == null) return null;

  const weekday =
    WEEKDAYS[new Date(room.target_year, room.target_month - 1, day).getDay()];

  const ddayLabel =
    dday === null
      ? ""
      : dday === 0
        ? "🎊 오늘!"
        : dday > 0
          ? `D-${dday}`
          : `D+${Math.abs(dday)}`;

  const handleCancel = async () => {
    if (canceling) return;
    const ok = window.confirm(
      "약속 확정을 취소할까요?\n확정 카드가 사라지고 다시 조율 상태로 돌아가요."
    );
    if (!ok) return;

    setCanceling(true);
    const { data, error } = await supabase
      .from(ROOMS_TABLE)
      .update({ confirmed_day: null, confirmed_hour: null })
      .eq("id", room.id)
      .select();

    if (error || !data || data.length === 0) {
      console.error(
        "[room] failed to cancel confirmation:",
        error?.message ?? "no rows updated (RLS update policy missing?)"
      );
      window.alert("취소에 실패했어요. 잠시 후 다시 시도해주세요.");
      setCanceling(false);
      return;
    }

    setCanceling(false);
    router.refresh();
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 p-5 text-white shadow-xl shadow-indigo-300/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-widest text-indigo-100">
            🎉 약속 확정!
          </span>
          <p className="text-2xl font-black leading-tight">
            {room.target_month}월 {day}일 ({weekday})
            {room.confirmed_hour != null && (
              <span className="text-cyan-100">
                {" "}
                {formatHour(room.confirmed_hour)}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {ddayLabel && (
            <span className="rounded-full bg-white/25 px-3.5 py-1.5 text-sm font-black">
              {ddayLabel}
            </span>
          )}
          <button
            type="button"
            onClick={handleCancel}
            disabled={canceling}
            className="text-[11px] text-indigo-100 underline underline-offset-2 transition-colors hover:text-white disabled:opacity-50"
          >
            확정 취소
          </button>
        </div>
      </div>
    </section>
  );
}

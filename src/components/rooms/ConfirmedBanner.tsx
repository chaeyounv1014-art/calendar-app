"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ScheduleRoomRow } from "@/types/schedule";
import {
  parseConfirmedSlots,
  confirmedDays,
  buildConfirmedSegments,
  segmentText,
  parseConfirmedPlaces,
  type ConfirmedPlace,
} from "@/lib/schedule/confirm";
import { supabase, ROOMS_TABLE } from "@/lib/supabase";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function ConfirmedBanner({ room }: { room: ScheduleRoomRow }) {
  const router = useRouter();
  const [dday, setDday] = useState<number | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [removingName, setRemovingName] = useState<string | null>(null);

  const slotMap = parseConfirmedSlots(room);
  const days = confirmedDays(slotMap);
  const firstDay = days.length > 0 ? days[0] : null;
  const places = parseConfirmedPlaces(room);

  // D-데이는 보는 사람 컴퓨터의 오늘 날짜 기준, 첫 확정일까지
  useEffect(() => {
    if (firstDay === null) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(
      room.target_year,
      room.target_month - 1,
      firstDay
    );
    setDday(Math.round((target.getTime() - today.getTime()) / 86400000));
  }, [room.target_year, room.target_month, firstDay]);

  if (firstDay === null) return null;

  const segments = buildConfirmedSegments(slotMap);
  const weekday =
    WEEKDAYS[
      new Date(room.target_year, room.target_month - 1, firstDay).getDay()
    ];

  // 확정된 구간을 한 줄씩 아래로 쌓아서 표시 (첫 줄에만 월, 하루면 요일도)
  const lines = segments.map(segmentText);
  if (days.length === 1) {
    lines[0] = lines[0].replace(`${firstDay}일`, `${firstDay}일 (${weekday})`);
  }
  lines[0] = `${room.target_month}월 ${lines[0]}`;

  const ddayLabel =
    dday === null
      ? ""
      : dday === 0
        ? "🎊 오늘!"
        : dday > 0
          ? `D-${dday}`
          : `D+${Math.abs(dday)}`;

  const handleShare = async () => {
    const placeLine = places.map((pl) => `\n📍 ${pl.name}`).join("");
    const message = `🎉 "${room.title}" 약속 확정!\n📅 ${lines.join("\n📅 ")}${placeLine}\n👉 ${window.location.href}`;

    const isTouchDevice = navigator.maxTouchPoints > 0;
    if (isTouchDevice && navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch {
        // 공유 창을 그냥 닫은 경우
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("아래 내용을 복사해서 보내세요!", message);
    }
  };

  const handleRemovePlace = async (target: ConfirmedPlace) => {
    if (removingName) return;
    const ok = window.confirm(`'${target.name}'을(를) 확정 장소에서 뺄까요?`);
    if (!ok) return;

    setRemovingName(target.name);
    const next = places.filter((pl) => pl.name !== target.name);
    const { data, error } = await supabase
      .from(ROOMS_TABLE)
      .update({ confirmed_place: next })
      .eq("id", room.id)
      .select();

    if (error || !data || data.length === 0) {
      console.error(
        "[room] failed to remove place:",
        error?.message ?? "no rows updated"
      );
      window.alert("삭제에 실패했어요. 잠시 후 다시 시도해주세요.");
      setRemovingName(null);
      return;
    }

    setRemovingName(null);
    router.refresh();
  };

  const handleCancel = async () => {
    if (canceling) return;
    const ok = window.confirm(
      "약속 확정을 모두 취소할까요?\n확정 카드가 사라지고 다시 조율 상태로 돌아가요."
    );
    if (!ok) return;

    setCanceling(true);
    const { data, error } = await supabase
      .from(ROOMS_TABLE)
      .update({
        confirmed_slots: {},
        confirmed_day: null,
        confirmed_hour: null,
        confirmed_place: null,
      })
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
    <>
      {/* 본문 오른쪽 옆에 떠서 스크롤을 따라오는 미니 확정 카드 (넓은 화면 전용) */}
      <aside className="fixed left-1/2 top-28 z-30 ml-60 hidden w-56 flex-col gap-1.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 p-4 text-white shadow-xl shadow-indigo-300/60 xl:flex">
        <span className="text-[10px] font-bold tracking-widest text-indigo-100">
          🎉 약속 확정!
        </span>
        {lines.map((line) => (
          <p key={line} className="text-sm font-black leading-tight">
            {line}
          </p>
        ))}
        {places.map((pl, i) => (
          <p key={pl.name} className="text-[11px] font-semibold text-cyan-100">
            {places.length > 1 ? `${i + 1}. ` : ""}
            {pl.name}
          </p>
        ))}
        {ddayLabel && (
          <span className="mt-1 w-fit rounded-full bg-white/25 px-2.5 py-1 text-xs font-black">
            {ddayLabel}
          </span>
        )}
      </aside>

      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 p-5 text-white shadow-xl shadow-indigo-300/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold tracking-widest text-indigo-100">
            🎉 약속 확정!
          </span>
          <div className="flex flex-col gap-0.5">
            {lines.map((line) => (
              <p key={line} className="text-2xl font-black leading-tight">
                {line}
              </p>
            ))}
          </div>
          {places.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {places.map((pl, i) => (
                <p
                  key={pl.name}
                  className="flex items-center gap-1.5 text-sm font-bold text-cyan-100"
                >
                  <span>
                    {places.length > 1 ? `${i + 1}. ` : ""}
                    {pl.url ? (
                      <a
                        href={pl.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-2 hover:text-white"
                      >
                        {pl.name}
                      </a>
                    ) : (
                      pl.name
                    )}
                    {pl.address && (
                      <span className="text-xs font-normal text-indigo-100">
                        {" "}
                        · {pl.address}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePlace(pl)}
                    disabled={removingName !== null}
                    aria-label={`${pl.name} 삭제`}
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-indigo-200 transition-colors hover:bg-white/25 hover:text-white disabled:opacity-50"
                  >
                    ✕
                  </button>
                </p>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/25 px-4 py-2 text-xs font-bold text-white transition-all duration-150 hover:bg-white/40 active:scale-95"
          >
            {copied ? "✅ 복사 완료! 카톡에 붙여넣으세요" : "📤 확정 알리기"}
          </button>
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
    </>
  );
}

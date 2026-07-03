"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, ROOMS_TABLE } from "@/lib/supabase";
import {
  monthInputValueToParts,
  partsToMonthInputValue,
} from "@/lib/schedule/month";

function defaultMonthValue(): string {
  const now = new Date();
  return partsToMonthInputValue(now.getFullYear(), now.getMonth() + 1);
}

export default function NewRoomForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [monthValue, setMonthValue] = useState(defaultMonthValue);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage("방 제목을 입력해주세요.");
      return;
    }
    if (!monthValue) {
      setErrorMessage("조율할 달을 선택해주세요.");
      return;
    }

    const { year, month } = monthInputValueToParts(monthValue);
    if (!year || !month) {
      setErrorMessage("달 형식이 올바르지 않아요. 다시 선택해주세요.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from(ROOMS_TABLE)
      .insert({
        title: trimmedTitle,
        target_year: year,
        target_month: month,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("[rooms/new] failed to create room:", error?.message);
      setErrorMessage("방 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
      return;
    }

    router.push(`/rooms/${data.id}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-indigo-950/40 backdrop-blur-xl sm:p-8"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="room-title"
          className="text-sm font-bold text-white/80"
        >
          방 제목
        </label>
        <input
          id="room-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder="예: 8월 제주도 여행 날짜 정하기"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-cyan-400/60 focus:bg-cyan-400/5"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="room-month"
          className="text-sm font-bold text-white/80"
        >
          조율할 달
        </label>
        <input
          id="room-month"
          type="month"
          value={monthValue}
          onChange={(e) => setMonthValue(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-400/60 focus:bg-cyan-400/5 [color-scheme:dark]"
        />
        <p className="text-xs text-white/40">
          참여자들이 이 달의 캘린더에 가능한 날을 표시하게 돼요.
        </p>
      </div>

      {errorMessage && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-900/50 transition-all duration-200 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
      >
        {submitting ? "만드는 중..." : "방 만들기 ➔"}
      </button>
    </form>
  );
}

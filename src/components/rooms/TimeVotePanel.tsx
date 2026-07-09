"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TimeVoteRow } from "@/types/schedule";
import {
  parseHourSlots,
  hoursToRangeText,
  buildHourCounts,
  allAvailableHours,
  formatHour,
} from "@/lib/schedule/timeSlots";
import { supabase, TIME_VOTES_TABLE, ROOMS_TABLE } from "@/lib/supabase";
import { ClockDialInput, ClockDialResult } from "./ClockDial";

// 연속된 날짜는 "5~6일"처럼 묶어서 표시 (여행 등 여러 날 약속용)
function daysRangeLabel(days: number[]): string {
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
    .map((r) => (r.start === r.end ? `${r.start}일` : `${r.start}~${r.end}일`))
    .join(", ");
}

export default function TimeVotePanel({
  roomId,
  month,
  days,
  participantName,
  participantsByDay,
  votes,
  onClose,
}: {
  roomId: string;
  month: number;
  days: number[];
  participantName: string;
  participantsByDay: Record<number, string[]>;
  votes: TimeVoteRow[];
  onClose: () => void;
}) {
  const [activeDay, setActiveDay] = useState<number>(days[0]);

  // 보고 있던 날짜가 선택 해제되면 남은 첫 날짜로 이동
  useEffect(() => {
    if (!days.includes(activeDay)) {
      setActiveDay(days[0]);
    }
  }, [days, activeDay]);

  const currentDay = days.includes(activeDay) ? activeDay : days[0];

  return (
    <section className="flex flex-col gap-5 rounded-2xl border-2 border-indigo-300 bg-white p-5 shadow-xl shadow-indigo-200/60">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-2">
          <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
            ⏰ 시간 정하기
          </span>
          <h2 className="text-2xl font-black leading-tight text-slate-900">
            {month}월 {daysRangeLabel(days)}
          </h2>
          <p className="text-sm font-semibold text-slate-600">
            {days.length > 1
              ? "날짜별로 몇 시에 볼지 정해보세요!"
              : "이 날 몇 시에 볼까요?"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="시간 정하기 닫기"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      {days.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setActiveDay(d)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-all duration-150 active:scale-95 ${
                d === currentDay
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300"
              }`}
            >
              {d}일
            </button>
          ))}
        </div>
      )}

      <DayTimeSection
        key={currentDay}
        roomId={roomId}
        month={month}
        day={currentDay}
        participantName={participantName}
        dayParticipants={participantsByDay[currentDay] ?? []}
        votes={votes.filter((v) => v.day === currentDay)}
      />
    </section>
  );
}

// 하루치 시간 투표 + 결과 + 확정 (날짜 탭을 바꾸면 key로 새로 마운트됨)
function DayTimeSection({
  roomId,
  month,
  day,
  participantName,
  dayParticipants,
  votes,
}: {
  roomId: string;
  month: number;
  day: number;
  participantName: string;
  dayParticipants: string[];
  votes: TimeVoteRow[];
}) {
  const router = useRouter();

  // 결과 집계에는 "이 날 되는 사람"의 투표만 사용
  const displayVotes = votes.filter((v) =>
    dayParticipants.includes(v.participant_name)
  );
  const myVote = votes.find((v) => v.participant_name === participantName);

  const [myHours, setMyHours] = useState<number[]>(
    parseHourSlots(myVote?.slots)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmHour, setConfirmHour] = useState<number>(() => {
    const hours = allAvailableHours(displayVotes, dayParticipants);
    return hours.length > 0 ? hours[0] : 12;
  });

  const handleHoursChange = (hours: number[]) => {
    setSaved(false);
    setMyHours(hours);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setErrorMessage(null);

    const { error } = await supabase.from(TIME_VOTES_TABLE).upsert(
      {
        room_id: roomId,
        day,
        participant_name: participantName,
        slots: myHours.map(String),
      },
      { onConflict: "room_id,day,participant_name" }
    );

    if (error) {
      console.error("[room] failed to save time vote:", error.message);
      setErrorMessage("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    router.refresh();
  };

  const handleConfirm = async () => {
    if (confirming) return;
    const ok = window.confirm(
      `${month}월 ${day}일 ${formatHour(confirmHour)} 약속으로 확정할까요?`
    );
    if (!ok) return;

    setConfirming(true);

    // 기존 확정을 불러와 이 날짜를 추가/갱신 (여러 날 확정 가능)
    const { data: roomRow, error: fetchError } = await supabase
      .from(ROOMS_TABLE)
      .select("confirmed_slots")
      .eq("id", roomId)
      .maybeSingle();

    if (fetchError) {
      console.error("[room] failed to load confirm state:", fetchError.message);
      window.alert("확정에 실패했어요. 잠시 후 다시 시도해주세요.");
      setConfirming(false);
      return;
    }

    const rawSlots = roomRow?.confirmed_slots;
    const currentSlots =
      rawSlots && typeof rawSlots === "object" && !Array.isArray(rawSlots)
        ? (rawSlots as Record<string, { start: number; end: number }>)
        : {};
    const nextSlots = {
      ...currentSlots,
      [String(day)]: { start: confirmHour, end: confirmHour },
    };
    const firstDay = Math.min(...Object.keys(nextSlots).map(Number));

    const { data, error } = await supabase
      .from(ROOMS_TABLE)
      .update({
        confirmed_slots: nextSlots,
        confirmed_day: firstDay,
        confirmed_hour: nextSlots[String(firstDay)].start,
      })
      .eq("id", roomId)
      .select();

    if (error || !data || data.length === 0) {
      console.error(
        "[room] failed to confirm:",
        error?.message ?? "no rows updated (RLS update policy missing?)"
      );
      window.alert(
        "확정에 실패했어요. Supabase에 confirmed_slots 컬럼과 update 정책이 있는지 확인해주세요."
      );
      setConfirming(false);
      return;
    }

    setConfirming(false);
    router.refresh();
  };

  const counts = buildHourCounts(displayVotes);
  const everyoneHours = allAvailableHours(displayVotes, dayParticipants);
  const votedNames = new Set(
    displayVotes
      .filter((v) => parseHourSlots(v.slots).length > 0)
      .map((v) => v.participant_name)
  );
  const notVoted = dayParticipants.filter((n) => !votedNames.has(n));
  const total = dayParticipants.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold text-slate-700">
          🖐️ {day}일에{" "}
          <span className="rounded-md bg-indigo-600 px-1.5 py-0.5 text-white">
            {participantName}
          </span>
          님이 가능한 시간 — 시계를 꾹 누른 채 시계 방향으로 쭉 드래그하세요
        </p>
        <p className="text-[11px] text-slate-500">
          이 날 되는 사람: {dayParticipants.join(", ")}
        </p>
        <ClockDialInput hours={myHours} onChange={handleHoursChange} />
        <div className="flex min-h-6 items-center justify-between gap-2">
          <p className="text-sm font-bold text-indigo-600">
            {myHours.length > 0
              ? hoursToRangeText(myHours)
              : "아직 선택 안 했어요"}
          </p>
          {myHours.length > 0 && (
            <button
              type="button"
              onClick={() => handleHoursChange([])}
              className="text-xs text-slate-400 underline underline-offset-2 transition-colors hover:text-slate-600"
            >
              지우기
            </button>
          )}
        </div>

        {errorMessage && (
          <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-center text-xs font-semibold text-rose-600">
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? "저장 중..." : saved ? "✅ 저장 완료!" : "🕐 내 시간 저장"}
        </button>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-5">
        <p className="text-xs font-bold text-slate-700">
          👀 {day}일에 다들 되는 시간
        </p>
        <ClockDialResult counts={counts} total={total} />
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 전원
            가능
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-300" /> 일부
            가능
          </span>
        </div>

        {everyoneHours.length > 0 ? (
          <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
            ⭐ 전원 가능: {hoursToRangeText(everyoneHours)}
          </p>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-400">
            아직 전원이 겹치는 시간이 없어요
          </p>
        )}

        <div className="flex flex-col gap-1">
          {displayVotes.map((v) => {
            const text = hoursToRangeText(parseHourSlots(v.slots));
            if (!text) return null;
            return (
              <p key={v.id} className="text-[11px] text-slate-500">
                <span className="font-bold text-slate-600">
                  {v.participant_name}
                </span>
                : {text}
              </p>
            );
          })}
          {notVoted.length > 0 && (
            <p className="text-[11px] text-slate-400">
              아직 시간 입력 안 함: {notVoted.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-5">
        <p className="text-xs font-bold text-slate-700">
          📌 {day}일로 약속 확정하기
        </p>
        <div className="flex gap-2">
          <select
            value={confirmHour}
            onChange={(e) => setConfirmHour(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition-colors focus:border-cyan-400 focus:bg-white"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {confirming ? "확정 중..." : `🎉 ${day}일 확정!`}
          </button>
        </div>
        <p className="text-[11px] text-slate-400">
          여러 날을 확정하면 확정 카드에 날짜별로 차곡차곡 표시돼요.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TimeSlotKey, TimeVoteRow } from "@/types/schedule";
import { TIME_SLOTS, summarizeSlotVotes } from "@/lib/schedule/timeSlots";
import { supabase, TIME_VOTES_TABLE } from "@/lib/supabase";

export default function TimeVotePanel({
  roomId,
  month,
  day,
  participantName,
  dayParticipants,
  votes,
  onClose,
}: {
  roomId: string;
  month: number;
  day: number;
  participantName: string;
  dayParticipants: string[];
  votes: TimeVoteRow[];
  onClose: () => void;
}) {
  const router = useRouter();
  const myVote = votes.find((v) => v.participant_name === participantName);
  const [mySlots, setMySlots] = useState<TimeSlotKey[]>(
    myVote && Array.isArray(myVote.slots) ? myVote.slots : []
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleSlot = (key: TimeSlotKey) => {
    setSaved(false);
    setMySlots((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
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
        slots: mySlots,
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

  const summaries = summarizeSlotVotes(votes);
  const votedNames = new Set(
    votes
      .filter((v) => Array.isArray(v.slots) && v.slots.length > 0)
      .map((v) => v.participant_name)
  );
  const notVoted = dayParticipants.filter((n) => !votedNames.has(n));
  const total = dayParticipants.length;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-black text-slate-900">
            ⏰ {month}월 {day}일, 몇 시에 볼까요?
          </h3>
          <p className="text-[11px] text-slate-500">
            이 날 되는 사람: {dayParticipants.join(", ")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="시간 정하기 닫기"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-slate-700">
          {participantName}님이 가능한 시간대 (여러 개 선택 가능)
        </p>
        <div className="flex flex-wrap gap-2">
          {TIME_SLOTS.map((slot) => {
            const active = mySlots.includes(slot.key);
            return (
              <button
                key={slot.key}
                type="button"
                onClick={() => toggleSlot(slot.key)}
                className={`rounded-full border px-3.5 py-2 text-xs font-bold transition-all duration-150 active:scale-95 ${
                  active
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300"
                }`}
              >
                {slot.emoji} {slot.label} {slot.range}
              </button>
            );
          })}
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
          {saving ? "저장 중..." : saved ? "✅ 투표 완료!" : "🕐 시간 투표 저장"}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-slate-700">시간대별 결과</p>
        {summaries.map((slot) => {
          const count = slot.names.length;
          const allIn =
            total > 0 && dayParticipants.every((n) => slot.names.includes(n));
          return (
            <div
              key={slot.key}
              className={`flex flex-col gap-1 rounded-xl border px-3 py-2.5 ${
                allIn
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700">
                  {slot.emoji} {slot.label}{" "}
                  <span className="font-medium text-slate-400">
                    {slot.range}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    allIn
                      ? "bg-emerald-600 text-white"
                      : count > 0
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {allIn ? "⭐ 전원 가능!" : `${count}/${total}명`}
                </span>
              </div>
              {count > 0 && (
                <p className="text-[11px] text-slate-500">
                  {slot.names.join(", ")}
                </p>
              )}
            </div>
          );
        })}
        {notVoted.length > 0 && (
          <p className="text-[11px] text-slate-400">
            아직 시간 투표 안 함: {notVoted.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

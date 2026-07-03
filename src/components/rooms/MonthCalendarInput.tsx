"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DayState, DayStateMap } from "@/types/schedule";
import { buildMonthGrid, WEEKDAY_LABELS } from "@/lib/schedule/month";
import { supabase, ENTRIES_TABLE } from "@/lib/supabase";
import { InputDayCell } from "./DayCell";
import SaveBar from "./SaveBar";

// 클릭할 때마다 빈칸 -> O -> 세모 -> X -> 빈칸 순으로 순환
const NEXT_STATE: Record<string, DayState | undefined> = {
  none: "full",
  full: "half",
  half: "unavailable",
  unavailable: undefined,
};

export default function MonthCalendarInput({
  roomId,
  year,
  month,
  participantName,
  initialDayStates,
}: {
  roomId: string;
  year: number;
  month: number;
  participantName: string;
  initialDayStates: DayStateMap;
}) {
  const router = useRouter();
  const [dayStates, setDayStates] = useState<DayStateMap>(initialDayStates);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cells = buildMonthGrid(year, month);

  const cycleDay = (day: number) => {
    setSaved(false);
    setDayStates((prev) => {
      const key = String(day);
      const current = prev[key] ?? "none";
      const next = NEXT_STATE[current];
      const updated = { ...prev };
      if (next === undefined) {
        delete updated[key];
      } else {
        updated[key] = next;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setErrorMessage(null);

    const { error } = await supabase.from(ENTRIES_TABLE).upsert(
      {
        room_id: roomId,
        participant_name: participantName,
        day_states: dayStates,
      },
      { onConflict: "room_id,participant_name" }
    );

    if (error) {
      console.error("[room] failed to save entry:", error.message);
      setErrorMessage("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label, i) => (
          <span
            key={label}
            className={`py-1 text-center text-[11px] font-bold ${
              i === 0
                ? "text-rose-400"
                : i === 6
                  ? "text-cyan-500"
                  : "text-slate-400"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) =>
          cell.day === null ? (
            <InputDayCell key={index} day={null} />
          ) : (
            <InputDayCell
              key={index}
              day={cell.day}
              state={dayStates[String(cell.day)]}
              onClick={() => cycleDay(cell.day as number)}
            />
          )
        )}
      </div>

      <SaveBar
        saving={saving}
        saved={saved}
        errorMessage={errorMessage}
        onSave={handleSave}
      />
    </div>
  );
}

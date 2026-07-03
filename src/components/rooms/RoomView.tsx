"use client";

import { useEffect, useState } from "react";
import type {
  MergedMonthResult,
  ScheduleEntryRow,
  ScheduleRoomRow,
} from "@/types/schedule";
import { getStoredName, clearStoredName } from "@/lib/schedule/storage";
import NameGate from "./NameGate";
import MonthCalendarInput from "./MonthCalendarInput";
import MergedCalendar from "./MergedCalendar";
import ParticipantList from "./ParticipantList";
import StatusLegend from "./StatusLegend";

export default function RoomView({
  room,
  entries,
  merged,
}: {
  room: ScheduleRoomRow;
  entries: ScheduleEntryRow[];
  merged: MergedMonthResult;
}) {
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setName(getStoredName(room.id));
    setReady(true);
  }, [room.id]);

  if (!ready) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
      </div>
    );
  }

  if (!name) {
    return <NameGate roomId={room.id} onIdentified={setName} />;
  }

  const myEntry = entries.find((e) => e.participant_name === name);

  const handleChangeName = () => {
    clearStoredName(room.id);
    setName(null);
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white/70">
            👥 참여자 ({entries.length}명)
          </h2>
          <button
            type="button"
            onClick={handleChangeName}
            className="text-xs text-white/35 underline underline-offset-2 transition-colors hover:text-white/60"
          >
            다른 이름으로 입력하기
          </button>
        </div>
        <ParticipantList entries={entries} />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-indigo-950/40 backdrop-blur-xl">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-black text-white">
            ✏️ {name}님의 캘린더
          </h2>
          <p className="text-xs text-white/50">
            날짜를 누를 때마다 ○ → △ → ✕ → 빈칸 순서로 바뀌어요. 다
            표시했으면 꼭 저장을 눌러주세요!
          </p>
        </div>
        <StatusLegend />
        <MonthCalendarInput
          key={name}
          roomId={room.id}
          year={room.target_year}
          month={room.target_month}
          participantName={name}
          initialDayStates={myEntry?.day_states ?? {}}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-indigo-950/40 backdrop-blur-xl">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-black text-white">
            🎯 모두가 되는 날
          </h2>
          <p className="text-xs text-white/50">
            <span className="font-bold text-emerald-300">초록</span>은 전원
            종일 가능, <span className="font-bold text-amber-300">노랑</span>은
            일부 시간 가능인 사람이 섞여 있는 날이에요. 한 명이라도 ✕이거나
            아직 입력하지 않은 날은 표시되지 않아요.
          </p>
        </div>
        <MergedCalendar merged={merged} />
      </section>
    </div>
  );
}

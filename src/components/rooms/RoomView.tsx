"use client";

import { useEffect, useState } from "react";
import type {
  MergedMonthResult,
  ScheduleEntryRow,
  ScheduleRoomRow,
  TimeVoteRow,
} from "@/types/schedule";
import { getStoredName, clearStoredName } from "@/lib/schedule/storage";
import NameGate from "./NameGate";
import MonthCalendarInput from "./MonthCalendarInput";
import MergedCalendar from "./MergedCalendar";
import ParticipantList from "./ParticipantList";
import StatusLegend from "./StatusLegend";
import TimeVotePanel from "./TimeVotePanel";

export default function RoomView({
  room,
  entries,
  merged,
  timeVotes,
}: {
  room: ScheduleRoomRow;
  entries: ScheduleEntryRow[];
  merged: MergedMonthResult;
  timeVotes: TimeVoteRow[];
}) {
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    setName(getStoredName(room.id));
    setReady(true);
  }, [room.id]);

  if (!ready) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-500" />
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

  const handleSelectDay = (day: number) => {
    setSelectedDay((prev) => (prev === day ? null : day));
  };

  const selectedResult =
    selectedDay !== null ? merged.days[selectedDay] : undefined;
  const dayParticipants = selectedResult?.included
    ? selectedResult.groups.flatMap((g) => g.names)
    : [];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">
            👥 참여자 ({entries.length}명)
          </h2>
          <button
            type="button"
            onClick={handleChangeName}
            className="text-xs text-slate-400 underline underline-offset-2 transition-colors hover:text-slate-600"
          >
            다른 이름으로 입력하기
          </button>
        </div>
        <ParticipantList entries={entries} />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-black text-slate-900">
            ✏️ {name}님의 캘린더
          </h2>
          <p className="text-xs text-slate-500">
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

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-black text-slate-900">
            🎯 모두가 되는 날
          </h2>
          <p className="text-xs text-slate-500">
            <span className="font-bold text-emerald-600">초록</span>은 전원
            종일 가능, <span className="font-bold text-amber-600">노랑</span>은
            일부 시간 가능인 사람이 섞여 있는 날이에요. 한 명이라도 ✕이거나
            아직 입력하지 않은 날은 표시되지 않아요.{" "}
            <strong className="font-bold text-indigo-600">
              색칠된 칸을 누르면 그 날 몇 시에 볼지도 정할 수 있어요!
            </strong>
          </p>
        </div>
        <MergedCalendar
          merged={merged}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
        />
      </section>

      {selectedDay !== null && selectedResult?.included && (
        <TimeVotePanel
          key={selectedDay}
          roomId={room.id}
          month={room.target_month}
          day={selectedDay}
          participantName={name}
          dayParticipants={dayParticipants}
          votes={timeVotes.filter(
            (v) =>
              v.day === selectedDay &&
              dayParticipants.includes(v.participant_name)
          )}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

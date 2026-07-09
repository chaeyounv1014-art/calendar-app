"use client";

import { useEffect, useRef, useState } from "react";
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
import PlaceFinder from "./PlaceFinder";
import ConfirmedBanner from "./ConfirmedBanner";

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
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);

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

  // 같은 날짜를 다시 누르면 해제, 다른 날짜를 누르면 함께 선택 (여행용)
  const handleSelectDay = (day: number) => {
    // 첫 선택(패널이 처음 뜨는 순간)에만 아래 시간 정하기로 부드럽게 이동.
    // 이후 날짜를 더 누를 땐 화면이 안 움직여 다중 선택을 방해하지 않는다.
    const willOpenPanel =
      validDays.length === 0 &&
      !selectedDays.includes(day) &&
      Boolean(merged.days[day]?.included);

    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );

    if (willOpenPanel) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          panelRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        )
      );
    }
  };

  const validDays = selectedDays.filter((d) => merged.days[d]?.included);
  const participantsByDay: Record<number, string[]> = {};
  for (const d of validDays) {
    const result = merged.days[d];
    participantsByDay[d] = result?.included
      ? result.groups.flatMap((g) => g.names)
      : [];
  }

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
            날짜를 누를 때마다 ○ → △ → ✕ → 빈칸 순서로 바뀌어요.
          </p>
          <p className="text-xs text-slate-500">
            다 표시했으면 꼭{" "}
            <span className="font-bold text-indigo-600">저장</span>을
            눌러주세요!
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
            일부 시간 가능인 사람이 섞여 있는 날이에요.
          </p>
          <p className="text-xs text-slate-500">
            한 명이라도 <span className="font-bold text-rose-500">✕</span>이거나
            아직{" "}
            <span className="font-bold text-indigo-600">입력하지 않은 날</span>
            은 표시되지 않아요.
          </p>
          <p className="mt-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-center text-sm font-bold text-indigo-600">
            색칠된 칸을 눌러 약속 시간을 정하세요!
          </p>
          <p className="text-xs text-slate-500">
            여행처럼 여러 날이면 날짜를 이어서 눌러 함께 선택할 수 있어요.
          </p>
        </div>
        {entries.length > 0 &&
          !Object.values(merged.days).some((d) => d.included) && (
            <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-center text-xs font-semibold text-amber-700">
              😢 아직 모두가 겹치는 날이 없어요...
              <br />
              각자 ○/△를 조금만 더 열어보거나, 다음 달에 만나요!
            </p>
          )}
        <MergedCalendar
          merged={merged}
          selectedDays={selectedDays}
          onSelectDay={handleSelectDay}
        />
      </section>

      {validDays.length > 0 && (
        <div ref={panelRef} className="flex scroll-mt-3 flex-col gap-8">
          <TimeVotePanel
            roomId={room.id}
            month={room.target_month}
            days={validDays}
            participantName={name}
            participantsByDay={participantsByDay}
            votes={timeVotes.filter((v) => validDays.includes(v.day))}
            onClose={() => setSelectedDays([])}
          />
          <div className="relative">
            <PlaceFinder roomId={room.id} />
            {/* "어디서 볼까?" 오른쪽 여백에 두는 작은 확정 카드 (넓은 화면 전용) */}
            <div className="absolute left-full top-0 ml-4 hidden w-52 xl:block">
              <ConfirmedBanner room={room} compact />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

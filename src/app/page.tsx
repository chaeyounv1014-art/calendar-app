import Link from "next/link";
import GradientBackdrop from "@/components/ui/GradientBackdrop";
import Badge from "@/components/ui/Badge";
import RoomCard from "@/components/home/RoomCard";
import { supabase, ROOMS_TABLE, ENTRIES_TABLE } from "@/lib/supabase";
import type { RoomWithCount, ScheduleRoomRow } from "@/types/schedule";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getRoomsWithCount(): Promise<RoomWithCount[]> {
  const { data: rooms, error } = await supabase
    .from(ROOMS_TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !rooms) {
    if (error) console.error("[home] failed to fetch rooms:", error.message);
    return [];
  }

  const { data: entries, error: entriesError } = await supabase
    .from(ENTRIES_TABLE)
    .select("room_id");

  if (entriesError) {
    console.error("[home] failed to fetch entries:", entriesError.message);
  }

  const countByRoom = new Map<string, number>();
  for (const entry of entries ?? []) {
    countByRoom.set(entry.room_id, (countByRoom.get(entry.room_id) ?? 0) + 1);
  }

  return (rooms as ScheduleRoomRow[]).map((room) => ({
    ...room,
    participant_count: countByRoom.get(room.id) ?? 0,
  }));
}

export default async function HomePage() {
  const rooms = await getRoomsWithCount();

  return (
    <main className="relative min-h-dvh overflow-hidden px-6 py-14">
      <GradientBackdrop />

      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm font-black tracking-widest text-cyan-600">
            📅 언제볼까?
          </p>
          <Badge>✅ 로그인 없이 바로 시작</Badge>
          <h1 className="animate-fade-in-up break-keep text-3xl font-black leading-tight tracking-tight text-slate-900">
            우리 모임,
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
              모두가 되는 날
            </span>
            은 언제일까?
          </h1>
          <p className="animate-fade-in-up text-balance text-sm text-slate-500">
            각자 가능한 날에 ○·△·✕만 표시하면,
            <br />
            겹치는 날짜를 캘린더로 한눈에 보여드려요.
          </p>
          <p className="animate-fade-in-up text-balance text-sm font-bold text-slate-900">
            팀별로 방을 만들어서 다음 주 회식 일정을 잡아보세요!
          </p>
        </header>

        <Link
          href="/rooms/new"
          className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-size-200 bg-[position:0%_50%] px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-300/60 transition-all duration-300 hover:scale-105 hover:bg-[position:100%_50%] active:scale-95"
        >
          ＋ 새 방 만들기
        </Link>

        <section className="flex flex-col gap-3">
          <h2 className="px-1 text-sm font-bold text-slate-700">
            📂 열려있는 방 ({rooms.length})
          </h2>

          {rooms.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
              <p className="text-3xl">🗓️</p>
              <p className="text-sm font-semibold text-slate-500">
                아직 만들어진 방이 없어요
              </p>
              <p className="text-xs text-slate-400">
                첫 번째 방을 만들고 친구들에게 공유해보세요!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

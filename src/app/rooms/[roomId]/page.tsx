import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GradientBackdrop from "@/components/ui/GradientBackdrop";
import RoomView from "@/components/rooms/RoomView";
import { supabase, ROOMS_TABLE, ENTRIES_TABLE } from "@/lib/supabase";
import { mergeMonthEntries } from "@/lib/schedule/merge";
import { formatMonthLabel } from "@/lib/schedule/month";
import type { ScheduleEntryRow, ScheduleRoomRow } from "@/types/schedule";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

async function getRoom(roomId: string): Promise<ScheduleRoomRow | null> {
  const { data, error } = await supabase
    .from(ROOMS_TABLE)
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (error) {
    console.error("[room] failed to fetch room:", error.message);
    return null;
  }
  return data as ScheduleRoomRow | null;
}

async function getEntries(roomId: string): Promise<ScheduleEntryRow[]> {
  const { data, error } = await supabase
    .from(ENTRIES_TABLE)
    .select("*")
    .eq("room_id", roomId)
    .order("updated_at", { ascending: true });

  if (error) {
    console.error("[room] failed to fetch entries:", error.message);
    return [];
  }
  return (data ?? []) as ScheduleEntryRow[];
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { roomId } = await params;
  const room = await getRoom(roomId);
  if (!room) return { title: "방을 찾을 수 없어요" };
  return {
    title: room.title,
    description: `${formatMonthLabel(room.target_year, room.target_month)} 일정 조율 - 가능한 날에 O·세모·X를 표시해주세요!`,
  };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;
  const room = await getRoom(roomId);

  if (!room) {
    notFound();
  }

  const entries = await getEntries(room.id);
  const merged = mergeMonthEntries(entries, room.target_year, room.target_month);

  return (
    <main className="relative min-h-dvh overflow-hidden px-5 py-14">
      <GradientBackdrop />

      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link
            href="/"
            className="text-sm text-slate-400 transition-colors hover:text-slate-700"
          >
            ← 방 목록으로
          </Link>
          <div className="flex flex-col gap-2">
            <span className="w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
              📅 {formatMonthLabel(room.target_year, room.target_month)}
            </span>
            <h1 className="text-balance text-2xl font-black leading-tight text-slate-900">
              {room.title}
            </h1>
          </div>
        </header>

        <RoomView room={room} entries={entries} merged={merged} />
      </div>
    </main>
  );
}

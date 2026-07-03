import Link from "next/link";
import type { RoomWithCount } from "@/types/schedule";
import { formatMonthLabel } from "@/lib/schedule/month";

export default function RoomCard({ room }: { room: RoomWithCount }) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl shadow-indigo-950/30 backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] hover:border-cyan-400/40 hover:bg-cyan-400/5 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold leading-snug text-white group-hover:text-cyan-200">
          {room.title}
        </h2>
        <span className="shrink-0 text-white/30 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-cyan-300">
          ➔
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-white/50">
        <span className="rounded-full bg-indigo-500/20 px-2.5 py-1 font-semibold text-indigo-200">
          📅 {formatMonthLabel(room.target_year, room.target_month)}
        </span>
        <span className="rounded-full bg-white/5 px-2.5 py-1 font-semibold">
          👥 {room.participant_count}명 참여
        </span>
      </div>
    </Link>
  );
}

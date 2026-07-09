import Link from "next/link";
import type { RoomWithCount } from "@/types/schedule";
import { formatMonthLabel } from "@/lib/schedule/month";
import { parseConfirmedSlots, confirmedDays } from "@/lib/schedule/confirm";
import ConfirmedChip from "./ConfirmedChip";

export default function RoomCard({ room }: { room: RoomWithCount }) {
  const confirmedDayList = confirmedDays(parseConfirmedSlots(room));

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 transition-all duration-200 hover:scale-[1.02] hover:border-cyan-300 hover:shadow-cyan-100 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold leading-snug text-slate-900 group-hover:text-indigo-600">
          {room.title}
        </h2>
        <span className="shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-cyan-500">
          ➔
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {confirmedDayList.length > 0 && (
          <ConfirmedChip
            year={room.target_year}
            month={room.target_month}
            days={confirmedDayList}
          />
        )}
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-600">
          📅 {formatMonthLabel(room.target_year, room.target_month)}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-500">
          👥 {room.participant_count}명 참여
        </span>
      </div>
    </Link>
  );
}

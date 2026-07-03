import type { ScheduleEntryRow } from "@/types/schedule";

export default function ParticipantList({
  entries,
}: {
  entries: ScheduleEntryRow[];
}) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-3 text-center text-xs text-slate-400">
        아직 참여자가 없어요. 첫 번째로 일정을 입력해보세요!
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((entry) => (
        <span
          key={entry.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-xs font-semibold text-slate-700 shadow-sm"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-[10px] font-black text-white">
            {entry.participant_name.charAt(0)}
          </span>
          {entry.participant_name}
        </span>
      ))}
    </div>
  );
}

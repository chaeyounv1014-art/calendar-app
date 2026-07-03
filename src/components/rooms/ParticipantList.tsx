import type { ScheduleEntryRow } from "@/types/schedule";

export default function ParticipantList({
  entries,
}: {
  entries: ScheduleEntryRow[];
}) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-center text-xs text-white/40">
        아직 참여자가 없어요. 첫 번째로 일정을 입력해보세요!
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((entry) => (
        <span
          key={entry.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 text-xs font-semibold text-white/80"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/50 to-cyan-400/40 text-[10px] font-black text-white">
            {entry.participant_name.charAt(0)}
          </span>
          {entry.participant_name}
        </span>
      ))}
    </div>
  );
}

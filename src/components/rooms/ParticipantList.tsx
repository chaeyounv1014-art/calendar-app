"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScheduleEntryRow } from "@/types/schedule";
import { supabase, ENTRIES_TABLE } from "@/lib/supabase";

export default function ParticipantList({
  entries,
}: {
  entries: ScheduleEntryRow[];
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (entry: ScheduleEntryRow) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      `'${entry.participant_name}'님의 입력을 삭제할까요?\n삭제하면 결과 캘린더에서도 바로 제외돼요.`
    );
    if (!confirmed) return;

    setDeletingId(entry.id);

    const { error } = await supabase
      .from(ENTRIES_TABLE)
      .delete()
      .eq("id", entry.id);

    if (error) {
      console.error("[room] failed to delete entry:", error.message);
      window.alert("삭제에 실패했어요. 잠시 후 다시 시도해주세요.");
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    router.refresh();
  };

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
          className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-opacity ${
            deletingId === entry.id ? "opacity-40" : ""
          }`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 text-[10px] font-black text-white">
            {entry.participant_name.charAt(0)}
          </span>
          {entry.participant_name}
          <button
            type="button"
            onClick={() => handleDelete(entry)}
            disabled={deletingId !== null}
            aria-label={`${entry.participant_name} 삭제`}
            className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:pointer-events-none"
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}

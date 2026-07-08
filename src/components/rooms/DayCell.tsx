import type { DayState, MergedDayResult } from "@/types/schedule";

const STATE_ICON: Record<DayState, string> = {
  full: "○",
  half: "△",
  unavailable: "✕",
};

const INPUT_STATE_CLASS: Record<DayState, string> = {
  full: "bg-emerald-100 border-emerald-300 text-emerald-700",
  half: "bg-amber-100 border-amber-300 text-amber-700",
  unavailable: "bg-rose-100 border-rose-300 text-rose-600",
};

export function InputDayCell({
  day,
  state,
  onClick,
}: {
  day: number | null;
  state?: DayState;
  onClick?: () => void;
}) {
  if (day === null) {
    return <div className="min-h-12" aria-hidden />;
  }

  const stateClass = state
    ? INPUT_STATE_CLASS[state]
    : "border-slate-200 bg-slate-50 text-slate-300 hover:border-slate-300 hover:bg-slate-100";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${day}일 ${state ? { full: "종일 가능", half: "일부 가능", unavailable: "불가" }[state] : "미입력"}`}
      className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg border p-1 transition-all duration-150 active:scale-90 ${stateClass}`}
    >
      <span className="text-[10px] leading-none text-slate-400">{day}</span>
      <span className="text-sm font-black leading-none">
        {state ? STATE_ICON[state] : ""}
      </span>
    </button>
  );
}

export function MergedDayCell({
  day,
  result,
  selected,
  onSelect,
}: {
  day: number | null;
  result?: MergedDayResult;
  selected?: boolean;
  onSelect?: () => void;
}) {
  if (day === null) {
    return <div className="min-h-14" aria-hidden />;
  }

  if (!result || !result.included) {
    return (
      <div className="flex min-h-14 flex-col rounded-lg p-1.5">
        <span className="text-[10px] leading-none text-slate-300">{day}</span>
      </div>
    );
  }

  const isAllFull = result.level === "all-full";
  const cellClass = isAllFull
    ? "bg-emerald-100 border border-emerald-300"
    : "bg-amber-100 border border-amber-300";
  const textClass = isAllFull ? "text-emerald-700" : "text-amber-700";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`${day}일 시간 정하기`}
      className={`flex min-h-14 w-full flex-col gap-0.5 rounded-lg p-1.5 text-left transition-all duration-150 active:scale-95 ${cellClass} ${
        selected
          ? "ring-2 ring-indigo-500 ring-offset-1"
          : "hover:ring-2 hover:ring-indigo-300"
      }`}
    >
      <span className="text-[10px] leading-none text-slate-500">{day}</span>
      {result.groups.map((group) => (
        <span
          key={group.state}
          className={`flex items-start gap-0.5 text-[9px] font-bold leading-tight ${textClass}`}
        >
          <span className="shrink-0">{STATE_ICON[group.state]}</span>
          <span className="flex min-w-0 flex-col">
            {group.names.map((n) => (
              <span key={n} className="break-all">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </button>
  );
}

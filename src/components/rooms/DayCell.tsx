import type { DayState, MergedDayResult } from "@/types/schedule";

const STATE_ICON: Record<DayState, string> = {
  full: "○",
  half: "△",
  unavailable: "✕",
};

const INPUT_STATE_CLASS: Record<DayState, string> = {
  full: "bg-emerald-500/20 border-emerald-400/40 text-emerald-300",
  half: "bg-amber-400/20 border-amber-300/40 text-amber-300",
  unavailable: "bg-rose-500/15 border-rose-400/40 text-rose-300",
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
    : "border-white/10 bg-white/[0.02] text-white/30 hover:border-white/25 hover:bg-white/[0.06]";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${day}일 ${state ? { full: "종일 가능", half: "일부 가능", unavailable: "불가" }[state] : "미입력"}`}
      className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg border p-1 transition-all duration-150 active:scale-90 ${stateClass}`}
    >
      <span className="text-[10px] leading-none text-white/40">{day}</span>
      <span className="text-sm font-black leading-none">
        {state ? STATE_ICON[state] : ""}
      </span>
    </button>
  );
}

export function MergedDayCell({
  day,
  result,
}: {
  day: number | null;
  result?: MergedDayResult;
}) {
  if (day === null) {
    return <div className="min-h-14" aria-hidden />;
  }

  if (!result || !result.included) {
    return (
      <div className="flex min-h-14 flex-col rounded-lg p-1.5">
        <span className="text-[10px] leading-none text-white/25">{day}</span>
      </div>
    );
  }

  const isAllFull = result.level === "all-full";
  const cellClass = isAllFull
    ? "bg-emerald-500/20 border border-emerald-400/40"
    : "bg-amber-400/15 border border-amber-300/40";
  const textClass = isAllFull ? "text-emerald-300" : "text-amber-300";

  return (
    <div
      className={`flex min-h-14 flex-col gap-0.5 rounded-lg p-1.5 ${cellClass}`}
    >
      <span className="text-[10px] leading-none text-white/50">{day}</span>
      {result.groups.map((group) => (
        <span
          key={group.state}
          className={`flex items-center gap-0.5 text-[9px] font-bold leading-tight ${textClass}`}
        >
          <span className="shrink-0">{STATE_ICON[group.state]}</span>
          <span className="break-all">{group.names.join(" ")}</span>
        </span>
      ))}
    </div>
  );
}

import type { MergedMonthResult } from "@/types/schedule";
import { buildMonthGrid, WEEKDAY_LABELS } from "@/lib/schedule/month";
import { MergedDayCell } from "./DayCell";

export default function MergedCalendar({
  merged,
}: {
  merged: MergedMonthResult;
}) {
  const cells = buildMonthGrid(merged.year, merged.month);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label, i) => (
          <span
            key={label}
            className={`py-1 text-center text-[11px] font-bold ${
              i === 0
                ? "text-rose-400"
                : i === 6
                  ? "text-cyan-500"
                  : "text-slate-400"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => (
          <MergedDayCell
            key={index}
            day={cell.day}
            result={cell.day !== null ? merged.days[cell.day] : undefined}
          />
        ))}
      </div>
    </div>
  );
}

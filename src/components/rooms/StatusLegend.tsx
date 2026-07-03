export default function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-white/60">
      <span className="flex items-center gap-1.5">
        <span className="font-black text-emerald-300">○</span> 종일 가능
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-black text-amber-300">△</span> 일부 시간 가능
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-black text-rose-300">✕</span> 불가
      </span>
    </div>
  );
}

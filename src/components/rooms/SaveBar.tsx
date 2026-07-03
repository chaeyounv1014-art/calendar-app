"use client";

export default function SaveBar({
  saving,
  saved,
  errorMessage,
  onSave,
}: {
  saving: boolean;
  saved: boolean;
  errorMessage: string | null;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {errorMessage && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-center text-xs font-semibold text-rose-300">
          {errorMessage}
        </p>
      )}
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-900/50 transition-all duration-200 hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
      >
        {saving ? "저장 중..." : saved ? "✅ 저장 완료!" : "💾 저장하기"}
      </button>
    </div>
  );
}

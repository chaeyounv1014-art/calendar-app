"use client";

import { useState } from "react";
import { normalizeName, setStoredName } from "@/lib/schedule/storage";

export default function NameGate({
  roomId,
  onIdentified,
}: {
  roomId: string;
  onIdentified: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeName(name);
    if (!normalized) {
      setErrorMessage("이름을 입력해주세요.");
      return;
    }
    if (normalized.length > 20) {
      setErrorMessage("이름은 20자 이내로 입력해주세요.");
      return;
    }
    setStoredName(roomId, normalized);
    onIdentified(normalized);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-pop-in flex w-full flex-col gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-indigo-950/40 backdrop-blur-xl sm:p-8"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-4xl">👋</span>
        <h2 className="text-lg font-black text-white">어떻게 불러드릴까요?</h2>
        <p className="text-xs text-white/50">
          캘린더에 표시될 이름이에요. 나중에 다시 들어와도 같은 이름이면
          이어서 수정할 수 있어요.
        </p>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={20}
        placeholder="예: 채영"
        autoFocus
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-cyan-400/60 focus:bg-cyan-400/5"
      />

      {errorMessage && (
        <p className="rounded-xl bg-rose-500/10 px-4 py-2.5 text-center text-xs font-semibold text-rose-300">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-900/50 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        시작하기 ➔
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";

export default function ShareButton({
  title,
  monthLabel,
}: {
  title: string;
  monthLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const message = `📅 "${title}" ${monthLabel} 날짜 정하는 중!\n아직 입력 안 했으면 얼른 들어와~ 👀\n\n${url}`;

    // 폰이면 카톡/문자를 고를 수 있는 공유 창을 바로 띄운다
    const isTouchDevice = navigator.maxTouchPoints > 0;
    if (isTouchDevice && navigator.share) {
      try {
        await navigator.share({ text: message });
      } catch {
        // 사용자가 공유 창을 그냥 닫은 경우 — 아무것도 안 함
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("아래 내용을 복사해서 보내세요!", message);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex w-fit items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-bold text-indigo-600 shadow-sm transition-all duration-150 hover:border-indigo-400 hover:bg-indigo-50 active:scale-95"
    >
      {copied ? "✅ 복사 완료! 카톡에 붙여넣으세요" : "🔗 재촉 링크 보내기"}
    </button>
  );
}

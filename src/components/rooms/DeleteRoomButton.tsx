"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteRoomButton({
  roomId,
  title,
}: {
  roomId: string;
  title: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;

    const password = window.prompt(
      `'${title}' 방을 삭제하려면 관리자 비밀번호를 입력하세요.\n(참여자 입력과 시간 투표도 모두 함께 삭제돼요)`
    );
    if (password === null) return; // 취소

    setDeleting(true);
    try {
      const res = await fetch("/api/rooms/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, password }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        window.alert(data.error ?? "삭제에 실패했어요.");
        setDeleting(false);
        return;
      }

      window.alert("방이 삭제됐어요.");
      router.push("/");
      router.refresh();
    } catch {
      window.alert("삭제에 실패했어요. 네트워크를 확인해주세요.");
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="mx-auto w-fit text-xs text-slate-400 underline underline-offset-2 transition-colors hover:text-rose-500 disabled:opacity-50"
    >
      {deleting ? "삭제 중..." : "🗑️ 이 방 삭제하기 (관리자)"}
    </button>
  );
}

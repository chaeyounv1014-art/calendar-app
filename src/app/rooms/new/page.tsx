import Link from "next/link";
import type { Metadata } from "next";
import GradientBackdrop from "@/components/ui/GradientBackdrop";
import NewRoomForm from "@/components/rooms/NewRoomForm";

export const metadata: Metadata = {
  title: "새 방 만들기",
};

export default function NewRoomPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden px-6 py-14">
      <GradientBackdrop />

      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/"
            className="text-sm text-white/40 transition-colors hover:text-white/70"
          >
            ← 홈으로
          </Link>
          <h1 className="text-2xl font-black leading-tight">새 방 만들기</h1>
          <p className="text-sm text-white/60">
            제목과 조율할 달만 정하면 바로 시작할 수 있어요.
          </p>
        </header>

        <NewRoomForm />
      </div>
    </main>
  );
}

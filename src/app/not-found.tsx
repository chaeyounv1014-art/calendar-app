import Link from "next/link";
import GradientBackdrop from "@/components/ui/GradientBackdrop";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center">
      <GradientBackdrop />
      <p className="text-6xl">📅</p>
      <h1 className="text-2xl font-black text-slate-900">
        페이지를 찾을 수 없어요
      </h1>
      <p className="text-sm text-slate-500">
        방이 삭제되었거나 주소가 올바르지 않아요.
      </p>
      <Link
        href="/"
        className="rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-300/60 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}

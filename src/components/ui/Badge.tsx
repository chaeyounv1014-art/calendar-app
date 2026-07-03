import type { ReactNode } from "react";

export default function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-xs font-semibold tracking-wide text-indigo-600 shadow-sm">
      {children}
    </span>
  );
}

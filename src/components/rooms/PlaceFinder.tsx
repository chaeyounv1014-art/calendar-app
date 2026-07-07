"use client";

import { useState } from "react";
import type { PlaceResult } from "@/types/place";

const CATEGORIES = [
  { key: "food", label: "🍽️ 맛집" },
  { key: "cafe", label: "☕ 카페" },
  { key: "play", label: "🎪 놀거리" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

export default function PlaceFinder() {
  const [area, setArea] = useState("");
  const [category, setCategory] = useState<CategoryKey>("food");
  const [places, setPlaces] = useState<PlaceResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runSearch = async (nextCategory: CategoryKey) => {
    const query = area.trim();
    if (!query || loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/places?area=${encodeURIComponent(query)}&type=${nextCategory}`
      );
      const data = (await res.json()) as {
        places?: PlaceResult[];
        error?: string;
      };

      if (!res.ok) {
        setErrorMessage(
          data.error ?? "검색에 실패했어요. 잠시 후 다시 시도해주세요."
        );
        setPlaces(null);
        return;
      }

      setPlaces(data.places ?? []);
    } catch {
      setErrorMessage("검색에 실패했어요. 네트워크를 확인해주세요.");
      setPlaces(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    runSearch(category);
  };

  const handleCategory = (key: CategoryKey) => {
    if (loading) return;
    setCategory(key);
    // 이미 검색한 상태라면 카테고리만 바꿔도 바로 다시 검색
    if (places !== null) {
      runSearch(key);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-black text-slate-900">📍 어디서 볼까?</h2>
        <p className="text-xs text-slate-500">
          지역 이름을 검색하면 그 근처의 맛집·카페·놀거리를 보여드려요.
          결과를 누르면 카카오맵 상세 페이지가 열려요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          maxLength={30}
          placeholder="예: 홍대, 서울역, 명동, 경희대"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-cyan-400 focus:bg-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? "검색 중..." : "검색"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => handleCategory(c.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95 ${
              category === c.key
                ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200"
                : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {errorMessage && (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-center text-xs font-semibold text-rose-600">
          {errorMessage}
        </p>
      )}

      {places !== null && places.length === 0 && !errorMessage && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-6 text-center text-xs text-slate-400">
          검색 결과가 없어요. 지역 이름을 바꿔서 다시 시도해보세요!
        </p>
      )}

      {places !== null && places.length > 0 && (
        <ul className="flex flex-col gap-2">
          {places.map((p) => (
            <li key={p.id}>
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3.5 transition-all duration-150 hover:border-cyan-300 hover:shadow-md hover:shadow-cyan-100 active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800">
                    {p.name}
                  </span>
                  {p.category && (
                    <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-500">
                      {p.category}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">{p.address}</p>
                {p.phone && (
                  <p className="text-[11px] text-slate-400">{p.phone}</p>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

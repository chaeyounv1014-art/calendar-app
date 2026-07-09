"use client";

import { useState } from "react";
import type { PlaceResult } from "@/types/place";

const CATEGORIES = [
  { key: "food", label: "🍽️ 맛집" },
  { key: "cafe", label: "☕ 카페" },
  { key: "play", label: "🎪 놀거리" },
  { key: "bakery", label: "🥐 빵집" },
  { key: "bar", label: "🍺 술집" },
  { key: "custom", label: "🔍 직접 검색" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

// 카카오는 가게 사진을 제공하지 않으므로, 카테고리에 어울리는
// 이모지 썸네일로 사진 자리를 채운다
const EMOJI_RULES: Array<[string[], string]> = [
  [["갈비", "고기", "육류", "삼겹", "곱창"], "🥩"],
  [["국수", "냉면", "칼국수", "라면", "우동"], "🍜"],
  [["중국", "중식"], "🥟"],
  [["일식", "초밥", "돈까스", "돈가스"], "🍣"],
  [["회", "해물", "수산", "조개"], "🐟"],
  [["치킨"], "🍗"],
  [["피자"], "🍕"],
  [["버거"], "🍔"],
  [["분식", "떡볶이"], "🍢"],
  [["빵", "제과", "베이커리", "도넛"], "🥐"],
  [["디저트", "케이크", "아이스크림", "빙수"], "🍰"],
  [["카페", "커피"], "☕"],
  [["술", "호프", "포차", "주점", "와인", "맥주"], "🍺"],
  [["노래"], "🎤"],
  [["볼링"], "🎳"],
  [["영화"], "🎬"],
  [["보드", "게임", "오락"], "🎲"],
  [["방탈출"], "🗝️"],
  [["공원"], "🌳"],
  [["전시", "미술", "박물관"], "🖼️"],
  [["탕", "국밥", "찌개", "한식", "백반", "정식", "뷔페"], "🍚"],
];

const DEFAULT_EMOJI: Record<CategoryKey, string> = {
  food: "🍽️",
  cafe: "☕",
  play: "🎪",
  bakery: "🥐",
  bar: "🍺",
  custom: "📍",
};

function placeEmoji(categoryText: string, fallback: CategoryKey): string {
  for (const [keywords, emoji] of EMOJI_RULES) {
    if (keywords.some((k) => categoryText.includes(k))) return emoji;
  }
  return DEFAULT_EMOJI[fallback];
}

// 썸네일 배경을 번갈아 써서 사진첩 느낌을 낸다
const THUMB_BG = [
  "bg-gradient-to-br from-rose-100 to-amber-100",
  "bg-gradient-to-br from-sky-100 to-indigo-100",
  "bg-gradient-to-br from-emerald-100 to-teal-100",
  "bg-gradient-to-br from-violet-100 to-fuchsia-100",
];

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
          placeholder={
            category === "custom" ? "예: 성수 노래방, 홍대 방탈출" : "예: 성수, 홍대"
          }
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
        <ul className="grid grid-cols-2 gap-3">
          {places.map((p, i) => (
            <li key={p.id}>
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-150 hover:border-cyan-300 hover:shadow-md hover:shadow-cyan-100 active:scale-[0.98]"
              >
                <div
                  className={`flex h-20 items-center justify-center text-4xl ${THUMB_BG[i % THUMB_BG.length]}`}
                >
                  {placeEmoji(p.category, category)}
                </div>
                <div className="flex flex-col gap-1 p-3">
                  <span className="line-clamp-1 text-[13px] font-bold text-slate-800">
                    {p.name}
                  </span>
                  {p.category && (
                    <span className="w-fit rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-500">
                      {p.category}
                    </span>
                  )}
                  <p className="line-clamp-2 text-[10px] leading-snug text-slate-500">
                    {p.address}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

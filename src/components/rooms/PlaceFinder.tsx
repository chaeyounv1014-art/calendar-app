"use client";

import { useState } from "react";
import type { PlaceResult } from "@/types/place";

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

function placeEmoji(categoryText: string): string {
  for (const [keywords, emoji] of EMOJI_RULES) {
    if (keywords.some((k) => categoryText.includes(k))) return emoji;
  }
  return "📍";
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
  const [places, setPlaces] = useState<PlaceResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runSearch = async () => {
    const query = area.trim();
    if (!query || loading) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(
        `/api/places?area=${encodeURIComponent(query)}&type=custom`
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
    runSearch();
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-black text-slate-900">📍 어디서 볼까?</h2>
        <p className="text-xs text-slate-500">
          지역과 장소를 검색하면 근처 장소를 보여드려요
        </p>
        <p className="text-xs text-slate-500">
          버튼을 누르면 카카오맵 상세 페이지가 열려요
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          maxLength={30}
          placeholder="예: 성수 맛집, 경희대 보드게임"
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
                  {placeEmoji(p.category)}
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

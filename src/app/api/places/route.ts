import { NextRequest, NextResponse } from "next/server";
import type { PlaceResult } from "@/types/place";

// 카카오 로컬 키워드 검색을 서버에서 대신 호출한다.
// REST API 키는 브라우저에 노출되면 안 되므로 이 서버 라우트가 중계한다.
//
// 검색은 2단계: ① 지역 이름으로 기준 좌표를 찾고
// ② 그 반경 3km 안에서 키워드를 가까운 순으로 검색한다.
// ("경희대 보드게임"처럼 문장 통째로 검색하면 못 찾는 경우가 많아서)

const TYPE_KEYWORD: Record<string, string> = {
  food: "맛집",
  cafe: "카페",
  play: "놀거리",
  bakery: "빵집",
  bar: "술집",
};

interface KakaoPlaceDocument {
  id: string;
  place_name: string;
  category_name: string;
  road_address_name: string;
  address_name: string;
  phone: string;
  place_url: string;
  x: string;
  y: string;
}

async function searchKakao(
  apiKey: string,
  params: Record<string, string>
): Promise<KakaoPlaceDocument[]> {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("[places] kakao api error:", res.status, await res.text());
    throw new Error("kakao api error");
  }

  const data = (await res.json()) as { documents?: KakaoPlaceDocument[] };
  return data.documents ?? [];
}

export async function GET(request: NextRequest) {
  const area = request.nextUrl.searchParams.get("area")?.trim();
  const type = request.nextUrl.searchParams.get("type") ?? "food";

  if (!area) {
    return NextResponse.json(
      { error: "지역 이름을 입력해주세요." },
      { status: 400 }
    );
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "장소 검색 키(KAKAO_REST_API_KEY)가 아직 설정되지 않았어요." },
      { status: 500 }
    );
  }

  // 직접 검색이면 첫 단어를 지역, 나머지를 키워드로 나눈다
  // (예: "경희대 보드게임" -> 지역 "경희대" + 키워드 "보드게임")
  let locationQuery = area;
  let keyword: string;
  if (type === "custom") {
    const tokens = area.split(/\s+/);
    if (tokens.length >= 2) {
      locationQuery = tokens[0];
      keyword = tokens.slice(1).join(" ");
    } else {
      keyword = "";
    }
  } else {
    keyword = TYPE_KEYWORD[type] ?? TYPE_KEYWORD.food;
  }

  try {
    let docs: KakaoPlaceDocument[] = [];

    if (keyword) {
      // 1) 지역 이름 -> 기준 좌표
      const anchors = await searchKakao(apiKey, {
        query: locationQuery,
        size: "1",
      });
      const anchor = anchors[0];

      if (anchor?.x && anchor?.y) {
        // 2) 기준 좌표 반경 3km에서 키워드 검색 (가까운 순)
        docs = await searchKakao(apiKey, {
          query: keyword,
          x: anchor.x,
          y: anchor.y,
          radius: "3000",
          size: "15",
          sort: "distance",
        });
      }
    }

    // 좌표 검색이 안 되면 예전 방식(문장 통째 검색)으로 한 번 더 시도
    if (docs.length === 0) {
      const fallbackQuery =
        type === "custom" ? area : `${area} ${keyword}`;
      docs = await searchKakao(apiKey, { query: fallbackQuery, size: "15" });
    }

    const places: PlaceResult[] = docs.map((d) => ({
      id: d.id,
      name: d.place_name,
      category: d.category_name?.split(" > ").pop() ?? "",
      address: d.road_address_name || d.address_name,
      phone: d.phone,
      url: d.place_url,
    }));

    return NextResponse.json({ places });
  } catch {
    return NextResponse.json(
      { error: "카카오 장소 검색에 실패했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }
}

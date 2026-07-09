import { NextRequest, NextResponse } from "next/server";
import type { PlaceResult } from "@/types/place";

// 카카오 로컬 키워드 검색을 서버에서 대신 호출한다.
// REST API 키는 브라우저에 노출되면 안 되므로 이 서버 라우트가 중계한다.

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

  // "custom"은 입력한 그대로 검색 (예: "성수 노래방")
  const keyword = type === "custom" ? "" : (TYPE_KEYWORD[type] ?? TYPE_KEYWORD.food);
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", keyword ? `${area} ${keyword}` : area);
  url.searchParams.set("size", "15");

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("[places] kakao api error:", res.status, await res.text());
    return NextResponse.json(
      { error: "카카오 장소 검색에 실패했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { documents?: KakaoPlaceDocument[] };
  const places: PlaceResult[] = (data.documents ?? []).map((d) => ({
    id: d.id,
    name: d.place_name,
    category: d.category_name?.split(" > ").pop() ?? "",
    address: d.road_address_name || d.address_name,
    phone: d.phone,
    url: d.place_url,
  }));

  return NextResponse.json({ places });
}

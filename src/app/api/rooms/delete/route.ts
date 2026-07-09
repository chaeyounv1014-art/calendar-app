import { NextRequest, NextResponse } from "next/server";
import { supabase, ROOMS_TABLE } from "@/lib/supabase";

// 방 삭제는 관리자 비밀번호(ROOM_DELETE_PASSWORD)를 아는 사람만 가능.
// 비밀번호는 서버 환경 변수에만 있으므로 브라우저에 노출되지 않는다.
export async function POST(request: NextRequest) {
  const adminPassword = process.env.ROOM_DELETE_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "삭제 비밀번호(ROOM_DELETE_PASSWORD)가 아직 설정되지 않았어요." },
      { status: 500 }
    );
  }

  let body: { roomId?: string; password?: string };
  try {
    body = (await request.json()) as { roomId?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const roomId = body.roomId?.trim();
  if (!roomId) {
    return NextResponse.json({ error: "방 정보가 없어요." }, { status: 400 });
  }

  if ((body.password ?? "") !== adminPassword) {
    return NextResponse.json(
      { error: "비밀번호가 맞지 않아요." },
      { status: 403 }
    );
  }

  // 방을 지우면 참여자 입력/시간 투표도 함께 삭제됨 (FK on delete cascade)
  const { data, error } = await supabase
    .from(ROOMS_TABLE)
    .delete()
    .eq("id", roomId)
    .select();

  if (error || !data || data.length === 0) {
    console.error(
      "[api/rooms/delete] failed:",
      error?.message ?? "no rows deleted (RLS delete policy missing?)"
    );
    return NextResponse.json(
      { error: "삭제에 실패했어요. Supabase delete 정책을 확인해주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

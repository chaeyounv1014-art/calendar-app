// 같은 브라우저에서 방에 다시 들어왔을 때 이름을 기억하기 위한 저장소.
// 실제 입력 데이터는 서버(Supabase)에 이름 기준으로 저장되므로,
// 다른 기기에서 같은 이름을 입력하면 동일 참여자로 이어서 수정할 수 있다.

function storageKey(roomId: string): string {
  return `schedule:${roomId}:name`;
}

export function normalizeName(name: string): string {
  return name.trim();
}

export function getStoredName(roomId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(storageKey(roomId));
    return value ? normalizeName(value) || null : null;
  } catch {
    return null;
  }
}

export function setStoredName(roomId: string, name: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(roomId), normalizeName(name));
  } catch {
    // localStorage 접근 불가(시크릿 모드 제한 등) 시 조용히 무시 -
    // 이름 기억만 안 될 뿐 저장/조회는 서버 기준으로 정상 동작한다.
  }
}

export function clearStoredName(roomId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(roomId));
  } catch {
    // 무시
  }
}

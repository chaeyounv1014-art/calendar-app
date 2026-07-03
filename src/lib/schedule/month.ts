export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// 해당 월 1일의 요일 (0 = 일요일 .. 6 = 토요일) = 달력 앞쪽 빈칸 수
export function getLeadingBlankCount(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export interface MonthGridCell {
  day: number | null;
}

// 일~토 7열 그리드. 1일이 올바른 요일 열에 오도록 앞을 null로 채우고,
// 마지막 주도 7칸이 되도록 뒤를 null로 채운다.
export function buildMonthGrid(year: number, month: number): MonthGridCell[] {
  const daysInMonth = getDaysInMonth(year, month);
  const leading = getLeadingBlankCount(year, month);
  const cells: MonthGridCell[] = [];
  for (let i = 0; i < leading; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });
  return cells;
}

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// <input type="month"> 값("2026-08") <-> {year, month} 변환
export function monthInputValueToParts(value: string): {
  year: number;
  month: number;
} {
  const [y, m] = value.split("-").map(Number);
  return { year: y, month: m };
}

export function partsToMonthInputValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function formatMonthLabel(year: number, month: number): string {
  return `${year}년 ${month}월`;
}

// "full" = O (종일 가능), "half" = 세모 (일부 가능), "unavailable" = X (불가)
// 키 자체가 없으면 아직 입력하지 않은 날
export type DayState = "full" | "half" | "unavailable";

// 일(day) 숫자를 문자열 키로 사용: {"1": "full", "15": "half"}
export type DayStateMap = Record<string, DayState>;

export interface ScheduleRoomRow {
  id: string;
  title: string;
  target_year: number;
  target_month: number;
  created_at: string;
}

export interface ScheduleEntryRow {
  id: string;
  room_id: string;
  participant_name: string;
  day_states: DayStateMap;
  updated_at: string;
}

export interface RoomWithCount extends ScheduleRoomRow {
  participant_count: number;
}

export interface MergedDayGroup {
  state: Extract<DayState, "full" | "half">;
  names: string[];
}

export type MergedDayResult =
  | { included: false }
  | {
      included: true;
      level: "all-full" | "mixed";
      groups: MergedDayGroup[];
    };

export interface MergedMonthResult {
  year: number;
  month: number;
  daysInMonth: number;
  days: Record<number, MergedDayResult>;
  participantCount: number;
}

// 되는 날 하루에 대해 "몇 시에 볼지"를 시계 드래그로 정한다.
// slots에는 가능한 시(0~23)를 문자열로 저장한다. 예: ["11","12","13"]
export interface TimeVoteRow {
  id: string;
  room_id: string;
  day: number;
  participant_name: string;
  slots: string[];
  updated_at: string;
}

import type { TimeSlotKey, TimeVoteRow } from "@/types/schedule";

export interface TimeSlotDef {
  key: TimeSlotKey;
  label: string;
  range: string;
  emoji: string;
}

export const TIME_SLOTS: TimeSlotDef[] = [
  { key: "morning", label: "아침", range: "9~12시", emoji: "🌅" },
  { key: "lunch", label: "점심", range: "12~2시", emoji: "🍚" },
  { key: "afternoon", label: "오후", range: "2~6시", emoji: "☕" },
  { key: "evening", label: "저녁", range: "6~9시", emoji: "🌆" },
  { key: "night", label: "밤", range: "9시 이후", emoji: "🌙" },
];

export interface SlotSummary extends TimeSlotDef {
  names: string[];
}

// 시간대별로 "가능"을 선택한 사람 이름을 모은다
export function summarizeSlotVotes(votes: TimeVoteRow[]): SlotSummary[] {
  return TIME_SLOTS.map((slot) => ({
    ...slot,
    names: votes
      .filter((v) => Array.isArray(v.slots) && v.slots.includes(slot.key))
      .map((v) => v.participant_name),
  }));
}

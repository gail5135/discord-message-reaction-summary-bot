export type Locale = "ko" | "ja";

export const LABELS: Record<Locale, { organizer: string; content: string }> = {
  ko: {
    organizer: "모집자",
    content: "모집 내용",
  },
  ja: {
    organizer: "主催者",
    content: "募集説明",
  },
};

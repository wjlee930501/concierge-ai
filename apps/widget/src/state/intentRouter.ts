export type ConciergeIntent =
  | "revisit"
  | "newvisit"
  | "px_intelligence"
  | "contact"
  | "unknown";

const INTENT_KEYWORDS: ReadonlyArray<{
  readonly intent: Exclude<ConciergeIntent, "unknown">;
  readonly keywords: readonly string[];
}> = [
  {
    intent: "contact",
    keywords: [
      "문의",
      "상담",
      "데모",
      "가격",
      "비용",
      "견적",
      "미팅",
      "연락",
      "무료",
      "체험",
      "보안",
      "개인정보",
      "계약",
      "해지",
      "받아보고"
    ]
  },
  {
    intent: "revisit",
    keywords: [
      "재방문",
      "crm",
      "환자 관리",
      "환자관리",
      "진료 후",
      "진료후",
      "리마인드",
      "기존 환자",
      "기존환자",
      "노쇼",
      "예약",
      "자동 발송",
      "콘텐츠",
      "검진",
      "카카오톡",
      "메시지"
    ]
  },
  {
    intent: "newvisit",
    keywords: [
      "신환",
      "마케팅",
      "성장",
      "개원",
      "광고",
      "유치",
      "신규 환자",
      "신규환자",
      "파트너십"
    ]
  },
  {
    intent: "px_intelligence",
    keywords: [
      "데이터",
      "ai",
      "px",
      "인사이트",
      "경영",
      "지표",
      "분석",
      "intelligence",
      "성과",
      "수치",
      "사례",
      "매출",
      "근거"
    ]
  }
];

export function routeConciergeIntent(query: string): ConciergeIntent {
  const normalized = normalizeIntentText(query);
  if (normalized.length === 0) return "unknown";

  for (const row of INTENT_KEYWORDS) {
    if (
      row.keywords.some((keyword) =>
        normalized.includes(normalizeIntentText(keyword))
      )
    ) {
      return row.intent;
    }
  }

  return "unknown";
}

export function conciergeIntentToChipId(
  intent: ConciergeIntent
): string | null {
  switch (intent) {
    case "revisit":
      return "chip_revisit";
    case "newvisit":
      return "chip_newvisit";
    case "px_intelligence":
      return "chip_px_intelligence";
    case "contact":
      return "chip_contact";
    case "unknown":
      return null;
  }
}

export function conciergeIntentToStepId(
  intent: ConciergeIntent
): string | null {
  switch (intent) {
    case "revisit":
      return "step_revisit";
    case "newvisit":
      return "step_newvisit";
    case "px_intelligence":
      return "step_px_intelligence";
    case "contact":
      return "step_contact";
    case "unknown":
      return null;
  }
}

function normalizeIntentText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/gu, " ");
}

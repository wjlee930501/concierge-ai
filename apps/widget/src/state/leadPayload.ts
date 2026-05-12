import { routeConciergeIntent, type ConciergeIntent } from "./intentRouter";

export type { ConciergeIntent } from "./intentRouter";

export type InterestArea =
  | "revisit"
  | "newvisit"
  | "px_intelligence"
  | "pricing"
  | "partnership"
  | "other";

export type LeadTemperature = "cold" | "warm" | "hot";

export type MockLeadPayload = {
  readonly source: "concierge_ai";
  readonly host: "motionlabs";
  readonly intent: ConciergeIntent;
  readonly leadTemperature: LeadTemperature;
  readonly hospitalName: string;
  readonly name: string;
  readonly phone: string;
  readonly specialty: string;
  readonly region: string;
  readonly interestArea: InterestArea;
  readonly preferredContactTime: string;
  readonly painPoint: string;
  readonly consent: boolean;
  readonly conversationSummary: string;
  readonly visitedSections: readonly string[];
  readonly createdAt: string;
};

export type BuildMockLeadPayloadInput = {
  readonly intent: ConciergeIntent;
  readonly fields: Readonly<Record<string, string>>;
  readonly consent: boolean;
  readonly conversationSummary: string;
  readonly visitedSections: readonly string[];
  readonly createdAt?: string;
};

type PayloadInteraction = {
  readonly id: string;
  readonly label: string;
};

const INTEREST_AREAS = new Set<InterestArea>([
  "revisit",
  "newvisit",
  "px_intelligence",
  "pricing",
  "partnership",
  "other"
]);

export function buildMockLeadPayload(
  input: BuildMockLeadPayloadInput
): MockLeadPayload {
  return {
    source: "concierge_ai",
    host: "motionlabs",
    intent: input.intent,
    leadTemperature: resolveLeadTemperature(input.intent),
    hospitalName: readField(input.fields, "hospitalName"),
    name: readField(input.fields, "name"),
    phone: readField(input.fields, "phone"),
    specialty: readField(input.fields, "specialty"),
    region: readField(input.fields, "region"),
    interestArea: parseInterestArea(input.fields.interestArea),
    preferredContactTime: readField(input.fields, "preferredContactTime"),
    painPoint: readField(input.fields, "painPoint"),
    consent: input.consent,
    conversationSummary: input.conversationSummary,
    visitedSections: [...input.visitedSections],
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}

export function resolveIntentFromInteractions(
  interactions: readonly PayloadInteraction[],
  fields: Readonly<Record<string, string>>
): ConciergeIntent {
  const interestArea = parseInterestArea(fields.interestArea);
  if (
    interestArea === "revisit" ||
    interestArea === "newvisit" ||
    interestArea === "px_intelligence"
  ) {
    return interestArea;
  }
  if (interestArea === "pricing" || interestArea === "partnership") {
    return "contact";
  }

  for (const interaction of [...interactions].reverse()) {
    const byId = intentFromKnownId(interaction.id);
    if (byId !== "unknown") return byId;
    const byLabel = routeConciergeIntent(interaction.label);
    if (byLabel !== "unknown") return byLabel;
  }

  return "unknown";
}

export function buildVisitedSections(
  interactions: readonly PayloadInteraction[]
): readonly string[] {
  const fromInteractions = interactions.reduce<readonly string[]>(
    (acc, interaction) => {
      const section = sectionFromKnownId(interaction.id);
      if (section === null || acc.includes(section)) return acc;
      return [...acc, section];
    },
    ["hero"]
  );
  return fromInteractions.includes("contact")
    ? fromInteractions
    : [...fromInteractions, "contact"];
}

export function buildConversationSummary(input: {
  readonly intent: ConciergeIntent;
  readonly fallbackSummary: string;
}): string {
  switch (input.intent) {
    case "revisit":
      return "방문자는 Re:Visit에 관심을 보였고, 기존 환자 재방문 관리에 대한 상담을 요청함.";
    case "newvisit":
      return "방문자는 New:Visit / Re:Solve에 관심을 보였고, 신환 유치와 병원 성장 과제에 대한 상담을 요청함.";
    case "px_intelligence":
      return "방문자는 PX Intelligence에 관심을 보였고, 환자 경험 데이터와 경영 인사이트에 대한 상담을 요청함.";
    case "contact":
      return "방문자는 상담 신청 의사를 보였고, 병원 상황에 맞춘 안내를 요청함.";
    case "unknown":
      return input.fallbackSummary;
  }
}

function readField(
  fields: Readonly<Record<string, string>>,
  fieldId: string
): string {
  return fields[fieldId]?.trim() ?? "";
}

function parseInterestArea(value: string | undefined): InterestArea {
  if (value !== undefined && INTEREST_AREAS.has(value as InterestArea)) {
    return value as InterestArea;
  }
  return "other";
}

function resolveLeadTemperature(intent: ConciergeIntent): LeadTemperature {
  if (intent === "unknown") return "cold";
  return "warm";
}

function intentFromKnownId(id: string): ConciergeIntent {
  if (id.includes("revisit")) return "revisit";
  if (id.includes("newvisit")) return "newvisit";
  if (id.includes("px_intelligence") || id.includes("px-intelligence")) {
    return "px_intelligence";
  }
  if (id.includes("contact") || id.includes("lead")) return "contact";
  return "unknown";
}

function sectionFromKnownId(id: string): string | null {
  const intent = intentFromKnownId(id);
  switch (intent) {
    case "revisit":
      return "revisit";
    case "newvisit":
      return "newvisit";
    case "px_intelligence":
      return "px-intelligence";
    case "contact":
      return "contact";
    case "unknown":
      return null;
  }
}

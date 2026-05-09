import type { Scenario } from "@conciergeai/shared";

export type SessionInteraction = {
  readonly kind: "chip" | "step" | "free-input";
  readonly id: string;
  readonly label: string;
};

export type LeadSummaryInput = {
  readonly scenario: Scenario;
  readonly interactions: readonly SessionInteraction[];
  readonly variantSuffix?: string;
};

export function buildLeadSummary(input: LeadSummaryInput): string {
  const labels = collectIntentLabels(input.scenario, input.interactions);

  const intentClause =
    labels.length === 0
      ? "핵심 흐름 안내"
      : labels.join(", ");

  const baseBody = `방문자께서 ${intentClause}에 관심을 보이셨고, 도입 가능 여부를 확인하고자 상담을 신청하셨습니다.`;
  const suffix =
    input.variantSuffix !== undefined
      ? `\n${input.variantSuffix}`
      : "";

  return `${baseBody}${suffix}`.trim();
}

function collectIntentLabels(
  scenario: Scenario,
  interactions: readonly SessionInteraction[]
): readonly string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const interaction of interactions) {
    if (interaction.kind === "free-input") continue;
    const cleaned = interaction.label.trim();
    if (cleaned.length === 0) continue;
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    ordered.push(cleaned);
  }

  if (ordered.length === 0 && interactions.some((i) => i.kind === "free-input")) {
    ordered.push("자유 입력으로 직접 문의");
  }

  void scenario; // reserved for source-data scenario topic mapping in Phase 5
  return ordered.slice(0, 3);
}

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
  const curationContext = collectCurationContext(
    input.scenario,
    input.interactions
  );

  const intentClause =
    labels.length === 0
      ? "핵심 흐름 안내"
      : labels.join(", ");

  const baseBody = `방문자께서 ${intentClause}에 관심을 보이셨고, 도입 가능 여부를 확인하고자 상담을 신청하셨습니다.`;
  const curationBody =
    curationContext.length > 0
      ? `\n큐레이션 맥락: ${curationContext.join(" / ")}`
      : "";
  const suffix =
    input.variantSuffix !== undefined
      ? `\n${input.variantSuffix}`
      : "";

  return `${baseBody}${curationBody}${suffix}`.trim();
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

function collectCurationContext(
  scenario: Scenario,
  interactions: readonly SessionInteraction[]
): readonly string[] {
  const stepIds = collectVisitedStepIds(scenario, interactions);
  const contexts: string[] = [];
  const seen = new Set<string>();

  for (const stepId of stepIds) {
    for (const chapter of scenario.chapters ?? []) {
      for (const section of chapter.sections) {
        if (section.stepId !== stepId) continue;
        const key = `${chapter.id}:${section.id}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const beatMessages = section.beats
          .map((beat) => beat.bubbleMessage?.text.trim())
          .filter((text): text is string => text !== undefined && text.length > 0)
          .slice(0, 2);
        const beatClause =
          beatMessages.length > 0 ? ` (${beatMessages.join(" / ")})` : "";
        contexts.push(`${chapter.title} > ${section.title}${beatClause}`);
      }
    }
  }

  return contexts.slice(0, 3);
}

function collectVisitedStepIds(
  scenario: Scenario,
  interactions: readonly SessionInteraction[]
): readonly string[] {
  const stepIds: string[] = [];
  const seen = new Set<string>();

  const add = (stepId: string) => {
    if (seen.has(stepId)) return;
    seen.add(stepId);
    stepIds.push(stepId);
  };

  for (const interaction of interactions) {
    if (interaction.kind === "step") {
      add(interaction.id);
      continue;
    }

    if (interaction.kind === "chip") {
      const chip = scenario.heroBubble.quickChips.find(
        (candidate) => candidate.id === interaction.id
      );
      if (chip !== undefined) add(chip.nextStepId);
    }
  }

  return stepIds;
}

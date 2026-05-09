// Mock LLM streaming for free-input mode (PRD v1.2 §5).
// Real Anthropic provider wiring happens in Phase 5 via /api/concierge proxy.
// Layer 1 prompt injection detection (PRD v1.2 §6.3) is delegated to
// `@conciergeai/shared/security/injection-patterns`.

import type {
  Scenario,
  ScenarioQuickChip,
  SafetyResponseReason
} from "@conciergeai/shared";
import {
  detectInjection,
  SAFETY_RESPONSE_DEFAULT_COPY
} from "@conciergeai/shared";

export type AiSuggestion =
  | { readonly kind: "navigate"; readonly chipId: string; readonly label: string }
  | { readonly kind: "safety"; readonly reason: SafetyResponseReason };

export type AiStreamEvent =
  | { readonly type: "chunk"; readonly text: string }
  | { readonly type: "done"; readonly fullText: string; readonly suggestion: AiSuggestion };

export type StreamMockAiInput = {
  readonly query: string;
  readonly scenario: Scenario;
  readonly onEvent: (event: AiStreamEvent) => void;
  readonly signal?: AbortSignal;
  readonly tokenDelayMs?: number;
};

const KEYWORD_INTENT_TABLE: ReadonlyArray<{
  readonly keywords: readonly string[];
  readonly chipMatch: readonly string[];
  readonly response: string;
}> = [
  {
    keywords: [
      "데모",
      "체험",
      "테스트",
      "샘플",
      "받아",
      "카카오",
      "메시지",
      "알림톡",
      "직접",
      "demo"
    ],
    chipMatch: ["chip_demo", "chip_core"],
    response:
      "데모 흐름부터 짚어 드릴게요. 핵심 동작이 동영상이 아니라 직접 클릭으로 보이도록 안내합니다."
  },
  {
    keywords: [
      "사례",
      "근거",
      "성과",
      "레퍼런스",
      "매출",
      "수치",
      "데이터",
      "reference",
      "case"
    ],
    chipMatch: ["chip_proof"],
    response:
      "사례·근거 섹션부터 짚어 드릴게요. 설명보다 신뢰 근거를 먼저 보면 도입 의사 결정 시간이 짧아집니다."
  },
  {
    keywords: [
      "상담",
      "문의",
      "도입",
      "가격",
      "비용",
      "견적",
      "계약",
      "해지",
      "보안",
      "개인정보",
      "정보보호",
      "iso",
      "contact",
      "consult"
    ],
    chipMatch: ["chip_contact"],
    response:
      "상담 단계로 안내드릴게요. 입력해 주신 내용을 정리해 담당자에게 전달합니다."
  },
  {
    keywords: [
      "핵심",
      "뭐",
      "무엇",
      "어떤",
      "노쇼",
      "리마인드",
      "예약",
      "자동",
      "콘텐츠",
      "진료과",
      "정형외과",
      "내과",
      "검진",
      "환자관리",
      "crm",
      "core"
    ],
    chipMatch: ["chip_core"],
    response:
      "서비스 핵심부터 짚어 드릴게요. 30초 안에 무엇을 만드는지 보여 드립니다."
  }
];

export async function streamMockAiResponse(
  input: StreamMockAiInput
): Promise<void> {
  const matched = matchIntent(input.query, input.scenario);
  const tokenDelay = input.tokenDelayMs ?? 18;
  await streamText(matched.response, input.onEvent, {
    signal: input.signal ?? null,
    tokenDelayMs: tokenDelay
  });
  if (isAborted(input.signal)) return;
  input.onEvent({
    type: "done",
    fullText: matched.response,
    suggestion: matched.suggestion
  });
}

function matchIntent(
  query: string,
  scenario: Scenario
): { readonly response: string; readonly suggestion: AiSuggestion } {
  const trimmed = query.trim();
  if (trimmed.length === 0) return safetyMatch("out_of_scope");

  // Layer 1 — prompt injection detection (PRD v1.2 §6.3)
  if (detectInjection(trimmed).hit) {
    return safetyMatch("prompt_injection_detected");
  }

  if (looksLikePiiRequest(trimmed)) {
    return safetyMatch("pii_request");
  }

  const lowered = trimmed.toLowerCase();
  for (const row of KEYWORD_INTENT_TABLE) {
    const hit = row.keywords.some((keyword) =>
      lowered.includes(keyword.toLowerCase())
    );
    if (!hit) continue;
    const chip = pickFirstChip(scenario.heroBubble.quickChips, row.chipMatch);
    if (chip === null) continue;
    return {
      response: row.response,
      suggestion: { kind: "navigate", chipId: chip.id, label: chip.label }
    };
  }

  return safetyMatch("out_of_scope");
}

function safetyMatch(reason: SafetyResponseReason): {
  readonly response: string;
  readonly suggestion: AiSuggestion;
} {
  return {
    response: SAFETY_RESPONSE_DEFAULT_COPY[reason],
    suggestion: { kind: "safety", reason }
  };
}

function pickFirstChip(
  chips: readonly ScenarioQuickChip[],
  preferredIds: readonly string[]
): ScenarioQuickChip | null {
  for (const id of preferredIds) {
    const chip = chips.find((candidate) => candidate.id === id);
    if (chip !== undefined) return chip;
  }
  return chips[0] ?? null;
}

function looksLikePiiRequest(text: string): boolean {
  return /주민|환자\s*(?:연락처|전화|이메일|진단|처방)|개인정보\s*(?:목록|내역|원본|알려|보여|다운로드)|연락처\s*(?:알려|보여)|이메일\s*(?:알려|보여)|전화번호\s*(?:알려|목록)/.test(
    text
  );
}

async function streamText(
  text: string,
  onEvent: (event: AiStreamEvent) => void,
  options: {
    readonly signal: AbortSignal | null;
    readonly tokenDelayMs: number;
  }
): Promise<void> {
  const tokens = chunkText(text);
  for (const token of tokens) {
    if (isAborted(options.signal)) return;
    if (options.tokenDelayMs > 0) {
      await delay(options.tokenDelayMs, options.signal);
      if (isAborted(options.signal)) return;
    }
    onEvent({ type: "chunk", text: token });
  }
}

function chunkText(text: string): readonly string[] {
  if (text.length === 0) return [];
  const codepoints = Array.from(text);
  const groupSize = 2;
  const groups: string[] = [];
  for (let i = 0; i < codepoints.length; i += groupSize) {
    groups.push(codepoints.slice(i, i + groupSize).join(""));
  }
  return groups;
}

function delay(ms: number, signal: AbortSignal | null): Promise<void> {
  return new Promise((resolve) => {
    if (isAborted(signal)) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      resolve();
    }, ms);
    if (signal !== null) {
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true }
      );
    }
  });
}

function isAborted(signal: AbortSignal | null | undefined): boolean {
  return signal !== null && signal !== undefined && signal.aborted;
}

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
import { conciergeIntentToChipId, routeConciergeIntent } from "./intentRouter";

export type AiSuggestion =
  | {
      readonly kind: "navigate";
      readonly chipId: string;
      readonly label: string;
    }
  | { readonly kind: "safety"; readonly reason: SafetyResponseReason };

export type AiStreamEvent =
  | { readonly type: "chunk"; readonly text: string }
  | {
      readonly type: "done";
      readonly fullText: string;
      readonly suggestion: AiSuggestion;
    };

export type StreamMockAiInput = {
  readonly query: string;
  readonly scenario: Scenario;
  readonly onEvent: (event: AiStreamEvent) => void;
  readonly signal?: AbortSignal;
  readonly tokenDelayMs?: number;
};

const INTENT_RESPONSE_COPY = {
  revisit:
    "기존 환자 재방문 관리 흐름으로 안내드릴게요. 진료 후 안내와 CRM을 한 번에 확인할 수 있습니다.",
  newvisit:
    "신환 유치와 병원 성장 과제에 맞춘 흐름으로 안내드릴게요. 성장 파트너십 관점에서 핵심만 짚겠습니다.",
  px_intelligence:
    "PX Intelligence 흐름으로 안내드릴게요. 환자 경험 데이터가 경영 의사결정으로 이어지는 지점을 보여드립니다.",
  contact:
    "상담 신청 흐름으로 안내드릴게요. 병원 상황에 맞춰 담당자가 안내할 수 있도록 필요한 정보만 정리합니다."
} as const;

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

  const intent = routeConciergeIntent(trimmed);
  if (intent !== "unknown") {
    const chip = pickFirstChip(scenario.heroBubble.quickChips, [
      conciergeIntentToChipId(intent)
    ]);
    if (chip === null) return safetyMatch("out_of_scope");
    return {
      response: INTENT_RESPONSE_COPY[intent],
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
  preferredIds: readonly (string | null)[]
): ScenarioQuickChip | null {
  for (const id of preferredIds) {
    if (id === null) continue;
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

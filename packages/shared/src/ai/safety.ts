// PRD v1.2 §5.2 + §5.3 — safety_response payload schema.

import { z } from "zod";

export const SAFETY_RESPONSE_REASONS = [
  "out_of_scope",
  "kb_unavailable",
  "pii_request",
  "prompt_injection_detected",
  "policy_violation"
] as const;

export type SafetyResponseReason = (typeof SAFETY_RESPONSE_REASONS)[number];

export const safetyResponseReasonSchema = z.enum(SAFETY_RESPONSE_REASONS);

export const safetyResponsePayloadSchema = z
  .object({
    reason: safetyResponseReasonSchema,
    message: z.string().min(1).max(200),
    offer_handoff: z.boolean()
  })
  .strict();

export type SafetyResponsePayload = z.infer<typeof safetyResponsePayloadSchema>;

// PRD v1.2 §5.3 placeholder copy. source data 도착 후 한국어 카피 확정.
export const SAFETY_RESPONSE_DEFAULT_COPY: Record<
  SafetyResponseReason,
  string
> = {
  out_of_scope:
    "그 부분은 담당자가 직접 안내드리는 게 가장 빨라요. 1영업일 안에 연락드릴 수 있도록 정보 남겨주시겠어요?",
  kb_unavailable: "정확한 정보를 위해 담당자가 직접 안내드리는 게 좋겠어요.",
  pii_request:
    "개인정보 관련 요청은 처리할 수 없어요. 담당자에게 직접 연락 부탁드려요.",
  prompt_injection_detected:
    "답변하기 어려운 영역이에요. 모션랩스 도구나 도입 관련해서 도와드릴 게 있을까요?",
  policy_violation: "그 부분은 답변드리기 어려워요. 다른 부분 도와드릴게요."
};

export function buildDefaultSafetyResponse(
  reason: SafetyResponseReason,
  override?: { readonly message?: string; readonly offer_handoff?: boolean }
): SafetyResponsePayload {
  return {
    reason,
    message: override?.message ?? SAFETY_RESPONSE_DEFAULT_COPY[reason],
    offer_handoff: override?.offer_handoff ?? true
  };
}

export function isSafetyResponseReason(
  value: unknown
): value is SafetyResponseReason {
  return (
    typeof value === "string" &&
    (SAFETY_RESPONSE_REASONS as readonly string[]).includes(value)
  );
}

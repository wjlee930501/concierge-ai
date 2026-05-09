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
    message: z.string().min(1),
    isPlaceholderCopy: z.boolean()
  })
  .strict();

export type SafetyResponsePayload = z.infer<typeof safetyResponsePayloadSchema>;

// Placeholder copy is FINAL_ALIGNMENT §3 placeholder — final 한국어 카피는 source data
// 도착 후 확정한다. `isPlaceholderCopy: true` 플래그가 boundary 표식 역할을 한다.
export const SAFETY_RESPONSE_PLACEHOLDER_COPY: Record<
  SafetyResponseReason,
  string
> = {
  out_of_scope:
    "죄송하지만 이 주제는 안내 범위에 포함되어 있지 않아요. 도움드릴 수 있는 다른 주제를 골라 주세요.",
  kb_unavailable:
    "지금 기준 자료를 불러올 수 없어 정확한 답변을 드리기 어려워요. 잠시 후 다시 시도해 주세요.",
  pii_request:
    "개인정보를 묻는 질문에는 답변드릴 수 없어요. 필요한 절차로 안내해 드릴게요.",
  prompt_injection_detected:
    "이 입력은 안내 시스템의 정책을 우회하려는 패턴으로 감지됐어요. 다른 질문을 부탁드려요.",
  policy_violation:
    "이 답변은 정책상 제공할 수 없어요. 가능한 다른 도움을 드릴게요."
};

export function buildPlaceholderSafetyResponse(
  reason: SafetyResponseReason
): SafetyResponsePayload {
  return {
    reason,
    message: SAFETY_RESPONSE_PLACEHOLDER_COPY[reason],
    isPlaceholderCopy: true
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

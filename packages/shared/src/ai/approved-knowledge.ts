// PRD v1.2 §6 — Approved Knowledge gate.
//
// v1.1까지 있던 banned-vocab 패턴 (clinic / hospital / patient / 의료 / 병원 / 환자
// 등)은 모션랩스 정상 비즈니스 도메인이므로 v1.2 §6.1에서 폐기됐다. 본 모듈은
// 이제 PIPA + prompt injection 두 축으로만 정렬된다 (PRD v1.2 §6.2~§6.3). 실
// system prompt seal과 output sanitizer는 `../security/`에 분리되어 있다.

import { z } from "zod";

export const approvedKnowledgeDocumentSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    isPlaceholder: z.boolean(),
    approved: z.boolean()
  })
  .strict();

export type ApprovedKnowledgeDocument = z.infer<
  typeof approvedKnowledgeDocumentSchema
>;

export type RetrievalGateInput = {
  readonly query: string;
  readonly availableDocs: readonly ApprovedKnowledgeDocument[];
};

export type RetrievalGateOutput =
  | { readonly ok: true; readonly docs: readonly ApprovedKnowledgeDocument[] }
  | {
      readonly ok: false;
      readonly reason: "kb-empty" | "query-empty" | "not-approved";
    };

export function buildRetrievalGate(
  input: RetrievalGateInput
): RetrievalGateOutput {
  if (input.query.trim().length === 0) {
    return { ok: false, reason: "query-empty" };
  }
  if (input.availableDocs.length === 0) {
    return { ok: false, reason: "kb-empty" };
  }
  const allApproved = input.availableDocs.every((doc) => doc.approved === true);
  if (!allApproved) {
    return { ok: false, reason: "not-approved" };
  }
  return { ok: true, docs: input.availableDocs };
}

export function isToolBranchAllowed(
  toolName: string,
  retrieval: RetrievalGateOutput
): boolean {
  if (toolName === "safety_response" || toolName === "noop") {
    return true;
  }
  if (!retrieval.ok) {
    return false;
  }
  return true;
}

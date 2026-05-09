import { z } from "zod";

export const approvedKnowledgeDocumentSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    isPlaceholder: z.boolean(),
    bannedVocabClean: z.boolean()
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
  | { readonly ok: false; readonly reason: "kb-empty" | "query-empty" | "vocab-blocked" };

export type SystemPromptSealInput = {
  readonly basePrompt: string;
  readonly approvedDocs: readonly ApprovedKnowledgeDocument[];
};

export type SystemPromptSealOutput = {
  readonly prompt: string;
  readonly seal: string;
};

const KB_EXTERNAL_URL_PATTERNS = [
  /https?:\/\//gi,
  /\bwww\./gi
] as const;

const BANNED_VOCAB_PATTERN =
  /(clinic|hospital|patient|medical|appointment|병원|환자|진료|예약|의료|HandDoc|Re:?putation|NMOS)/i;

export function buildRetrievalGate(
  input: RetrievalGateInput
): RetrievalGateOutput {
  if (input.query.trim().length === 0) {
    return { ok: false, reason: "query-empty" };
  }
  if (input.availableDocs.length === 0) {
    return { ok: false, reason: "kb-empty" };
  }
  const allBannedClean = input.availableDocs.every(
    (doc) => doc.bannedVocabClean === true && !BANNED_VOCAB_PATTERN.test(doc.body)
  );
  if (!allBannedClean) {
    return { ok: false, reason: "vocab-blocked" };
  }
  return { ok: true, docs: input.availableDocs };
}

export function sealSystemPrompt(
  input: SystemPromptSealInput
): SystemPromptSealOutput {
  const sanitizedDocs = input.approvedDocs
    .map((doc) => sanitizeKbBody(doc.body))
    .join("\n---\n");
  const prompt = `${input.basePrompt}\n\n[APPROVED KNOWLEDGE DOCUMENTS — use ONLY this content for factual answers]\n${sanitizedDocs}\n[END APPROVED KNOWLEDGE]\n\nIf the user's question cannot be answered from the approved knowledge above, you must call the safety_response tool with reason "out_of_scope" or "kb_unavailable". Do not invent answers.`;
  const seal = `kb-seal:${input.approvedDocs.length}:${input.approvedDocs
    .map((doc) => `${doc.id}@${doc.version}`)
    .join(",")}`;
  return { prompt, seal };
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

function sanitizeKbBody(body: string): string {
  let sanitized = body;
  for (const pattern of KB_EXTERNAL_URL_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED-URL]");
  }
  sanitized = sanitized.replace(BANNED_VOCAB_PATTERN, "[REDACTED-BANNED]");
  return sanitized;
}

export function isApprovedKnowledgeBodySafe(body: string): boolean {
  return !BANNED_VOCAB_PATTERN.test(body);
}

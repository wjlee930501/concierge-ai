import { z } from "zod";
import { safetyResponsePayloadSchema } from "./safety";

export const AI_TOOL_NAMES = [
  "navigate_to_section",
  "show_kb_doc",
  "ask_lead_info",
  "submit_lead",
  "escalate_to_human",
  "safety_response",
  "noop"
] as const;

export type AiToolName = (typeof AI_TOOL_NAMES)[number];

export const navigateToSectionInputSchema = z
  .object({
    sectionId: z.string().min(1),
    reason: z.string().min(1).max(280)
  })
  .strict();

export const showKbDocInputSchema = z
  .object({
    docId: z.string().min(1),
    excerpt: z.string().min(1).max(500),
    citationUrl: z.string().min(1).optional()
  })
  .strict();

export const askLeadInfoInputSchema = z
  .object({
    fieldIds: z.array(z.string().min(1)).min(1)
  })
  .strict();

export const submitLeadInputSchema = z
  .object({
    leadFingerprint: z.string().min(1),
    fieldsCollected: z.array(z.string().min(1)).min(1),
    consentVersion: z.string().min(1)
  })
  .strict();

export const escalateToHumanInputSchema = z
  .object({
    summary: z.string().min(1).max(500),
    channel: z.enum(["slack-staging", "slack-mock"])
  })
  .strict();

export const safetyResponseInputSchema = safetyResponsePayloadSchema;

export const noopInputSchema = z
  .object({
    note: z.string().min(1).max(280)
  })
  .strict();

export const aiToolSchemas = {
  navigate_to_section: navigateToSectionInputSchema,
  show_kb_doc: showKbDocInputSchema,
  ask_lead_info: askLeadInfoInputSchema,
  submit_lead: submitLeadInputSchema,
  escalate_to_human: escalateToHumanInputSchema,
  safety_response: safetyResponseInputSchema,
  noop: noopInputSchema
} as const satisfies Record<AiToolName, z.ZodType>;

export type AiToolInput<TName extends AiToolName> = z.infer<
  (typeof aiToolSchemas)[TName]
>;

export type AiToolCall<TName extends AiToolName = AiToolName> = {
  readonly tool: TName;
  readonly input: AiToolInput<TName>;
  readonly nonce: string;
  readonly timestamp: number;
};

export const aiToolCallSchema = z
  .object({
    tool: z.enum(AI_TOOL_NAMES),
    input: z.unknown(),
    nonce: z.string().min(1),
    timestamp: z.number().int().positive()
  })
  .strict()
  .superRefine((value, ctx) => {
    const schema = aiToolSchemas[value.tool];
    const result = schema.safeParse(value.input);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          ...issue,
          path: ["input", ...issue.path]
        });
      }
    }
  });

export function parseAiToolCall(value: unknown): AiToolCall {
  const parsed = aiToolCallSchema.parse(value);
  return parsed as AiToolCall;
}

export function safeParseAiToolCall(value: unknown):
  | { readonly ok: true; readonly value: AiToolCall }
  | { readonly ok: false; readonly error: z.ZodError } {
  const result = aiToolCallSchema.safeParse(value);
  if (result.success) {
    return { ok: true, value: result.data as AiToolCall };
  }
  return { ok: false, error: result.error };
}

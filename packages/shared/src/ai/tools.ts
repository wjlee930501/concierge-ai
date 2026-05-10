// PRD v1.2 §5.2 — AI tool 7종 zod schema (canonical).

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

const choiceSchema = z
  .object({
    label: z.string().min(1).max(20),
    next_action: z.string().min(1)
  })
  .strict();

export const navigateToSectionInputSchema = z
  .object({
    section_id: z.string().min(1),
    transition_hint: z.string().min(1).max(40).optional(),
    message: z.string().min(1).max(200),
    choices: z.array(choiceSchema).min(2).max(4)
  })
  .strict();

const docChoiceSchema = z
  .object({
    label: z.string().min(1),
    next_action: z.string().min(1)
  })
  .strict();

export const showKbDocInputSchema = z
  .object({
    doc_id: z.string().min(1),
    title: z.string().min(1).max(40),
    body: z.string().min(1).max(300),
    choices: z.array(docChoiceSchema).optional()
  })
  .strict();

export const askLeadInfoInputSchema = z
  .object({
    headline: z.string().min(1),
    prefill: z
      .object({
        visitor_type: z.string().min(1).optional(),
        specialty: z.string().min(1).optional(),
        interest: z.string().min(1).optional(),
        opening_planned: z.boolean().optional()
      })
      .strict(),
    consent_required: z
      .array(z.enum(["privacy", "marketing"]))
      .default(["privacy"]),
    skip_allowed: z.boolean().default(true)
  })
  .strict();

export const submitLeadInputSchema = z
  .object({
    name: z.string().min(1),
    phone: z.string().min(1),
    specialty: z.string().min(1),
    interest: z.string().min(1).optional(),
    clinic_name: z.string().min(1).optional(),
    consent_privacy: z.boolean(),
    consent_marketing: z.boolean(),
    conversation_summary: z.string().min(1)
  })
  .strict();

export const escalateToHumanInputSchema = z
  .object({
    slack_channel: z.string().min(1).default("#concierge-leads"),
    summary: z.string().min(1).max(500),
    urgency: z.enum(["hot", "normal"]),
    recommended_followup: z.string().min(1)
  })
  .strict();

export const safetyResponseInputSchema = safetyResponsePayloadSchema;

export const noopInputSchema = z
  .object({
    reason: z.string().min(1).optional()
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

export type AiToolCall<TName extends AiToolName = AiToolName> =
  TName extends AiToolName
    ? {
        readonly tool: TName;
        readonly input: AiToolInput<TName>;
        readonly nonce: string;
        readonly timestamp: number;
        readonly metadata?: AiToolCallMetadata;
      }
    : never;

// PRD v1.2 §5.4 — capture_intent metadata 표면 (silent).
export const aiToolCallMetadataSchema = z
  .object({
    visitor_type: z.string().min(1).optional(),
    specialty: z.string().min(1).optional(),
    pain_point: z.string().min(1).optional(),
    buying_stage: z.string().min(1).optional(),
    lead_temperature: z.enum(["cold", "warm", "hot"]).optional(),
    confidence: z.number().min(0).max(1).optional()
  })
  .strict();

export type AiToolCallMetadata = z.infer<typeof aiToolCallMetadataSchema>;

export const aiToolCallSchema = z
  .object({
    tool: z.enum(AI_TOOL_NAMES),
    input: z.unknown(),
    nonce: z.string().min(1),
    timestamp: z.number().int().positive(),
    metadata: aiToolCallMetadataSchema.optional()
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

export function safeParseAiToolCall(
  value: unknown
):
  | { readonly ok: true; readonly value: AiToolCall }
  | { readonly ok: false; readonly error: z.ZodError } {
  const result = aiToolCallSchema.safeParse(value);
  if (result.success) {
    return { ok: true, value: result.data as AiToolCall };
  }
  return { ok: false, error: result.error };
}

import { z } from "zod";
import type { Scenario, ScenarioStepLookup } from "./types";

export const scenarioAvatarPointSchema = z.enum(["up", "left", "right"]);

export const scenarioChoiceSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    nextStepId: z.string().min(1).nullable()
  })
  .strict();

export const scenarioPopoverSchema = z
  .object({
    label: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1)
  })
  .strict();

export const scenarioStepSchema = z
  .object({
    id: z.string().min(1),
    popover: scenarioPopoverSchema,
    spotlightTarget: z.string().min(1),
    avatarPoint: scenarioAvatarPointSchema,
    choices: z.array(scenarioChoiceSchema),
    isClosing: z.boolean()
  })
  .strict();

export const scenarioQuickChipSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    nextStepId: z.string().min(1)
  })
  .strict();

export const scenarioHeroBubbleSchema = z
  .object({
    message: z.string().min(1),
    quickChips: z.array(scenarioQuickChipSchema).min(1).max(4)
  })
  .strict();

export const scenarioLeadFormFieldSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(["text", "email", "tel", "textarea"]),
    required: z.boolean(),
    placeholder: z.string().min(1).optional()
  })
  .strict();

export const scenarioPipaConsentSchema = z
  .object({
    id: z.enum(["required", "marketing", "expanded"]),
    label: z.string().min(1),
    required: z.boolean()
  })
  .strict();

export const scenarioLeadFormSchema = z
  .object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    fields: z.array(scenarioLeadFormFieldSchema).min(1),
    pipaConsents: z
      .array(scenarioPipaConsentSchema)
      .length(3)
      .refine(
        (consents) => {
          const ids = consents.map((consent) => consent.id);
          const expected: ReadonlyArray<
            "required" | "marketing" | "expanded"
          > = ["required", "marketing", "expanded"];
          return expected.every((id) => ids.includes(id));
        },
        { message: "PIPA consent must include required, marketing, expanded" }
      ),
    retentionDescription: z.string().min(1),
    submitLabel: z.string().min(1),
    thanksMessage: z.string().min(1)
  })
  .strict();

export const scenarioSchema = z
  .object({
    id: z.string().min(1),
    version: z.string().min(1),
    isPlaceholder: z.boolean(),
    placeholderNotice: z.string().min(1).optional(),
    heroBubble: scenarioHeroBubbleSchema,
    steps: z.array(scenarioStepSchema).min(1),
    leadForm: scenarioLeadFormSchema
  })
  .strict()
  .superRefine((scenario, ctx) => {
    const ids = new Set(scenario.steps.map((step) => step.id));
    if (ids.size !== scenario.steps.length) {
      ctx.addIssue({
        code: "custom",
        message: "Scenario step ids must be unique",
        path: ["steps"]
      });
    }
    for (const chip of scenario.heroBubble.quickChips) {
      if (!ids.has(chip.nextStepId)) {
        ctx.addIssue({
          code: "custom",
          message: `Quick chip ${chip.id} points to missing step ${chip.nextStepId}`,
          path: ["heroBubble", "quickChips"]
        });
      }
    }
    for (const step of scenario.steps) {
      if (
        !step.isClosing &&
        (step.choices.length < 2 || step.choices.length > 4)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Non-closing scenario steps must expose 2 to 4 choices",
          path: ["steps"]
        });
      }
      for (const choice of step.choices) {
        if (choice.nextStepId !== null && !ids.has(choice.nextStepId)) {
          ctx.addIssue({
            code: "custom",
            message: `Step ${step.id} choice ${choice.id} points to missing step ${choice.nextStepId}`,
            path: ["steps"]
          });
        }
      }
    }
    const closingCount = scenario.steps.filter((step) => step.isClosing).length;
    if (closingCount === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Scenario must have at least one closing step",
        path: ["steps"]
      });
    }
  });

export function parseScenario(input: unknown): Scenario {
  return scenarioSchema.parse(input) as Scenario;
}

export function safeParseScenario(input: unknown):
  | { readonly ok: true; readonly value: Scenario }
  | { readonly ok: false; readonly error: z.ZodError } {
  const result = scenarioSchema.safeParse(input);
  if (result.success) {
    return { ok: true, value: result.data as Scenario };
  }
  return { ok: false, error: result.error };
}

export function buildScenarioStepLookup(scenario: Scenario): ScenarioStepLookup {
  const byId = new Map<string, (typeof scenario.steps)[number]>();
  for (const step of scenario.steps) {
    byId.set(step.id, step);
  }
  return { byId, all: scenario.steps };
}

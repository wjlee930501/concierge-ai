import type { Scenario, ScenarioStep } from "@conciergeai/shared";
import type { PageContext } from "./pageContext";
import type { AiSuggestion } from "./llmMock";

export type RunnerPhase =
  | { readonly kind: "idle" }
  | { readonly kind: "hero-visible" }
  | { readonly kind: "step-active"; readonly step: ScenarioStep }
  | { readonly kind: "lead-form" }
  | { readonly kind: "submitted" }
  | { readonly kind: "dismissed" };

export type LeadFormDraft = {
  readonly fields: Readonly<Record<string, string>>;
  readonly consents: Readonly<
    Record<"required" | "marketing" | "expanded", boolean>
  >;
  readonly messagePrefilled: boolean;
};

export type LeadFormSubmission = {
  readonly scenarioId: string;
  readonly fields: Readonly<Record<string, string>>;
  readonly consents: Readonly<
    Record<"required" | "marketing" | "expanded", boolean>
  >;
  readonly submittedAt: number;
  readonly consentVersion: string;
  readonly leadSummary: string;
  readonly pageVariant: PageContext["variant"];
};

export type SessionInteraction = {
  readonly kind: "chip" | "step" | "free-input";
  readonly id: string;
  readonly label: string;
  readonly at: number;
};

export type FreeInputMode = "closed" | "open" | "thinking" | "replying";

export type FreeInputSlice = {
  readonly mode: FreeInputMode;
  readonly draft: string;
  readonly stream: string;
  readonly suggestion: AiSuggestion | null;
  readonly streamSeq: number;
};

export type RunnerState = {
  readonly scenario: Scenario;
  readonly phase: RunnerPhase;
  readonly historyStepIds: readonly string[];
  readonly leadDraft: LeadFormDraft;
  readonly submission: LeadFormSubmission | null;
  readonly reducedMotion: boolean;
  readonly pageContext: PageContext;
  readonly interactions: readonly SessionInteraction[];
  readonly freeInput: FreeInputSlice;
};

export type RunnerEvent =
  | { readonly type: "show-hero" }
  | { readonly type: "select-chip"; readonly chipId: string }
  | { readonly type: "select-choice"; readonly choiceId: string }
  | {
      readonly type: "update-field";
      readonly fieldId: string;
      readonly value: string;
    }
  | {
      readonly type: "toggle-consent";
      readonly consentId: "required" | "marketing" | "expanded";
      readonly value: boolean;
    }
  | { readonly type: "submit-lead" }
  | { readonly type: "back" }
  | { readonly type: "dismiss" }
  | { readonly type: "reopen" }
  | { readonly type: "set-reduced-motion"; readonly value: boolean }
  | { readonly type: "open-free-input" }
  | { readonly type: "close-free-input" }
  | { readonly type: "update-free-input-draft"; readonly value: string }
  | { readonly type: "submit-free-input" }
  | {
      readonly type: "stream-ai-chunk";
      readonly seq: number;
      readonly chunk: string;
    }
  | {
      readonly type: "complete-ai-response";
      readonly seq: number;
      readonly suggestion: AiSuggestion;
    }
  | { readonly type: "dismiss-ai-response" }
  | { readonly type: "reset" };

export const CONSENT_VERSION = "placeholder-v0" as const;

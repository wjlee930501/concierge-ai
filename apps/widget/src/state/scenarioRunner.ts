import type { Scenario, ScenarioStep } from "@conciergeai/shared";
import { detectPageContext, type PageContext } from "./pageContext";
import {
  buildLeadSummary,
  type SessionInteraction as SummaryInteraction
} from "./leadSummary";
import type {
  FreeInputSlice,
  LeadFormDraft,
  RunnerEvent,
  RunnerPhase,
  RunnerState,
  SessionInteraction
} from "./types";
import { CONSENT_VERSION } from "./types";

const FREE_INPUT_INITIAL: FreeInputSlice = Object.freeze({
  mode: "closed" as const,
  draft: "",
  stream: "",
  suggestion: null,
  streamSeq: 0
});

export function createRunnerState(input: {
  readonly scenario: Scenario;
  readonly reducedMotion?: boolean;
  readonly pageContext?: PageContext;
}): RunnerState {
  const pageContext = input.pageContext ?? detectPageContext({ storage: null });
  return Object.freeze({
    scenario: input.scenario,
    phase: { kind: "idle" } as RunnerPhase,
    historyStepIds: Object.freeze([]) as readonly string[],
    leadDraft: createEmptyLeadDraft(input.scenario),
    submission: null,
    reducedMotion: input.reducedMotion === true,
    pageContext,
    interactions: Object.freeze([]) as readonly SessionInteraction[],
    freeInput: FREE_INPUT_INITIAL
  });
}

export function reduceRunner(
  state: RunnerState,
  event: RunnerEvent
): RunnerState {
  switch (event.type) {
    case "show-hero":
      if (state.phase.kind !== "idle") return state;
      return { ...state, phase: { kind: "hero-visible" } };

    case "select-chip": {
      if (
        state.phase.kind !== "hero-visible" &&
        state.phase.kind !== "step-active"
      ) {
        return state;
      }
      const chip = state.scenario.heroBubble.quickChips.find(
        (c) => c.id === event.chipId
      );
      if (chip === undefined) return state;
      const step = stepById(state.scenario, chip.nextStepId);
      if (step === undefined) return state;
      const tracked = trackInteraction(state, {
        kind: "chip",
        id: chip.id,
        label: chip.label,
        at: now()
      });
      return advanceToStep(tracked, step);
    }

    case "select-choice": {
      if (state.phase.kind !== "step-active") return state;
      const currentStep = state.phase.step;
      const choice = currentStep.choices.find((c) => c.id === event.choiceId);
      if (choice === undefined) return state;
      if (choice.nextStepId === null) {
        return enterLeadForm(state);
      }
      const next = stepById(state.scenario, choice.nextStepId);
      if (next === undefined) return state;
      return advanceToStep(state, next);
    }

    case "update-field": {
      if (state.phase.kind !== "lead-form") return state;
      const fields: Record<string, string> = {
        ...state.leadDraft.fields,
        [event.fieldId]: event.value
      };
      return {
        ...state,
        leadDraft: {
          ...state.leadDraft,
          fields
        }
      };
    }

    case "toggle-consent": {
      if (state.phase.kind !== "lead-form") return state;
      const consents = {
        ...state.leadDraft.consents,
        [event.consentId]: event.value
      };
      return {
        ...state,
        leadDraft: { ...state.leadDraft, consents }
      };
    }

    case "submit-lead": {
      if (state.phase.kind !== "lead-form") return state;
      if (!isLeadDraftSubmittable(state)) return state;
      const summary = buildLeadSummary({
        scenario: state.scenario,
        interactions: toSummaryInteractions(state.interactions)
      });
      return {
        ...state,
        phase: { kind: "submitted" },
        submission: {
          scenarioId: state.scenario.id,
          fields: { ...state.leadDraft.fields },
          consents: { ...state.leadDraft.consents },
          submittedAt: now(),
          consentVersion: CONSENT_VERSION,
          leadSummary: summary,
          pageVariant: state.pageContext.variant
        }
      };
    }

    case "dismiss": {
      // 사용자가 안내 없이 페이지만 둘러보고 싶은 경우. hero-visible에서만 허용.
      if (state.phase.kind !== "hero-visible") return state;
      return {
        ...state,
        phase: { kind: "dismissed" },
        freeInput: { ...FREE_INPUT_INITIAL, streamSeq: state.freeInput.streamSeq }
      };
    }

    case "reopen": {
      if (state.phase.kind !== "dismissed") return state;
      return { ...state, phase: { kind: "hero-visible" } };
    }

    case "set-reduced-motion":
      if (state.reducedMotion === event.value) return state;
      return { ...state, reducedMotion: event.value };

    case "back": {
      if (state.phase.kind === "lead-form") {
        const history = state.historyStepIds;
        if (history.length === 0) {
          return { ...state, phase: { kind: "hero-visible" } };
        }
        const newHistory = history.slice(0, -1);
        if (newHistory.length === 0) {
          return {
            ...state,
            phase: { kind: "hero-visible" },
            historyStepIds: Object.freeze([]) as readonly string[]
          };
        }
        const prevId = newHistory[newHistory.length - 1]!;
        const prevStep = state.scenario.steps.find((s) => s.id === prevId);
        if (prevStep === undefined) {
          return {
            ...state,
            phase: { kind: "hero-visible" },
            historyStepIds: Object.freeze([]) as readonly string[]
          };
        }
        return {
          ...state,
          phase: { kind: "step-active", step: prevStep },
          historyStepIds: Object.freeze([...newHistory]) as readonly string[]
        };
      }
      if (state.phase.kind === "step-active") {
        const newHistory = state.historyStepIds.slice(0, -1);
        if (newHistory.length === 0) {
          return {
            ...state,
            phase: { kind: "hero-visible" },
            historyStepIds: Object.freeze([]) as readonly string[]
          };
        }
        const prevId = newHistory[newHistory.length - 1]!;
        const prevStep = state.scenario.steps.find((s) => s.id === prevId);
        if (prevStep === undefined) {
          return {
            ...state,
            phase: { kind: "hero-visible" },
            historyStepIds: Object.freeze([]) as readonly string[]
          };
        }
        return {
          ...state,
          phase: { kind: "step-active", step: prevStep },
          historyStepIds: Object.freeze([...newHistory]) as readonly string[]
        };
      }
      return state;
    }

    case "open-free-input": {
      if (
        state.phase.kind !== "hero-visible" &&
        state.phase.kind !== "step-active"
      ) {
        return state;
      }
      if (
        state.freeInput.mode === "thinking" ||
        state.freeInput.mode === "replying"
      ) {
        return state;
      }
      return {
        ...state,
        freeInput: { ...state.freeInput, mode: "open" }
      };
    }

    case "close-free-input":
      return {
        ...state,
        freeInput: { ...FREE_INPUT_INITIAL, streamSeq: state.freeInput.streamSeq }
      };

    case "update-free-input-draft":
      return {
        ...state,
        freeInput: { ...state.freeInput, draft: event.value }
      };

    case "submit-free-input": {
      if (state.freeInput.draft.trim().length === 0) return state;
      if (state.freeInput.mode === "thinking" || state.freeInput.mode === "replying") {
        return state;
      }
      const tracked = trackInteraction(state, {
        kind: "free-input",
        id: `free_${state.freeInput.streamSeq + 1}`,
        label: state.freeInput.draft.trim(),
        at: now()
      });
      return {
        ...tracked,
        freeInput: {
          mode: "thinking",
          draft: state.freeInput.draft,
          stream: "",
          suggestion: null,
          streamSeq: state.freeInput.streamSeq + 1
        }
      };
    }

    case "stream-ai-chunk":
      if (event.seq !== state.freeInput.streamSeq) return state;
      return {
        ...state,
        freeInput: {
          ...state.freeInput,
          stream: state.freeInput.stream + event.chunk
        }
      };

    case "complete-ai-response":
      if (event.seq !== state.freeInput.streamSeq) return state;
      return {
        ...state,
        freeInput: {
          ...state.freeInput,
          mode: "replying",
          suggestion: event.suggestion
        }
      };

    case "dismiss-ai-response":
      return {
        ...state,
        freeInput: {
          mode: "open",
          draft: "",
          stream: "",
          suggestion: null,
          streamSeq: state.freeInput.streamSeq
        }
      };

    case "reset":
      return createRunnerState({
        scenario: state.scenario,
        reducedMotion: state.reducedMotion,
        pageContext: state.pageContext
      });

    default: {
      const exhaustiveCheck: never = event;
      return exhaustiveCheck;
    }
  }
}

export function isLeadDraftSubmittable(state: RunnerState): boolean {
  if (state.phase.kind !== "lead-form") return false;
  for (const field of state.scenario.leadForm.fields) {
    if (!field.required) continue;
    const value = state.leadDraft.fields[field.id];
    if (value === undefined || value.trim().length === 0) return false;
  }
  for (const consent of state.scenario.leadForm.pipaConsents) {
    if (consent.required && state.leadDraft.consents[consent.id] !== true) {
      return false;
    }
  }
  return true;
}

export function getCurrentSpotlightTarget(state: RunnerState): string | null {
  if (state.phase.kind !== "step-active") return null;
  return state.phase.step.spotlightTarget;
}

function advanceToStep(state: RunnerState, step: ScenarioStep): RunnerState {
  const tracked = trackInteraction(state, {
    kind: "step",
    id: step.id,
    label: step.popover.title,
    at: now()
  });
  if (step.isClosing) {
    return enterLeadForm(tracked, step);
  }
  return {
    ...tracked,
    phase: { kind: "step-active", step },
    historyStepIds: appendUnique(tracked.historyStepIds, step.id)
  };
}

function enterLeadForm(state: RunnerState, step?: ScenarioStep): RunnerState {
  const historyStepIds =
    step !== undefined ? appendUnique(state.historyStepIds, step.id) : state.historyStepIds;
  const draft = state.leadDraft.messagePrefilled
    ? state.leadDraft
    : applyMessagePrefill(state);
  return {
    ...state,
    phase: { kind: "lead-form" },
    historyStepIds,
    leadDraft: draft,
    freeInput: { ...FREE_INPUT_INITIAL, streamSeq: state.freeInput.streamSeq }
  };
}

function applyMessagePrefill(state: RunnerState): LeadFormDraft {
  const messageField = state.scenario.leadForm.fields.find(
    (field) => field.id === "message"
  );
  if (messageField === undefined) {
    return state.leadDraft;
  }
  const summary = buildLeadSummary({
    scenario: state.scenario,
    interactions: toSummaryInteractions(state.interactions)
  });
  const fields: Record<string, string> = {
    ...state.leadDraft.fields,
    message: summary
  };
  return {
    ...state.leadDraft,
    fields,
    messagePrefilled: true
  };
}

function trackInteraction(
  state: RunnerState,
  interaction: SessionInteraction
): RunnerState {
  return {
    ...state,
    interactions: Object.freeze([...state.interactions, interaction]) as readonly SessionInteraction[]
  };
}

function toSummaryInteractions(
  interactions: readonly SessionInteraction[]
): readonly SummaryInteraction[] {
  return interactions.map((entry) => ({
    kind: entry.kind,
    id: entry.id,
    label: entry.label
  }));
}

function appendUnique(
  existing: readonly string[],
  candidate: string
): readonly string[] {
  if (existing.includes(candidate)) return existing;
  return Object.freeze([...existing, candidate]) as readonly string[];
}

function stepById(
  scenario: Scenario,
  id: string
): ScenarioStep | undefined {
  return scenario.steps.find((step) => step.id === id);
}

function createEmptyLeadDraft(scenario: Scenario): LeadFormDraft {
  const fields: Record<string, string> = {};
  for (const field of scenario.leadForm.fields) {
    fields[field.id] = "";
  }
  return {
    fields,
    consents: { required: false, marketing: false, expanded: false },
    messagePrefilled: false
  };
}

function now(): number {
  return Date.now();
}

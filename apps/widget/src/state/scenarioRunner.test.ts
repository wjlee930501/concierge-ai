import { describe, expect, it } from "vitest";
import { parseScenario } from "@conciergeai/shared";
import {
  createRunnerState,
  isLeadDraftSubmittable,
  reduceRunner
} from "./scenarioRunner";

const baseScenario = parseScenario({
  id: "test_v0",
  version: "0.0.1",
  isPlaceholder: true,
  heroBubble: {
    message: "[PLACEHOLDER] hi",
    quickChips: [
      { id: "c1", label: "[PLACEHOLDER] one", nextStepId: "s1" }
    ]
  },
  steps: [
    {
      id: "s1",
      popover: {
        label: "lab",
        title: "[PLACEHOLDER] t",
        body: "[PLACEHOLDER] b"
      },
      spotlightTarget: "#a",
      avatarPoint: "up",
      choices: [
        { id: "next", label: "[PLACEHOLDER] go", nextStepId: "s2" },
        { id: "lead", label: "[PLACEHOLDER] lead", nextStepId: null }
      ],
      isClosing: false
    },
    {
      id: "s2",
      popover: {
        label: "lab",
        title: "[PLACEHOLDER] t2",
        body: "[PLACEHOLDER] b2"
      },
      spotlightTarget: "#b",
      avatarPoint: "left",
      choices: [],
      isClosing: true
    }
  ],
  leadForm: {
    title: "[PLACEHOLDER] f",
    subtitle: "[PLACEHOLDER] s",
    fields: [
      { id: "name", label: "[PLACEHOLDER] name", type: "text", required: true },
      { id: "message", label: "[PLACEHOLDER] message", type: "textarea", required: false }
    ],
    pipaConsents: [
      { id: "required", label: "[PLACEHOLDER] r", required: true },
      { id: "marketing", label: "[PLACEHOLDER] m", required: false },
      { id: "expanded", label: "[PLACEHOLDER] e", required: false }
    ],
    retentionDescription: "[PLACEHOLDER] retention",
    submitLabel: "[PLACEHOLDER] submit",
    thanksMessage: "[PLACEHOLDER] thanks"
  }
});

describe("scenarioRunner", () => {
  it("starts idle and transitions hero on show-hero", () => {
    const state = createRunnerState({ scenario: baseScenario });
    expect(state.phase.kind).toBe("idle");
    const next = reduceRunner(state, { type: "show-hero" });
    expect(next.phase.kind).toBe("hero-visible");
  });

  it("advances to first step on chip click and tracks interaction", () => {
    let state = createRunnerState({ scenario: baseScenario });
    state = reduceRunner(state, { type: "show-hero" });
    state = reduceRunner(state, { type: "select-chip", chipId: "c1" });
    expect(state.phase.kind).toBe("step-active");
    expect(state.interactions.some((i) => i.kind === "chip")).toBe(true);
    expect(state.interactions.some((i) => i.kind === "step")).toBe(true);
  });

  it("advances through closing step into lead form with prefilled message", () => {
    let state = createRunnerState({ scenario: baseScenario });
    state = reduceRunner(state, { type: "show-hero" });
    state = reduceRunner(state, { type: "select-chip", chipId: "c1" });
    state = reduceRunner(state, { type: "select-choice", choiceId: "next" });
    expect(state.phase.kind).toBe("lead-form");
    expect(state.leadDraft.messagePrefilled).toBe(true);
    expect((state.leadDraft.fields.message ?? "").length).toBeGreaterThan(0);
  });

  it("blocks submit when required consent missing", () => {
    let state = createRunnerState({ scenario: baseScenario });
    state = reduceRunner(state, { type: "show-hero" });
    state = reduceRunner(state, { type: "select-chip", chipId: "c1" });
    state = reduceRunner(state, { type: "select-choice", choiceId: "next" });
    state = reduceRunner(state, {
      type: "update-field",
      fieldId: "name",
      value: "테스터"
    });
    expect(isLeadDraftSubmittable(state)).toBe(false);
  });

  it("submits with leadSummary embedded in submission", () => {
    let state = createRunnerState({ scenario: baseScenario });
    state = reduceRunner(state, { type: "show-hero" });
    state = reduceRunner(state, { type: "select-chip", chipId: "c1" });
    state = reduceRunner(state, { type: "select-choice", choiceId: "next" });
    state = reduceRunner(state, {
      type: "update-field",
      fieldId: "name",
      value: "테스터"
    });
    state = reduceRunner(state, {
      type: "toggle-consent",
      consentId: "required",
      value: true
    });
    state = reduceRunner(state, { type: "submit-lead" });
    expect(state.phase.kind).toBe("submitted");
    expect((state.submission?.leadSummary ?? "").length).toBeGreaterThan(0);
    expect(state.submission?.pageVariant).toBe("default");
  });

  it("backs from lead-form to step before closing", () => {
    let state = createRunnerState({ scenario: baseScenario });
    state = reduceRunner(state, { type: "show-hero" });
    state = reduceRunner(state, { type: "select-chip", chipId: "c1" });
    state = reduceRunner(state, { type: "select-choice", choiceId: "next" });
    expect(state.phase.kind).toBe("lead-form");
    state = reduceRunner(state, { type: "back" });
    expect(state.phase.kind).toBe("step-active");
    if (state.phase.kind === "step-active") {
      expect(state.phase.step.id).toBe("s1");
    }
  });

  it("backs from step to hero when only one step in history", () => {
    let state = createRunnerState({ scenario: baseScenario });
    state = reduceRunner(state, { type: "show-hero" });
    state = reduceRunner(state, { type: "select-chip", chipId: "c1" });
    state = reduceRunner(state, { type: "back" });
    expect(state.phase.kind).toBe("hero-visible");
  });

  it("ignores chip click before hero visible", () => {
    const state = createRunnerState({ scenario: baseScenario });
    const next = reduceRunner(state, { type: "select-chip", chipId: "c1" });
    expect(next.phase.kind).toBe("idle");
  });

  it("opens, drafts, submits free input and accumulates stream chunks", () => {
    let state = createRunnerState({ scenario: baseScenario });
    state = reduceRunner(state, { type: "show-hero" });
    state = reduceRunner(state, { type: "open-free-input" });
    expect(state.freeInput.mode).toBe("open");
    state = reduceRunner(state, {
      type: "update-free-input-draft",
      value: "데모 보여 주세요"
    });
    state = reduceRunner(state, { type: "submit-free-input" });
    expect(state.freeInput.mode).toBe("thinking");
    const seq = state.freeInput.streamSeq;
    state = reduceRunner(state, {
      type: "stream-ai-chunk",
      seq,
      chunk: "응"
    });
    state = reduceRunner(state, {
      type: "stream-ai-chunk",
      seq,
      chunk: "답"
    });
    expect(state.freeInput.stream).toBe("응답");
    state = reduceRunner(state, {
      type: "complete-ai-response",
      seq,
      suggestion: { kind: "navigate", chipId: "c1", label: "[PLACEHOLDER] one" }
    });
    expect(state.freeInput.mode).toBe("replying");
    expect(state.freeInput.suggestion?.kind).toBe("navigate");
  });

  it("ignores stale stream chunks from previous submit", () => {
    let state = createRunnerState({ scenario: baseScenario });
    state = reduceRunner(state, { type: "show-hero" });
    state = reduceRunner(state, { type: "open-free-input" });
    state = reduceRunner(state, {
      type: "update-free-input-draft",
      value: "사례"
    });
    state = reduceRunner(state, { type: "submit-free-input" });
    state = reduceRunner(state, {
      type: "stream-ai-chunk",
      seq: 999,
      chunk: "stale"
    });
    expect(state.freeInput.stream).toBe("");
  });

  it("resets to idle on reset and clears interactions", () => {
    let state = createRunnerState({ scenario: baseScenario });
    state = reduceRunner(state, { type: "show-hero" });
    state = reduceRunner(state, { type: "select-chip", chipId: "c1" });
    state = reduceRunner(state, { type: "reset" });
    expect(state.phase.kind).toBe("idle");
    expect(state.interactions).toHaveLength(0);
  });
});

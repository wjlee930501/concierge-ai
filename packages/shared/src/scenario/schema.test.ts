import { describe, expect, it } from "vitest";
import {
  buildScenarioStepLookup,
  parseScenario,
  safeParseScenario
} from "./schema";

const validScenario = {
  id: "placeholder_v0",
  version: "0.0.1",
  isPlaceholder: true,
  heroBubble: {
    message: "[PLACEHOLDER] hi",
    quickChips: [
      { id: "c1", label: "[PLACEHOLDER] one", nextStepId: "s1" },
      { id: "c2", label: "[PLACEHOLDER] two", nextStepId: "s1" }
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
        { id: "x", label: "[PLACEHOLDER] go", nextStepId: "s2" },
        { id: "y", label: "[PLACEHOLDER] stop", nextStepId: null }
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
    title: "[PLACEHOLDER] form",
    subtitle: "[PLACEHOLDER] sub",
    fields: [
      {
        id: "name",
        label: "[PLACEHOLDER] name",
        type: "text",
        required: true
      }
    ],
    pipaConsents: [
      {
        id: "required",
        label: "[PLACEHOLDER] required",
        required: true
      },
      {
        id: "marketing",
        label: "[PLACEHOLDER] marketing",
        required: false
      },
      {
        id: "expanded",
        label: "[PLACEHOLDER] expanded",
        required: false
      }
    ],
    retentionDescription: "[PLACEHOLDER] retention",
    submitLabel: "[PLACEHOLDER] submit",
    thanksMessage: "[PLACEHOLDER] thanks"
  }
};

describe("scenarioSchema", () => {
  it("parses a well-formed placeholder scenario", () => {
    const scenario = parseScenario(validScenario);
    expect(scenario.id).toBe("placeholder_v0");
    expect(scenario.steps).toHaveLength(2);
    expect(scenario.heroBubble.quickChips).toHaveLength(2);
  });

  it("rejects scenario with unknown quick chip target", () => {
    const broken = structuredClone(validScenario);
    broken.heroBubble.quickChips[0]!.nextStepId = "missing";
    const result = safeParseScenario(broken);
    expect(result.ok).toBe(false);
  });

  it("rejects scenario without a closing step", () => {
    const broken = structuredClone(validScenario);
    for (const step of broken.steps) {
      step.isClosing = false;
    }
    const result = safeParseScenario(broken);
    expect(result.ok).toBe(false);
  });

  it("rejects scenario with PIPA consent missing required key", () => {
    const broken = structuredClone(validScenario);
    broken.leadForm.pipaConsents.pop();
    const result = safeParseScenario(broken);
    expect(result.ok).toBe(false);
  });

  it("builds a step lookup map", () => {
    const scenario = parseScenario(validScenario);
    const lookup = buildScenarioStepLookup(scenario);
    expect(lookup.byId.get("s2")?.isClosing).toBe(true);
  });

  it("rejects scenario with duplicate step ids", () => {
    const broken = structuredClone(validScenario);
    broken.steps[1]!.id = "s1";
    const result = safeParseScenario(broken);
    expect(result.ok).toBe(false);
  });

  it("rejects non-closing curation steps with fewer than two choices", () => {
    const broken = structuredClone(validScenario);
    broken.steps[0]!.choices = [
      { id: "x", label: "[PLACEHOLDER] go", nextStepId: "s2" }
    ];
    const result = safeParseScenario(broken);
    expect(result.ok).toBe(false);
  });

  it("rejects non-closing curation steps with more than four choices", () => {
    const broken = structuredClone(validScenario);
    broken.steps[0]!.choices = [
      { id: "a", label: "[PLACEHOLDER] a", nextStepId: "s2" },
      { id: "b", label: "[PLACEHOLDER] b", nextStepId: "s2" },
      { id: "c", label: "[PLACEHOLDER] c", nextStepId: "s2" },
      { id: "d", label: "[PLACEHOLDER] d", nextStepId: "s2" },
      { id: "e", label: "[PLACEHOLDER] e", nextStepId: "s2" }
    ];
    const result = safeParseScenario(broken);
    expect(result.ok).toBe(false);
  });
});

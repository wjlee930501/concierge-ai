// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseScenario, type Scenario } from "@conciergeai/shared";
import { useScenarioRunner } from "./useScenarioRunner";

const scenario: Scenario = parseScenario({
  id: "runner_reduced_motion",
  version: "0.0.1",
  isPlaceholder: true,
  heroBubble: {
    message: "[PLACEHOLDER] hi",
    quickChips: [{ id: "chip", label: "[PLACEHOLDER] chip", nextStepId: "s1" }]
  },
  steps: [
    {
      id: "s1",
      popover: {
        label: "A",
        title: "[PLACEHOLDER] title",
        body: "[PLACEHOLDER] body"
      },
      spotlightTarget: "#a",
      avatarPoint: "up",
      choices: [
        { id: "next", label: "[PLACEHOLDER] next", nextStepId: "s2" },
        { id: "lead", label: "[PLACEHOLDER] lead", nextStepId: null }
      ],
      isClosing: false
    },
    {
      id: "s2",
      popover: {
        label: "B",
        title: "[PLACEHOLDER] end",
        body: "[PLACEHOLDER] done"
      },
      spotlightTarget: "#b",
      avatarPoint: "left",
      choices: [],
      isClosing: true
    }
  ],
  leadForm: {
    title: "[PLACEHOLDER] lead",
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
      { id: "required", label: "[PLACEHOLDER] required", required: true },
      { id: "marketing", label: "[PLACEHOLDER] marketing", required: false },
      { id: "expanded", label: "[PLACEHOLDER] expanded", required: false }
    ],
    retentionDescription: "[PLACEHOLDER] retention",
    submitLabel: "[PLACEHOLDER] submit",
    thanksMessage: "[PLACEHOLDER] thanks"
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("useScenarioRunner reduced motion sync", () => {
  it("starts with reducedMotion=true when the media query already matches", () => {
    mockReducedMotion(true);
    const seen: boolean[] = [];
    function Probe() {
      const { state } = useScenarioRunner(scenario);
      seen.push(state.reducedMotion);
      return null;
    }

    render(<Probe />);

    expect(seen.at(-1)).toBe(true);
  });

  it("updates RunnerState when the media query changes", () => {
    const media = mockReducedMotion(false);
    const seen: boolean[] = [];
    function Probe() {
      const { state } = useScenarioRunner(scenario);
      seen.push(state.reducedMotion);
      return null;
    }
    render(<Probe />);
    expect(seen.at(-1)).toBe(false);

    act(() => {
      media.setMatches(true);
    });

    expect(seen.at(-1)).toBe(true);
  });
});

function mockReducedMotion(initial: boolean): {
  readonly setMatches: (next: boolean) => void;
} {
  let matches = initial;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: (
      _type: "change",
      listener: (event: MediaQueryListEvent) => void
    ) => {
      listeners.add(listener);
    },
    removeEventListener: (
      _type: "change",
      listener: (event: MediaQueryListEvent) => void
    ) => {
      listeners.delete(listener);
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatchEvent: () => true
  }));

  return {
    setMatches(next: boolean) {
      matches = next;
      for (const listener of listeners) {
        listener({ matches } as MediaQueryListEvent);
      }
    }
  };
}

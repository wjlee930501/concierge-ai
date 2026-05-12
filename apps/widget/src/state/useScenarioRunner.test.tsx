// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseScenario, type Scenario } from "@conciergeai/shared";
import { useScenarioRunner } from "./useScenarioRunner";
import type { RunnerEvent, RunnerState } from "./types";

// Hoisted mock controller so vi.mock factory (which is hoisted itself) can
// reference it before the test body runs.
const llmMockState = vi.hoisted(() => ({
  mode: "default" as "default" | "throw" | "abort-then-noop",
  lastSignal: null as AbortSignal | null
}));

vi.mock("./llmMock", () => ({
  streamMockAiResponse: async (input: {
    readonly signal?: AbortSignal;
    readonly onEvent: (event: {
      readonly type: "chunk" | "done";
      readonly text?: string;
      readonly fullText?: string;
      readonly suggestion?: unknown;
      readonly aborted?: boolean;
    }) => void;
  }) => {
    llmMockState.lastSignal = input.signal ?? null;
    if (llmMockState.mode === "throw") {
      throw new Error("mock stream crashed");
    }
    if (llmMockState.mode === "abort-then-noop") {
      // Simulate: caller aborts before we ever fire `done`. The effect-cleanup
      // path is responsible for settling the slot, not us.
      return;
    }
    input.onEvent({ type: "chunk", text: "hi" });
    input.onEvent({
      type: "done",
      fullText: "hi",
      suggestion: { kind: "safety", reason: "out_of_scope" }
    });
  }
}));

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
  vi.unstubAllGlobals();
  llmMockState.mode = "default";
  llmMockState.lastSignal = null;
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

  it("dispatches a kb_unavailable safety_response when streamMockAiResponse throws", async () => {
    mockReducedMotion(true);
    llmMockState.mode = "throw";
    const seen: RunnerState[] = [];
    let captured: ((event: RunnerEvent) => void) | null = null;
    function Probe() {
      const { state, dispatch } = useScenarioRunner(scenario);
      captured = dispatch;
      seen.push(state);
      return null;
    }
    render(<Probe />);

    await act(async () => {
      captured!({ type: "show-hero" });
    });
    await act(async () => {
      captured!({ type: "open-free-input" });
    });
    await act(async () => {
      captured!({ type: "update-free-input-draft", value: "hello" });
    });
    await act(async () => {
      captured!({ type: "submit-free-input" });
    });
    // Let the rejected promise settle.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const latest = seen.at(-1)!;
    expect(latest.freeInput.mode).toBe("replying");
    expect(latest.freeInput.suggestion?.kind).toBe("safety");
    if (latest.freeInput.suggestion?.kind === "safety") {
      expect(latest.freeInput.suggestion.reason).toBe("kb_unavailable");
    }
  });

  it("recovers ghost thinking state to closed when the effect cleans up before done", async () => {
    mockReducedMotion(true);
    llmMockState.mode = "abort-then-noop";
    const seen: RunnerState[] = [];
    let captured: ((event: RunnerEvent) => void) | null = null;
    function Probe() {
      const { state, dispatch } = useScenarioRunner(scenario);
      captured = dispatch;
      seen.push(state);
      return null;
    }
    const { unmount } = render(<Probe />);

    await act(async () => {
      captured!({ type: "show-hero" });
    });
    await act(async () => {
      captured!({ type: "open-free-input" });
    });
    await act(async () => {
      captured!({ type: "update-free-input-draft", value: "hi" });
    });
    await act(async () => {
      captured!({ type: "submit-free-input" });
    });
    // Trigger the abort-cleanup path while the mock is still pending.
    await act(async () => {
      captured!({ type: "close-free-input" });
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const latest = seen.at(-1)!;
    // closed (cleaned up). The critical invariant is that we never stay
    // stuck in `thinking` (ghost loading).
    expect(latest.freeInput.mode).not.toBe("thinking");

    // The abort signal must have been forwarded to the mock stream so a real
    // provider would cancel its in-flight request.
    expect(llmMockState.lastSignal?.aborted).toBe(true);

    unmount();
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

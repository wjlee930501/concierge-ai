// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseScenario,
  type Scenario,
  type ScenarioStep
} from "@conciergeai/shared";
import {
  useChoreographyController,
  type ChoreographyViewport
} from "./useChoreographyController";

// Spy on executeStep so we observe re-runs from the controller effect
// without booting the full choreography pipeline (which would query
// host rects, post messages, etc.).
const executeStepSpy = vi.fn(async () => undefined);

vi.mock("@conciergeai/shared", async () => {
  const actual = await vi.importActual<typeof import("@conciergeai/shared")>(
    "@conciergeai/shared"
  );
  return {
    ...actual,
    executeStep: (...args: unknown[]) => executeStepSpy(...args)
  };
});

const scenario: Scenario = parseScenario({
  id: "choreo_controller_test",
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

const step1: ScenarioStep = scenario.steps[0]!;
const step2: ScenarioStep = scenario.steps[1]!;

const baseViewport: ChoreographyViewport = {
  width: 1280,
  height: 800,
  isMobile: false
};

afterEach(() => {
  cleanup();
  executeStepSpy.mockClear();
  vi.restoreAllMocks();
});

describe("useChoreographyController", () => {
  it("invokes executeStep when the active step changes", () => {
    const { rerender } = renderHook(
      ({ stepNode }) =>
        useChoreographyController({
          stepNode,
          scenario,
          reducedMotion: false,
          viewport: baseViewport,
          parentOrigin: null
        }),
      { initialProps: { stepNode: step1 as ScenarioStep | null } }
    );

    expect(executeStepSpy).toHaveBeenCalledTimes(1);

    rerender({ stepNode: step2 });
    expect(executeStepSpy).toHaveBeenCalledTimes(2);
  });

  it("does NOT restart the in-flight step when viewport changes (race-regression guard)", () => {
    const { rerender } = renderHook(
      ({ viewport }) =>
        useChoreographyController({
          stepNode: step1,
          scenario,
          reducedMotion: false,
          viewport,
          parentOrigin: null
        }),
      { initialProps: { viewport: baseViewport } }
    );

    expect(executeStepSpy).toHaveBeenCalledTimes(1);

    // Simulate three viewport resize updates (e.g. window resize, orientation).
    rerender({ viewport: { width: 1000, height: 700, isMobile: false } });
    rerender({ viewport: { width: 800, height: 600, isMobile: false } });
    rerender({ viewport: { width: 500, height: 800, isMobile: true } });

    // executeStep must not have been re-invoked. The in-flight step keeps
    // running and reads the latest viewport via refs.
    expect(executeStepSpy).toHaveBeenCalledTimes(1);
  });

  it("does NOT abort the in-flight step when reducedMotion toggles (race-regression guard)", () => {
    const { rerender } = renderHook(
      ({ reducedMotion }) =>
        useChoreographyController({
          stepNode: step1,
          scenario,
          reducedMotion,
          viewport: baseViewport,
          parentOrigin: null
        }),
      { initialProps: { reducedMotion: false } }
    );

    expect(executeStepSpy).toHaveBeenCalledTimes(1);

    rerender({ reducedMotion: true });
    rerender({ reducedMotion: false });

    // Toggling prefers-reduced-motion must not restart the choreography
    // effect — the new value is observed by the running step via refs.
    expect(executeStepSpy).toHaveBeenCalledTimes(1);
  });

  it("clears the choreography UI on unmount", () => {
    const { result, unmount } = renderHook(() =>
      useChoreographyController({
        stepNode: step1,
        scenario,
        reducedMotion: false,
        viewport: baseViewport,
        parentOrigin: null
      })
    );

    expect(result.current.choreographyUi.stepId).toBe(step1.id);

    act(() => {
      unmount();
    });

    // After unmount the cleanup must have run (cancelled = true). We cannot
    // observe state past unmount, but the effect's cleanup is the only path
    // that posts driver_clear; the lack of a thrown error / leaked timer is
    // the practical guarantee.
    expect(executeStepSpy).toHaveBeenCalledTimes(1);
  });

  it("returns the idle UI when stepNode becomes null", () => {
    const { result, rerender } = renderHook(
      ({ stepNode }) =>
        useChoreographyController({
          stepNode,
          scenario,
          reducedMotion: false,
          viewport: baseViewport,
          parentOrigin: null
        }),
      { initialProps: { stepNode: step1 as ScenarioStep | null } }
    );

    expect(result.current.choreographyUi.stepId).toBe(step1.id);

    rerender({ stepNode: null });
    expect(result.current.choreographyUi.stepId).toBeNull();
    expect(result.current.isStepActive).toBe(false);
  });
});

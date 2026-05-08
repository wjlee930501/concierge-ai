import { describe, expect, it } from "vitest";
import {
  createChoreographerState,
  reduceChoreographer
} from "./choreographer";

describe("choreographer state machine race cases", () => {
  it("ignores duplicate clicks for the same active target", () => {
    const initialState = createChoreographerState();
    const movingState = reduceChoreographer(initialState, {
      type: "CLICK_STEP",
      stepId: "step-a",
      anchorId: "anchor-a"
    });

    const duplicateState = reduceChoreographer(movingState, {
      type: "CLICK_STEP",
      stepId: "step-a",
      anchorId: "anchor-a"
    });

    expect(duplicateState).toBe(movingState);
    expect(duplicateState.transitionId).toBe(1);
  });

  it("freezes future updates after unmount", () => {
    const movingState = reduceChoreographer(createChoreographerState(), {
      type: "CLICK_STEP",
      stepId: "step-a",
      anchorId: "anchor-a"
    });
    const unmountedState = reduceChoreographer(movingState, {
      type: "UNMOUNT"
    });

    expect(
      reduceChoreographer(unmountedState, {
        type: "TRANSITION_DONE",
        transitionId: movingState.transitionId
      })
    ).toBe(unmountedState);
    expect(
      reduceChoreographer(unmountedState, {
        type: "CLICK_STEP",
        stepId: "step-b",
        anchorId: "anchor-b"
      })
    ).toBe(unmountedState);
  });

  it("invalidates an in-flight transition on resize", () => {
    const movingState = reduceChoreographer(createChoreographerState(), {
      type: "CLICK_STEP",
      stepId: "step-a",
      anchorId: "anchor-a"
    });
    const oldTransitionId = movingState.transitionId;
    const resizedState = reduceChoreographer(movingState, {
      type: "RESIZE",
      viewport: { width: 375, height: 667 }
    });

    expect(resizedState.layoutVersion).toBe(1);
    expect(resizedState.transitionId).toBe(oldTransitionId + 1);

    const staleDoneState = reduceChoreographer(resizedState, {
      type: "TRANSITION_DONE",
      transitionId: oldTransitionId
    });

    expect(staleDoneState.phase).toBe("transitioning");

    const freshDoneState = reduceChoreographer(staleDoneState, {
      type: "TRANSITION_DONE",
      transitionId: resizedState.transitionId
    });

    expect(freshDoneState.phase).toBe("settled");
  });

  it("jumps to settled state when reduced motion is toggled during movement", () => {
    const movingState = reduceChoreographer(createChoreographerState(), {
      type: "CLICK_STEP",
      stepId: "step-a",
      anchorId: "anchor-a"
    });
    const toggledState = reduceChoreographer(movingState, {
      type: "REDUCED_MOTION_CHANGED",
      reducedMotion: true
    });

    expect(toggledState.reducedMotion).toBe(true);
    expect(toggledState.phase).toBe("settled");
    expect(toggledState.transitionId).toBe(movingState.transitionId + 1);
  });

  it("ignores stale async responses after a newer request starts", () => {
    const firstPendingState = reduceChoreographer(createChoreographerState(), {
      type: "ASYNC_STARTED"
    });
    const firstRequestId = firstPendingState.latestAsyncRequestId;
    const secondPendingState = reduceChoreographer(firstPendingState, {
      type: "ASYNC_STARTED"
    });
    const secondRequestId = secondPendingState.latestAsyncRequestId;

    const staleResponseState = reduceChoreographer(secondPendingState, {
      type: "ASYNC_RESOLVED",
      requestId: firstRequestId,
      stepId: "stale-step",
      anchorId: "stale-anchor"
    });

    expect(staleResponseState).toBe(secondPendingState);
    expect(staleResponseState.pendingAsyncRequestId).toBe(secondRequestId);

    const freshResponseState = reduceChoreographer(staleResponseState, {
      type: "ASYNC_RESOLVED",
      requestId: secondRequestId,
      stepId: "fresh-step",
      anchorId: "fresh-anchor"
    });

    expect(freshResponseState.activeStepId).toBe("fresh-step");
    expect(freshResponseState.targetAnchorId).toBe("fresh-anchor");
  });
});

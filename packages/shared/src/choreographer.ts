export type ChoreographerPhase =
  | "idle"
  | "transitioning"
  | "settled"
  | "unmounted";

export type ChoreographerViewport = {
  readonly width: number;
  readonly height: number;
};

export type ChoreographerState = {
  readonly phase: ChoreographerPhase;
  readonly activeStepId: string | null;
  readonly targetAnchorId: string | null;
  readonly viewport: ChoreographerViewport;
  readonly reducedMotion: boolean;
  readonly transitionId: number;
  readonly layoutVersion: number;
  readonly latestAsyncRequestId: number;
  readonly pendingAsyncRequestId: number | null;
};

export type ChoreographerEvent =
  | {
      readonly type: "CLICK_STEP";
      readonly stepId: string;
      readonly anchorId: string;
    }
  | {
      readonly type: "TRANSITION_DONE";
      readonly transitionId: number;
    }
  | {
      readonly type: "UNMOUNT";
    }
  | {
      readonly type: "RESIZE";
      readonly viewport: ChoreographerViewport;
    }
  | {
      readonly type: "REDUCED_MOTION_CHANGED";
      readonly reducedMotion: boolean;
    }
  | {
      readonly type: "ASYNC_STARTED";
    }
  | {
      readonly type: "ASYNC_RESOLVED";
      readonly requestId: number;
      readonly stepId: string;
      readonly anchorId: string;
    };

const DEFAULT_VIEWPORT: ChoreographerViewport = {
  width: 1280,
  height: 800
};

export function createChoreographerState(input: {
  readonly viewport?: ChoreographerViewport;
  readonly reducedMotion?: boolean;
} = {}): ChoreographerState {
  return {
    phase: "idle",
    activeStepId: null,
    targetAnchorId: null,
    viewport: input.viewport ?? DEFAULT_VIEWPORT,
    reducedMotion: input.reducedMotion ?? false,
    transitionId: 0,
    layoutVersion: 0,
    latestAsyncRequestId: 0,
    pendingAsyncRequestId: null
  };
}

export function reduceChoreographer(
  state: ChoreographerState,
  event: ChoreographerEvent
): ChoreographerState {
  if (state.phase === "unmounted") {
    return state;
  }

  switch (event.type) {
    case "CLICK_STEP":
      return moveToStep(state, event.stepId, event.anchorId);

    case "TRANSITION_DONE":
      if (
        state.phase !== "transitioning" ||
        event.transitionId !== state.transitionId
      ) {
        return state;
      }

      return {
        ...state,
        phase: "settled"
      };

    case "UNMOUNT":
      return {
        ...state,
        phase: "unmounted",
        pendingAsyncRequestId: null
      };

    case "RESIZE":
      if (
        state.viewport.width === event.viewport.width &&
        state.viewport.height === event.viewport.height
      ) {
        return state;
      }

      return {
        ...state,
        viewport: event.viewport,
        layoutVersion: state.layoutVersion + 1,
        transitionId:
          state.phase === "transitioning"
            ? state.transitionId + 1
            : state.transitionId
      };

    case "REDUCED_MOTION_CHANGED":
      if (state.reducedMotion === event.reducedMotion) {
        return state;
      }

      return {
        ...state,
        reducedMotion: event.reducedMotion,
        phase:
          event.reducedMotion && state.phase === "transitioning"
            ? "settled"
            : state.phase,
        transitionId:
          state.phase === "transitioning"
            ? state.transitionId + 1
            : state.transitionId
      };

    case "ASYNC_STARTED": {
      const requestId = state.latestAsyncRequestId + 1;

      return {
        ...state,
        latestAsyncRequestId: requestId,
        pendingAsyncRequestId: requestId
      };
    }

    case "ASYNC_RESOLVED":
      if (event.requestId !== state.pendingAsyncRequestId) {
        return state;
      }

      return moveToStep(
        {
          ...state,
          pendingAsyncRequestId: null
        },
        event.stepId,
        event.anchorId
      );
  }
}

function moveToStep(
  state: ChoreographerState,
  stepId: string,
  anchorId: string
): ChoreographerState {
  if (
    state.activeStepId === stepId &&
    state.targetAnchorId === anchorId &&
    (state.phase === "transitioning" || state.phase === "settled")
  ) {
    return state;
  }

  const transitionId = state.transitionId + 1;

  return {
    ...state,
    phase: state.reducedMotion ? "settled" : "transitioning",
    activeStepId: stepId,
    targetAnchorId: anchorId,
    transitionId
  };
}

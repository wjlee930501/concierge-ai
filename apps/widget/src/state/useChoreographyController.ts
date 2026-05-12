import { useEffect, useRef, useState } from "react";
import {
  executeStep,
  type AnchorName,
  type AvatarExpressionName,
  type AvatarStateName,
  type ExecuteStepHooks,
  type Scenario,
  type ScenarioStep
} from "@conciergeai/shared";
import {
  createHostDriverBridge,
  scenarioStepToChoreographyStep
} from "./choreographyBridge";

export type ChoreographyUiState = {
  readonly stepId: string | null;
  readonly avatarState: AvatarStateName;
  readonly anchor: AnchorName;
  readonly tilt: number;
  readonly expressionOverride: AvatarExpressionName | null;
  readonly bubbleMessage: string | null;
  readonly bubbleVisible: boolean;
  readonly choicesVisible: boolean;
};

export type ChoreographyViewport = {
  readonly width: number;
  readonly height: number;
  readonly isMobile: boolean;
};

export type UseChoreographyControllerInput = {
  readonly stepNode: ScenarioStep | null;
  readonly scenario: Scenario;
  readonly reducedMotion: boolean;
  readonly viewport: ChoreographyViewport;
  readonly parentOrigin: string | null;
};

export type UseChoreographyControllerOutput = {
  readonly choreographyUi: ChoreographyUiState;
  readonly isStepActive: boolean;
};

export const INITIAL_CHOREOGRAPHY_UI: ChoreographyUiState = Object.freeze({
  stepId: null,
  avatarState: "idle",
  anchor: "hero_center",
  tilt: 0,
  expressionOverride: null,
  bubbleMessage: null,
  bubbleVisible: true,
  choicesVisible: false
});

/**
 * Drives the in-flight choreography for the active scenario step.
 *
 * Design notes (race-condition guards):
 *  - The effect re-runs only when `stepNode?.id` changes (or the parent origin
 *    transitions null⇄string). Viewport resize and `reducedMotion` toggles do
 *    NOT restart an in-flight step — those values are read through refs that
 *    the executing step observes lazily.
 *  - `cancelled` is flipped synchronously in cleanup, so any pending
 *    `postToHost` / `setAvatarState` callbacks short-circuit before they touch
 *    React state or send a stale `driver_highlight`.
 */
export function useChoreographyController(
  input: UseChoreographyControllerInput
): UseChoreographyControllerOutput {
  const [choreographyUi, setChoreographyUi] = useState<ChoreographyUiState>(
    INITIAL_CHOREOGRAPHY_UI
  );
  const currentAnchorRef = useRef<AnchorName>("hero_center");
  const runIdRef = useRef(0);

  const viewportRef = useLatestRef(input.viewport);
  const reducedMotionRef = useLatestRef(input.reducedMotion);
  const parentOriginRef = useLatestRef(input.parentOrigin);
  const scenarioRef = useLatestRef(input.scenario);
  const stepNodeRef = useLatestRef(input.stepNode);

  const stepKey = input.stepNode?.id ?? null;
  // Only null⇄string transitions trigger a fresh effect; string⇄string changes
  // (e.g. user navigates between hosts) are accepted as a one-time restart.
  const parentOriginPresence = input.parentOrigin === null ? "absent" : "present";

  useEffect(() => {
    const stepNode = stepNodeRef.current;
    if (stepNode === null || stepNode.id !== stepKey) {
      setChoreographyUi((prev) => ({
        ...prev,
        stepId: null,
        avatarState: "idle",
        tilt: 0,
        expressionOverride: null,
        bubbleMessage: null,
        bubbleVisible: true,
        choicesVisible: false
      }));
      return undefined;
    }

    let cancelled = false;
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const isActive = () => !cancelled && runIdRef.current === runId;
    const targetOrigin = parentOriginRef.current;
    let bridge: ReturnType<typeof createHostDriverBridge> | undefined;
    const enterFallback = (fallback?: string) => {
      if (!isActive()) return;
      cancelled = true;
      bridge?.postToHost({
        type: "concierge:driver_clear",
        payload: {}
      });
      setChoreographyUi((prev) => ({
        ...prev,
        avatarState: "talking",
        bubbleMessage:
          fallback ?? "안내 위치를 찾지 못했어요. 이어서 도와드릴게요.",
        bubbleVisible: true,
        choicesVisible: false
      }));
    };

    if (
      targetOrigin !== null &&
      typeof window !== "undefined" &&
      window.parent !== window
    ) {
      bridge = createHostDriverBridge({
        targetWindow: window.parent,
        listenWindow: window,
        sourceWindow: window.parent,
        targetOrigin,
        allowedOrigins: [targetOrigin],
        onSectionNotFound: (payload) => {
          if (payload.selector === stepNode.spotlightTarget) {
            enterFallback();
          }
        }
      });
    }

    setChoreographyUi((prev) => ({
      ...prev,
      stepId: stepNode.id,
      avatarState: "talking",
      tilt: 0,
      expressionOverride: null,
      bubbleMessage: stepNode.popover.title,
      bubbleVisible: true,
      choicesVisible: false
    }));

    void executeStep(
      scenarioStepToChoreographyStep(stepNode, scenarioRef.current),
      {
        viewport: viewportRef.current,
        currentAnchor: currentAnchorRef.current,
        reducedMotion: reducedMotionRef.current,
        hooks: buildExecuteStepHooks({
          isActive,
          bridge,
          setChoreographyUi,
          currentAnchorRef,
          enterFallback
        })
      }
    );

    return () => {
      cancelled = true;
      bridge?.postToHost({
        type: "concierge:driver_clear",
        payload: {}
      });
      bridge?.detach();
    };
    // Effect intentionally narrows to step identity + parent-origin presence.
    // viewport / reducedMotion / scenario / parentOrigin string are read via
    // refs so in-flight steps do not restart on those changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey, parentOriginPresence]);

  return {
    choreographyUi,
    isStepActive: stepKey !== null && choreographyUi.stepId === stepKey
  };
}

function buildExecuteStepHooks(input: {
  readonly isActive: () => boolean;
  readonly bridge: ReturnType<typeof createHostDriverBridge> | undefined;
  readonly setChoreographyUi: React.Dispatch<
    React.SetStateAction<ChoreographyUiState>
  >;
  readonly currentAnchorRef: React.MutableRefObject<AnchorName>;
  readonly enterFallback: (fallback?: string) => void;
}): ExecuteStepHooks {
  const { isActive, bridge, setChoreographyUi, currentAnchorRef, enterFallback } =
    input;
  return {
    setAvatarState: (next) => {
      if (!isActive()) return;
      setChoreographyUi((prev) => ({ ...prev, avatarState: next }));
    },
    setBubbleMessage: (msg) => {
      if (!isActive()) return;
      setChoreographyUi((prev) => ({ ...prev, bubbleMessage: msg }));
    },
    setBubbleVisible: (visible) => {
      if (!isActive()) return;
      setChoreographyUi((prev) => ({ ...prev, bubbleVisible: visible }));
    },
    setCurrentAnchor: (next) => {
      if (!isActive()) return;
      currentAnchorRef.current = next;
      setChoreographyUi((prev) => ({ ...prev, anchor: next }));
    },
    setTilt: (deg) => {
      if (!isActive()) return;
      setChoreographyUi((prev) => ({ ...prev, tilt: deg }));
    },
    setAvatarExpression: (expression) => {
      if (!isActive()) return;
      setChoreographyUi((prev) => ({
        ...prev,
        expressionOverride: expression
      }));
    },
    setChoices: () => {
      if (!isActive()) return;
      setChoreographyUi((prev) => ({ ...prev, choicesVisible: true }));
    },
    postToHost: (payload) => {
      if (!isActive()) return;
      if (bridge !== undefined) {
        bridge.postToHost(payload);
        return;
      }
      // Standalone / internal mode (no host driver attached): the parent
      // page is the widget's own document, so translate the `scroll_to`
      // signal into a local scrollIntoView. Other host-control payloads
      // (highlight / clear / rect_query) have no meaning without a host
      // driver and are silently dropped — Spotlight's internal mode
      // paints the ring directly from the widget's own DOM.
      if (payload.type === "concierge:scroll_to") {
        performLocalScroll(payload.payload);
      }
    },
    queryHostRect: async (selector) => {
      if (!isActive()) return null;
      if (bridge !== undefined) {
        return bridge.queryHostRect(selector);
      }
      const node = document.querySelector<HTMLElement>(selector);
      if (node === null) {
        return null;
      }
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      };
    },
    enterConversationMode: (fallback) => {
      enterFallback(fallback);
    }
  };
}

function useLatestRef<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef<T>(value);
  ref.current = value;
  return ref;
}

/**
 * Internal-mode self-scroll. In standalone preview (or any iframe load
 * without a host driver) the widget IS the top-level document, so the
 * choreographer's `scroll_to` postMessage is a no-op. To still bring the
 * target into view we resolve the selector locally and use the native
 * scrollIntoView with the same `behavior` / `block` contract the host
 * driver honors. Failure (missing selector, no DOM, throw) is silent —
 * Spotlight's internal mode still attempts to render dim-only fallback.
 */
function performLocalScroll(payload: {
  readonly selector: string;
  readonly behavior: "smooth" | "instant";
  readonly block: "start" | "center" | "end";
}): void {
  if (typeof document === "undefined") return;
  try {
    const node = document.querySelector<HTMLElement>(payload.selector);
    if (node === null) return;
    node.scrollIntoView({
      behavior: payload.behavior === "instant" ? "auto" : "smooth",
      block: payload.block,
      inline: "nearest"
    });
  } catch {
    // scrollIntoView with options is unsupported in some jsdom builds;
    // swallow and let Spotlight's IntersectionObserver guarantee kick in.
  }
}

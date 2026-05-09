import { useEffect, useMemo, useRef, useState, type JSX } from "react";
import {
  anchorToPoint,
  executeStep,
  isOriginAllowed,
  type AnchorName,
  type AnchorPoint,
  type AvatarExpressionName,
  type AvatarStateName
} from "@conciergeai/shared";
import { HeroBubble } from "./components/HeroBubble";
import type { AvatarExpression } from "./components/Avatar";
import { LeadFormCard } from "./components/LeadFormCard";
import { MinimizedPill } from "./components/MinimizedPill";
import { Spotlight } from "./components/Spotlight";
import { SubmittedCard } from "./components/SubmittedCard";
import type { ChipChoice } from "./components/QuickChips";
import { HostPagePreview } from "./preview/HostPagePreview";
import { loadPlaceholderScenario } from "./preview/load-placeholder-scenario";
import { isLeadDraftSubmittable } from "./state/scenarioRunner";
import { useScenarioRunner } from "./state/useScenarioRunner";
import { useIframeHitbox } from "./state/useIframeHitbox";
import { buildVariantGreetingSuffix } from "./state/pageContext";
import { readConciergeRuntimeConfig } from "./config/runtime";
import {
  createHostDriverBridge,
  scenarioStepToChoreographyStep
} from "./state/choreographyBridge";

type ChoiceContext =
  | { readonly kind: "hero"; readonly chipId: string }
  | { readonly kind: "step"; readonly choiceId: string };

type ChoreographyUiState = {
  readonly stepId: string | null;
  readonly avatarState: AvatarStateName;
  readonly anchor: AnchorName;
  readonly tilt: number;
  readonly expressionOverride: AvatarExpressionName | null;
  readonly bubbleMessage: string | null;
  readonly bubbleVisible: boolean;
  readonly choicesVisible: boolean;
};

declare global {
  interface Window {
    __CONCIERGE_MOCK_SUBMIT_SHOULD_FAIL__?: boolean;
    __CONCIERGE_LAST_MOCK_LEAD__?: unknown;
  }
}

const INITIAL_CHOREOGRAPHY_UI: ChoreographyUiState = Object.freeze({
  stepId: null,
  avatarState: "idle",
  anchor: "hero_center",
  tilt: 0,
  expressionOverride: null,
  bubbleMessage: null,
  bubbleVisible: true,
  choicesVisible: false
});

export function App(): JSX.Element {
  const scenario = useMemo(() => loadPlaceholderScenario(), []);
  const { state, dispatch } = useScenarioRunner(scenario);
  const viewport = useViewport();
  const renderHostPreview = shouldRenderHostPreview();
  const runtimeConfig = useMemo(() => readConciergeRuntimeConfig(), []);
  const parentOrigin = useMemo(
    () => resolveParentOrigin(runtimeConfig.allowedOrigins),
    [runtimeConfig.allowedOrigins]
  );
  const [choreographyUi, setChoreographyUi] = useState<ChoreographyUiState>(
    INITIAL_CHOREOGRAPHY_UI
  );
  const currentAnchorRef = useRef<AnchorName>("hero_center");
  const runIdRef = useRef(0);

  const phase = state.phase;
  const isHero = phase.kind === "hero-visible";
  const isStep = phase.kind === "step-active";
  const isLeadForm = phase.kind === "lead-form";
  const isSubmitted = phase.kind === "submitted";
  const isDismissed = phase.kind === "dismissed";
  const showHero = isHero || isStep;

  const stepNode = isStep ? phase.step : null;
  const heroPoint = stepNode?.avatarPoint ?? "up";
  const isCurrentStepChoreography =
    stepNode !== null && choreographyUi.stepId === stepNode.id;
  const avatarMood = resolveAvatarMood({
    freeInputMode: state.freeInput.mode,
    avatarState: choreographyUi.avatarState,
    isStep
  });
  const avatarExpression = resolveAvatarExpression({
    freeInputMode: state.freeInput.mode,
    avatarState: choreographyUi.avatarState,
    expressionOverride: choreographyUi.expressionOverride,
    isStep,
    isSubmitted,
    isDismissed
  });
  const anchorPoint = anchorToPoint(choreographyUi.anchor, viewport);
  const safeAnchorPoint = clampBubbleAnchorPoint(anchorPoint, viewport);

  const variantSuffix = buildVariantGreetingSuffix(state.pageContext);
  const canSubmit = isLeadDraftSubmittable(state);

  useEffect(() => {
    const payload = state.submission?.payload;
    if (payload === undefined) return;
    window.__CONCIERGE_LAST_MOCK_LEAD__ = payload;
    console.info("[concierge-ai] mock lead submit", payload);
  }, [state.submission?.payload]);

  const usedChipIds = useMemo(() => {
    const ids = new Set<string>();
    for (const interaction of state.interactions) {
      if (interaction.kind === "chip") ids.add(interaction.id);
    }
    return ids;
  }, [state.interactions]);

  const summaryHint = state.leadDraft.messagePrefilled
    ? "방금까지의 안내 흐름을 메시지에 자동으로 정리했어요. 자유롭게 수정하셔도 됩니다."
    : undefined;

  // Build unified content & choices for HeroBubble depending on phase.
  const message =
    stepNode !== null
      ? isCurrentStepChoreography
        ? choreographyUi.bubbleMessage ?? stepNode.popover.body
        : stepNode.popover.title
      : scenario.heroBubble.message;
  const section =
    stepNode !== null
      ? { label: stepNode.popover.label, title: stepNode.popover.title }
      : null;

  const choiceContexts: {
    readonly choice: ChipChoice;
    readonly context: ChoiceContext;
  }[] =
    stepNode !== null
      ? isCurrentStepChoreography && choreographyUi.choicesVisible
        ? stepNode.choices.map((choice) => ({
            choice: { id: choice.id, label: choice.label },
            context: { kind: "step", choiceId: choice.id }
          }))
        : []
      : scenario.heroBubble.quickChips
          .filter((chip) => !usedChipIds.has(chip.id))
          .map((chip) => ({
            choice: { id: chip.id, label: chip.label },
            context: { kind: "hero", chipId: chip.id }
          }));

  const choices = choiceContexts.map((entry) => entry.choice);
  const choiceContextById = new Map(
    choiceContexts.map((entry) => [entry.choice.id, entry.context])
  );
  const hitboxSignal = `${state.phase.kind}:${choreographyUi.anchor}:${choreographyUi.bubbleVisible}:${choices.map((choice) => choice.id).join(",")}:${message}:${state.submitError ?? ""}`;

  useIframeHitbox({
    enabled: parentOrigin !== null,
    targetOrigin: parentOrigin,
    signal: hitboxSignal
  });

  useEffect(() => {
    if (stepNode === null) {
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
    const targetOrigin = parentOrigin;
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
        targetOrigin: "*",
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

    void executeStep(scenarioStepToChoreographyStep(stepNode, scenario), {
      viewport,
      currentAnchor: currentAnchorRef.current,
      reducedMotion: state.reducedMotion,
      hooks: {
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
          if (isActive()) bridge?.postToHost(payload);
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
      }
    });

    return () => {
      cancelled = true;
      bridge?.postToHost({
        type: "concierge:driver_clear",
        payload: {}
      });
      bridge?.detach();
    };
  }, [parentOrigin, scenario, state.reducedMotion, stepNode, viewport]);

  return (
    <div className="relative">
      {renderHostPreview ? <HostPagePreview /> : null}

      <Spotlight
        target={isStep ? stepNode!.spotlightTarget : null}
        active={isStep}
      />

      <HeroBubble
        visible={showHero}
        avatarPoint={heroPoint}
        avatarMood={avatarMood}
        avatarExpression={avatarExpression}
        anchorPosition={safeAnchorPoint}
        currentAnchor={choreographyUi.anchor}
        avatarTilt={choreographyUi.tilt}
        bubbleVisible={stepNode === null || choreographyUi.bubbleVisible}
        isPlaceholderScenario={scenario.isPlaceholder}
        section={section}
        message={message}
        {...(variantSuffix !== null && stepNode === null
          ? { variantSuffix }
          : {})}
        choices={choices}
        onSelectChoice={(id) => {
          const ctx = choiceContextById.get(id);
          if (ctx === undefined) return;
          if (ctx.kind === "hero") {
            dispatch({ type: "select-chip", chipId: ctx.chipId });
          } else {
            dispatch({ type: "select-choice", choiceId: ctx.choiceId });
          }
        }}
        freeInput={state.freeInput}
        onOpenFreeInput={() => dispatch({ type: "open-free-input" })}
        onCloseFreeInput={() => dispatch({ type: "close-free-input" })}
        onChangeDraft={(value) =>
          dispatch({ type: "update-free-input-draft", value })
        }
        onSubmitFreeInput={() => dispatch({ type: "submit-free-input" })}
        onAcceptSuggestion={() => {
          if (state.freeInput.suggestion?.kind === "navigate") {
            dispatch({
              type: "select-chip",
              chipId: state.freeInput.suggestion.chipId
            });
            dispatch({ type: "close-free-input" });
          }
        }}
        onDismissSuggestion={() => dispatch({ type: "dismiss-ai-response" })}
        canGoBack={isStep}
        onBack={() => dispatch({ type: "back" })}
        canDismiss={isHero}
        onDismiss={() => dispatch({ type: "dismiss" })}
      />

      {isLeadForm ? (
        <LeadFormCard
          form={scenario.leadForm}
          fields={state.leadDraft.fields}
          consents={state.leadDraft.consents}
          canSubmit={canSubmit}
          onChangeField={(fieldId, value) =>
            dispatch({ type: "update-field", fieldId, value })
          }
          onToggleConsent={(consentId, value) =>
            dispatch({ type: "toggle-consent", consentId, value })
          }
          onSubmit={() => {
            if (window.__CONCIERGE_MOCK_SUBMIT_SHOULD_FAIL__ === true) {
              dispatch({
                type: "submit-lead-failed",
                message:
                  "mock submit 실패 상태입니다. 잠시 후 다시 시도해주세요."
              });
              return;
            }
            dispatch({ type: "submit-lead" });
          }}
          {...(summaryHint !== undefined ? { summaryHint } : {})}
          errorMessage={state.submitError}
          onBack={() => dispatch({ type: "back" })}
        />
      ) : null}

      {isSubmitted ? (
        <SubmittedCard
          thanksMessage={scenario.leadForm.thanksMessage}
          onReset={() => dispatch({ type: "reset" })}
        />
      ) : null}

      {isDismissed ? (
        <MinimizedPill onReopen={() => dispatch({ type: "reopen" })} />
      ) : null}
    </div>
  );
}

function resolveAvatarMood(input: {
  readonly freeInputMode: "closed" | "open" | "thinking" | "replying";
  readonly avatarState: AvatarStateName;
  readonly isStep: boolean;
}): "idle" | "thinking" | "replying" | "pointing" {
  if (input.freeInputMode === "thinking") return "thinking";
  if (input.freeInputMode === "replying") return "replying";
  if (input.avatarState === "pointing" || input.isStep) return "pointing";
  return "idle";
}

function resolveAvatarExpression(input: {
  readonly freeInputMode: "closed" | "open" | "thinking" | "replying";
  readonly avatarState: AvatarStateName;
  readonly expressionOverride: AvatarExpressionName | null;
  readonly isStep: boolean;
  readonly isSubmitted: boolean;
  readonly isDismissed: boolean;
}): AvatarExpression {
  if (input.isSubmitted) return "celebrate";
  if (input.isDismissed) return "farewell";
  if (input.freeInputMode === "open") return "listening";
  if (input.freeInputMode === "thinking") return "thinking";
  if (input.freeInputMode === "replying") return "smile";
  if (input.expressionOverride !== null) return input.expressionOverride;
  if (input.avatarState === "pointing" || input.isStep) return "smile";
  if (input.avatarState === "moving") return "neutral";
  return "smile";
}

function useViewport(): {
  readonly width: number;
  readonly height: number;
  readonly isMobile: boolean;
} {
  const [viewport, setViewport] = useState(() => readViewport());

  useEffect(() => {
    const onResize = () => setViewport(readViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return viewport;
}

function readViewport(): {
  readonly width: number;
  readonly height: number;
  readonly isMobile: boolean;
} {
  if (typeof window === "undefined") {
    return { width: 1280, height: 800, isMobile: false };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768
  };
}

function clampBubbleAnchorPoint(
  point: AnchorPoint,
  viewport: {
    readonly width: number;
    readonly height: number;
    readonly isMobile: boolean;
  }
): AnchorPoint {
  const bubbleWidth = Math.min(560, Math.max(0, viewport.width - 32));
  const horizontalInset = bubbleWidth / 2 + 16;
  const verticalInset = viewport.isMobile ? 96 : 112;

  return {
    x: clamp(point.x, horizontalInset, viewport.width - horizontalInset),
    y: clamp(point.y, verticalInset, viewport.height - verticalInset)
  };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

function resolveParentOrigin(allowedOrigins: readonly string[]): string | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return allowedOrigins[0] ?? null;
  }

  const candidates = [
    document.referrer,
    getAncestorOrigin(),
    allowedOrigins[0] ?? null
  ];
  for (const candidate of candidates) {
    if (candidate === null || candidate.length === 0) continue;
    try {
      const origin = new URL(candidate).origin;
      if (isOriginAllowed(origin, allowedOrigins)) {
        return origin;
      }
    } catch {
      // Continue to the next source of parent-origin evidence.
    }
  }

  return null;
}

function getAncestorOrigin(): string | null {
  const location = window.location as Location & {
    readonly ancestorOrigins?: DOMStringList;
  };
  const ancestorOrigins = location.ancestorOrigins;
  if (ancestorOrigins === undefined || ancestorOrigins.length === 0) {
    return null;
  }
  return ancestorOrigins.item(0);
}

export function shouldRenderHostPreview(): boolean {
  if (typeof window === "undefined") return true;
  return window.parent === window;
}

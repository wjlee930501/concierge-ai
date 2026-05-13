import { useMemo, type JSX } from "react";
import {
  anchorToPoint,
  type AvatarExpressionName,
  type AvatarStateName
} from "@conciergeai/shared";
import { HeroBubble } from "./components/HeroBubble";
import type { AvatarExpression } from "./components/Avatar";
import { LeadFormCard } from "./components/LeadFormCard";
import { MinimizedPill } from "./components/MinimizedPill";
import { Spotlight } from "./components/Spotlight";
import { SpotlightConnector } from "./components/SpotlightConnector";
import { SubmittedCard } from "./components/SubmittedCard";
import type { ChipChoice } from "./components/QuickChips";
import { HostPagePreview } from "./preview/HostPagePreview";
import { loadPlaceholderScenario } from "./preview/load-placeholder-scenario";
import { isLeadDraftSubmittable } from "./state/scenarioRunner";
import { useScenarioRunner } from "./state/useScenarioRunner";
import { useIframeHitbox } from "./state/useIframeHitbox";
import { useViewport } from "./state/useViewport";
import { clampBubbleAnchorPoint } from "./state/clampBubbleAnchorPoint";
import { buildVariantGreetingSuffix } from "./state/pageContext";
import { readConciergeRuntimeConfig } from "./config/runtime";
import { useParentOrigin } from "./state/useParentOrigin";
import { useLeadSubmissionEffect } from "./state/useLeadSubmissionEffect";
import { useChoreographyController } from "./state/useChoreographyController";

type ChoiceContext =
  | { readonly kind: "hero"; readonly chipId: string }
  | { readonly kind: "step"; readonly choiceId: string };

declare global {
  interface Window {
    __CONCIERGE_MOCK_SUBMIT_SHOULD_FAIL__?: boolean;
    __CONCIERGE_LAST_MOCK_LEAD__?: unknown;
  }
}

export function App(): JSX.Element {
  const scenario = useMemo(() => loadPlaceholderScenario(), []);
  const { state, dispatch } = useScenarioRunner(scenario);
  const viewport = useViewport();
  const renderHostPreview = shouldRenderHostPreview();
  const runtimeConfig = useMemo(() => readConciergeRuntimeConfig(), []);
  const parentOrigin = useParentOrigin(runtimeConfig.allowedOrigins);

  const phase = state.phase;
  const isHero = phase.kind === "hero-visible";
  const isStep = phase.kind === "step-active";
  const isLeadForm = phase.kind === "lead-form";
  const isSubmitted = phase.kind === "submitted";
  const isDismissed = phase.kind === "dismissed";
  const showHero = isHero || isStep;

  const stepNode = isStep ? phase.step : null;
  const heroPoint = stepNode?.avatarPoint ?? "up";

  const { choreographyUi, isStepActive: isCurrentStepChoreography } =
    useChoreographyController({
      stepNode,
      scenario,
      reducedMotion: state.reducedMotion,
      viewport,
      parentOrigin
    });

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

  useLeadSubmissionEffect({ submission: state.submission, parentOrigin });

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
        ? (choreographyUi.bubbleMessage ?? stepNode.popover.body)
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
    enabled: true,
    targetOrigin: parentOrigin,
    signal: hitboxSignal
  });

  return (
    <div className="relative">
      {renderHostPreview ? <HostPagePreview /> : null}

      <Spotlight
        target={isStep ? stepNode!.spotlightTarget : null}
        active={isStep}
        mode={renderHostPreview ? "internal" : "external"}
        reducedMotion={state.reducedMotion}
      />

      <SpotlightConnector
        target={isStep && renderHostPreview ? stepNode!.spotlightTarget : null}
        active={isStep && renderHostPreview && choreographyUi.bubbleVisible}
        bubbleAnchor={safeAnchorPoint}
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

export function shouldRenderHostPreview(): boolean {
  if (typeof window === "undefined") return true;
  return window.parent === window;
}

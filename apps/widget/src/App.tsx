import { useMemo, type JSX } from "react";
import { HeroBubble } from "./components/HeroBubble";
import { LeadFormCard } from "./components/LeadFormCard";
import { MinimizedPill } from "./components/MinimizedPill";
import { Spotlight } from "./components/Spotlight";
import { SubmittedCard } from "./components/SubmittedCard";
import type { ChipChoice } from "./components/QuickChips";
import { HostPagePreview } from "./preview/HostPagePreview";
import { loadPlaceholderScenario } from "./preview/load-placeholder-scenario";
import { isLeadDraftSubmittable } from "./state/scenarioRunner";
import { useScenarioRunner } from "./state/useScenarioRunner";
import { buildVariantGreetingSuffix } from "./state/pageContext";

type ChoiceContext =
  | { readonly kind: "hero"; readonly chipId: string }
  | { readonly kind: "step"; readonly choiceId: string };

export function App(): JSX.Element {
  const scenario = useMemo(() => loadPlaceholderScenario(), []);
  const { state, dispatch } = useScenarioRunner(scenario);

  const phase = state.phase;
  const isHero = phase.kind === "hero-visible";
  const isStep = phase.kind === "step-active";
  const isLeadForm = phase.kind === "lead-form";
  const isSubmitted = phase.kind === "submitted";
  const isDismissed = phase.kind === "dismissed";
  const showHero = isHero || isStep;

  const stepNode = isStep ? phase.step : null;
  const heroPoint = stepNode?.avatarPoint ?? "up";
  const avatarMood =
    state.freeInput.mode === "thinking"
      ? "thinking"
      : state.freeInput.mode === "replying"
      ? "replying"
      : isStep
      ? "pointing"
      : "idle";

  const variantSuffix = buildVariantGreetingSuffix(state.pageContext);
  const canSubmit = isLeadDraftSubmittable(state);

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
  const message = stepNode?.popover.body ?? scenario.heroBubble.message;
  const section = stepNode !== null
    ? { label: stepNode.popover.label, title: stepNode.popover.title }
    : null;

  const choiceContexts: { readonly choice: ChipChoice; readonly context: ChoiceContext }[] =
    stepNode !== null
      ? stepNode.choices.map((choice) => ({
          choice: { id: choice.id, label: choice.label },
          context: { kind: "step", choiceId: choice.id }
        }))
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

  return (
    <div className="relative">
      <HostPagePreview />

      <Spotlight
        target={isStep ? stepNode!.spotlightTarget : null}
        active={isStep}
      />

      <HeroBubble
        visible={showHero}
        avatarPoint={heroPoint}
        avatarMood={avatarMood}
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
          onSubmit={() => dispatch({ type: "submit-lead" })}
          {...(summaryHint !== undefined ? { summaryHint } : {})}
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

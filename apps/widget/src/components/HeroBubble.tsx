import type { JSX } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type {
  AnchorName,
  AnchorPoint,
  ScenarioAvatarPoint
} from "@conciergeai/shared";
import { Avatar } from "./Avatar";
import { QuickChips, type ChipChoice } from "./QuickChips";
import { FreeInputBar } from "./FreeInputBar";
import { AiSpeechBubble } from "./AiSpeechBubble";
import type { FreeInputSlice } from "../state/types";

export type HeroBubbleProps = {
  readonly visible: boolean;
  readonly avatarPoint: ScenarioAvatarPoint;
  readonly avatarMood: "idle" | "thinking" | "replying" | "pointing";
  readonly anchorPosition: AnchorPoint;
  readonly currentAnchor: AnchorName;
  readonly avatarTilt: number;
  readonly bubbleVisible: boolean;
  readonly isPlaceholderScenario: boolean;
  readonly section: { readonly label: string; readonly title: string } | null;
  readonly message: string;
  readonly variantSuffix?: string | null;
  readonly choices: readonly ChipChoice[];
  readonly onSelectChoice: (id: string) => void;
  readonly activeChoiceId?: string;
  readonly freeInput: FreeInputSlice;
  readonly onOpenFreeInput: () => void;
  readonly onCloseFreeInput: () => void;
  readonly onChangeDraft: (value: string) => void;
  readonly onSubmitFreeInput: () => void;
  readonly onAcceptSuggestion: () => void;
  readonly onDismissSuggestion: () => void;
  readonly canGoBack: boolean;
  readonly onBack: () => void;
  readonly canDismiss: boolean;
  readonly onDismiss: () => void;
};

export function HeroBubble(props: HeroBubbleProps): JSX.Element {
  const reduced = useReducedMotion() === true;
  const showFreeInput = props.freeInput.mode !== "closed";
  const freeInputDisabled =
    props.freeInput.mode === "thinking" || props.freeInput.mode === "replying";
  const aiText =
    props.freeInput.mode === "thinking" || props.freeInput.mode === "replying"
      ? props.freeInput.stream
      : "";
  const showAiBubble =
    props.freeInput.mode === "thinking" || props.freeInput.mode === "replying";

  const showSection = props.section !== null;
  const stackedBubble = showSection || props.message.length > 60;

  return (
    <AnimatePresence>
      {props.visible ? (
        <motion.section
          aria-label="MotionLabs Concierge AI"
          data-current-anchor={props.currentAnchor}
          className="pointer-events-auto fixed z-[90]"
          style={{ transform: "translate(-50%, -50%)" }}
          initial={{ opacity: 0 }}
          animate={{
            left: props.anchorPosition.x,
            top: props.anchorPosition.y,
            opacity: 1
          }}
          exit={{ opacity: 0 }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 260, damping: 24 }
          }
        >
          {/* Floor glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-20 -bottom-6 -z-10 h-32 rounded-full bg-[radial-gradient(closest-side,rgba(7,20,39,0.18),transparent_70%)]"
          />

          <div className="flex w-[min(560px,calc(100vw-32px))] flex-col items-center gap-2.5">
            {/* AI streaming response (only during free-input thinking/replying) */}
            {showAiBubble ? (
              <div className="w-full max-w-[440px]">
                <AiSpeechBubble
                  text={aiText}
                  isStreaming={props.freeInput.mode === "thinking"}
                  {...(props.freeInput.suggestion?.kind === "navigate"
                    ? { suggestionLabel: props.freeInput.suggestion.label }
                    : {})}
                  {...(props.freeInput.mode === "replying" &&
                  props.freeInput.suggestion?.kind === "navigate"
                    ? { onAcceptSuggestion: props.onAcceptSuggestion }
                    : {})}
                  onDismiss={props.onDismissSuggestion}
                />
              </div>
            ) : null}

            {/* Choice chips (above the speech pill) */}
            {props.bubbleVisible &&
            props.choices.length > 0 &&
            !showFreeInput ? (
              <QuickChips
                chips={props.choices}
                onSelect={props.onSelectChoice}
                {...(props.activeChoiceId !== undefined
                  ? { activeChipId: props.activeChoiceId }
                  : {})}
              />
            ) : null}

            {/* Free input (replaces chips when open) */}
            {props.bubbleVisible && showFreeInput ? (
              <div className="w-full max-w-[440px]">
                <FreeInputBar
                  disabled={freeInputDisabled}
                  placeholder="무엇이 궁금하세요?"
                  draft={props.freeInput.draft}
                  onChangeDraft={props.onChangeDraft}
                  onSubmit={props.onSubmitFreeInput}
                />
              </div>
            ) : null}

            {/* Main speech pill: avatar + dark bubble */}
            <div className="flex items-center gap-2.5">
              <Avatar
                point={props.avatarPoint}
                mood={props.avatarMood}
                tilt={props.avatarTilt}
              />
              {props.bubbleVisible ? (
                <SpeechPill
                  stacked={stackedBubble}
                  section={props.section}
                  message={props.message}
                  {...(props.variantSuffix !== undefined &&
                  props.variantSuffix !== null
                    ? { variantSuffix: props.variantSuffix }
                    : {})}
                  isPlaceholderScenario={props.isPlaceholderScenario}
                />
              ) : null}
            </div>

            {/* Toggle row: back + free input toggle */}
            {props.bubbleVisible ? (
              <div className="flex items-center justify-center gap-2">
                {props.canGoBack ? (
                  <button
                    type="button"
                    className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-mist shadow-[0_4px_12px_rgba(7,20,39,0.08)] hover:text-ink"
                    onClick={props.onBack}
                    aria-label="이전 단계로"
                  >
                    ← 이전
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-mist shadow-[0_4px_12px_rgba(7,20,39,0.08)] hover:text-ink"
                  onClick={
                    showFreeInput
                      ? props.onCloseFreeInput
                      : props.onOpenFreeInput
                  }
                >
                  {showFreeInput ? "선택지로 돌아가기" : "직접 물어보기"}
                </button>
                {props.canDismiss ? (
                  <button
                    type="button"
                    className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold text-mist shadow-[0_4px_12px_rgba(7,20,39,0.08)] hover:text-ink"
                    onClick={props.onDismiss}
                    aria-label="안내 없이 그냥 둘러보기"
                  >
                    그냥 둘러보기
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

function SpeechPill(props: {
  readonly stacked: boolean;
  readonly section: { readonly label: string; readonly title: string } | null;
  readonly message: string;
  readonly variantSuffix?: string;
  readonly isPlaceholderScenario: boolean;
}): JSX.Element {
  const radius = props.stacked ? "rounded-3xl" : "rounded-full";
  const contentKey = `${props.section?.label ?? "hero"}::${props.message.slice(0, 40)}`;
  return (
    <motion.div
      layout
      className={`relative max-w-[460px] ${radius} bg-ink/95 px-4 py-3 text-white shadow-[0_18px_40px_rgba(7,20,39,0.35)] backdrop-blur`}
      transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={contentKey}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {props.section !== null ? (
            <div className="mb-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-mint">
              {props.section.label}
            </div>
          ) : null}
          {props.section !== null ? (
            <div className="text-[14px] font-black tracking-tight">
              {props.section.title}
            </div>
          ) : null}
          <p
            className={`text-[13px] leading-[1.55] text-white/85 ${
              props.section !== null ? "mt-1" : ""
            }`}
          >
            {props.message}
          </p>
          {props.variantSuffix !== undefined ? (
            <p className="mt-1 text-[11px] leading-snug text-mint/90">
              {props.variantSuffix}
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>
      {props.isPlaceholderScenario ? (
        <span
          title="실제 시나리오 카피는 source data 도착 후 교체"
          className="absolute -top-2 right-3 rounded-full border border-white/20 bg-ink px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/70"
        >
          데모
        </span>
      ) : null}
    </motion.div>
  );
}

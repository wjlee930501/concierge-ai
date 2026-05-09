import { useEffect, useRef, useState, type JSX } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type {
  AnchorName,
  AnchorPoint,
  ScenarioAvatarPoint
} from "@conciergeai/shared";
import {
  computeAnticipationOffset,
  computeMotionDistance,
  computeMoveProfile,
  computePathControlPoint,
  computeScrollLagOffset,
  computeSettleOffset
} from "@conciergeai/shared";
import { Avatar, type AvatarExpression } from "./Avatar";
import { QuickChips, type ChipChoice } from "./QuickChips";
import { FreeInputBar } from "./FreeInputBar";
import { AiSpeechBubble } from "./AiSpeechBubble";
import type { FreeInputSlice } from "../state/types";

export type HeroBubbleProps = {
  readonly visible: boolean;
  readonly avatarPoint: ScenarioAvatarPoint;
  readonly avatarMood: "idle" | "thinking" | "replying" | "pointing";
  readonly avatarExpression: AvatarExpression;
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
  const previousAnchorPosition = usePreviousAnchorPoint(props.anchorPosition);
  const motionDistance = computeMotionDistance(
    previousAnchorPosition,
    props.anchorPosition
  );
  const moveProfile = computeMoveProfile(motionDistance);
  const anticipation = computeAnticipationOffset(
    previousAnchorPosition,
    props.anchorPosition
  );
  const settle = computeSettleOffset();
  const pathControl = computePathControlPoint(
    previousAnchorPosition,
    props.anchorPosition
  );
  const scrollLagY = useScrollLag(reduced);

  return (
    <AnimatePresence>
      {props.visible ? (
        <motion.section
          aria-label="MotionLabs Concierge AI"
          data-current-anchor={props.currentAnchor}
          data-motion-profile={moveProfile.name}
          data-motion-duration-ms={moveProfile.durationMs}
          data-path-control={`${Math.round(pathControl.x)},${Math.round(pathControl.y)}`}
          data-scroll-lag-y={Math.round(scrollLagY)}
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
              : {
                  type: "spring",
                  stiffness: moveProfile.stiffness,
                  damping: moveProfile.damping,
                  mass: moveProfile.mass
                }
          }
        >
          {/* Floor glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-20 -bottom-6 -z-10 h-32 rounded-full bg-[radial-gradient(closest-side,rgba(7,20,39,0.18),transparent_70%)]"
          />

          <motion.div
            className="flex w-[min(560px,calc(100vw-32px))] flex-col items-center gap-2.5"
            animate={
              reduced
                ? { x: 0, y: 0 }
                : {
                    x: [anticipation.x, 0, 0],
                    y: [
                      anticipation.y + scrollLagY,
                      settle.y + scrollLagY,
                      scrollLagY
                    ]
                  }
            }
            transition={
              reduced
                ? { duration: 0 }
                : {
                    duration: moveProfile.durationMs / 1000,
                    times: [0, 0.78, 1],
                    ease: [0.2, 0.8, 0.2, 1]
                  }
            }
          >
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
                expression={props.avatarExpression}
                tilt={props.avatarTilt}
              />
              {props.bubbleVisible ? (
                <SpeechPill
                  stacked={stackedBubble}
                  reduced={reduced}
                  currentAnchor={props.currentAnchor}
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
          </motion.div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

function usePreviousAnchorPoint(current: AnchorPoint): AnchorPoint {
  const previousRef = useRef<AnchorPoint>(current);
  const previous = previousRef.current;

  useEffect(() => {
    previousRef.current = current;
  }, [current]);

  return previous;
}

function useScrollLag(disabled: boolean): number {
  const [offset, setOffset] = useState(0);
  const lastScrollYRef = useRef(
    typeof window === "undefined" ? 0 : window.scrollY
  );

  useEffect(() => {
    if (disabled || typeof window === "undefined") {
      setOffset(0);
      return undefined;
    }

    let resetTimer: ReturnType<typeof window.setTimeout> | undefined;
    const onScroll = () => {
      const nextScrollY = window.scrollY;
      const delta = nextScrollY - lastScrollYRef.current;
      lastScrollYRef.current = nextScrollY;
      setOffset(computeScrollLagOffset(delta));

      if (resetTimer !== undefined) {
        window.clearTimeout(resetTimer);
      }
      resetTimer = window.setTimeout(() => setOffset(0), 110);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (resetTimer !== undefined) {
        window.clearTimeout(resetTimer);
      }
      window.removeEventListener("scroll", onScroll);
    };
  }, [disabled]);

  return disabled ? 0 : offset;
}

function SpeechPill(props: {
  readonly stacked: boolean;
  readonly reduced: boolean;
  readonly currentAnchor: AnchorName;
  readonly section: { readonly label: string; readonly title: string } | null;
  readonly message: string;
  readonly variantSuffix?: string;
  readonly isPlaceholderScenario: boolean;
}): JSX.Element {
  const radius = props.stacked ? "rounded-3xl" : "rounded-full";
  const contentKey = `${props.section?.label ?? "hero"}::${props.message.slice(0, 40)}`;
  const breathing = !props.reduced;
  return (
    <motion.div
      layout
      data-testid="speech-pill"
      data-polish-breathing={breathing ? "true" : "false"}
      data-tail-anchor={props.currentAnchor}
      className={`relative max-w-[460px] ${radius} bg-ink/95 px-4 py-3 text-white shadow-[0_18px_40px_rgba(7,20,39,0.35)] backdrop-blur`}
      animate={breathing ? { scale: [1, 1.005, 1] } : undefined}
      transition={
        breathing
          ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0 }
      }
    >
      <motion.span
        aria-hidden="true"
        className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 rounded-[2px] bg-ink/95"
        animate={{ rotate: resolveTailRotation(props.currentAnchor) }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      />
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

function resolveTailRotation(anchor: AnchorName): number {
  if (anchor.includes("right")) return 52;
  if (anchor.includes("left")) return 38;
  if (anchor.includes("bottom")) return 58;
  return 45;
}

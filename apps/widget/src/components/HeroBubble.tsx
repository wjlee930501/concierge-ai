import { useEffect, useRef, useState, type JSX } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion
} from "framer-motion";
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
import {
  SPEECH_FLOAT_AMPLITUDE_PX,
  SPEECH_FLOAT_ANIMATE,
  SPEECH_FLOAT_TRANSITION
} from "./floatingMotion";
import { useTypewriter } from "./useTypewriter";
import type { FreeInputSlice } from "../state/types";

export type HeroBubbleProps = {
  readonly visible: boolean;
  readonly avatarPoint: ScenarioAvatarPoint;
  readonly avatarMood:
    | "idle"
    | "thinking"
    | "replying"
    | "pointing"
    | "celebrate";
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
  const isFirstEntrance = useFirstMount(props.visible);
  const walkOn = isFirstEntrance && !reduced;

  return (
    <AnimatePresence>
      {props.visible ? (
        <motion.section
          aria-label="MotionLabs Concierge AI"
          data-current-anchor={props.currentAnchor}
          data-motion-positioning="transform"
          data-motion-profile={moveProfile.name}
          data-motion-duration-ms={moveProfile.durationMs}
          data-path-control={`${Math.round(pathControl.x)},${Math.round(pathControl.y)}`}
          data-scroll-lag-y={Math.round(scrollLagY)}
          data-polish-walk-on={walkOn ? "true" : "false"}
          className="pointer-events-auto fixed z-[90]"
          style={{
            left: 0,
            top: 0,
            willChange: "transform"
          }}
          initial={{
            opacity: 0,
            x: props.anchorPosition.x,
            y: props.anchorPosition.y,
            ...(walkOn ? { scale: 0.92, rotate: -2 } : {})
          }}
          animate={{
            x: props.anchorPosition.x,
            y: props.anchorPosition.y,
            opacity: 1,
            scale: 1,
            rotate: 0
          }}
          exit={{ opacity: 0 }}
          transition={
            reduced
              ? { duration: 0 }
              : walkOn
                ? {
                    type: "spring",
                    stiffness: 230,
                    damping: 24,
                    mass: 0.95
                  }
                : {
                    type: "spring",
                    stiffness: moveProfile.stiffness,
                    damping: moveProfile.damping,
                    mass: moveProfile.mass
                  }
          }
        >
          <div
            className="absolute left-0 top-0 will-change-transform"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            {/* Floor glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-20 -bottom-6 -z-10 h-32 rounded-full bg-[radial-gradient(closest-side,rgba(7,20,39,0.18),transparent_70%)]"
            />

            <LayoutGroup id="concierge-hero-stack">
              <motion.div
                data-concierge-hitbox="true"
                className="flex w-[min(560px,calc(100vw-32px))] max-w-[min(560px,calc(100vw-32px))] flex-col items-center gap-2.5 will-change-transform"
                animate={
                  reduced
                    ? { x: 0, y: 0 }
                    : {
                        x: [anticipation.x, anticipation.x * 0.35, 0],
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
                  <motion.div
                    layout
                    transition={MAGIC_MOVE_LAYOUT}
                    className="w-full max-w-[440px]"
                  >
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
                  </motion.div>
                ) : null}

                {/* Choice chips (above the speech pill) */}
                {props.bubbleVisible &&
                props.choices.length > 0 &&
                !showFreeInput ? (
                  <motion.div
                    layout
                    transition={MAGIC_MOVE_LAYOUT}
                    className={showSection ? "" : "order-2"}
                  >
                    <QuickChips
                      chips={props.choices}
                      onSelect={props.onSelectChoice}
                      {...(props.activeChoiceId !== undefined
                        ? { activeChipId: props.activeChoiceId }
                        : {})}
                    />
                  </motion.div>
                ) : null}

                {/* Free input (replaces chips when open) */}
                {props.bubbleVisible && showFreeInput ? (
                  <motion.div
                    layout
                    transition={MAGIC_MOVE_LAYOUT}
                    className={`w-[min(440px,calc(100vw-32px))] max-w-full ${
                      showSection ? "" : "order-2"
                    }`}
                  >
                    <FreeInputBar
                      disabled={freeInputDisabled}
                      placeholder="무엇이 궁금하세요?"
                      draft={props.freeInput.draft}
                      onChangeDraft={props.onChangeDraft}
                      onSubmit={props.onSubmitFreeInput}
                    />
                  </motion.div>
                ) : null}

                {/* Main speech pill: avatar + dark bubble */}
                <motion.div
                  layout
                  transition={MAGIC_MOVE_LAYOUT}
                  className={`flex items-center gap-2.5 ${
                    showSection ? "" : "order-1"
                  }`}
                >
                  <Avatar
                    point={props.avatarPoint}
                    mood={props.avatarMood}
                    expression={props.avatarExpression}
                    tilt={props.avatarTilt}
                    firstWave={walkOn}
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
                      entranceDelaySec={walkOn ? 0.22 : 0}
                    />
                  ) : null}
                </motion.div>

                {/* Toggle row: back + free input toggle */}
                {props.bubbleVisible ? (
                  <motion.div
                    layout
                    transition={MAGIC_MOVE_LAYOUT}
                    className={`flex items-center justify-center gap-2 ${
                      showSection ? "" : "order-3"
                    }`}
                  >
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
                  </motion.div>
                ) : null}
              </motion.div>
            </LayoutGroup>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

const MAGIC_MOVE_LAYOUT = {
  type: "spring" as const,
  stiffness: 240,
  damping: 30,
  mass: 0.9
};

function useFirstMount(active: boolean): boolean {
  // True until the first time `active` flips from true → false. This lets
  // walk-on entrance run once per mount cycle and stay stable across the
  // re-renders that happen between mount and the next visibility toggle.
  const consumedRef = useRef(false);
  const seenActiveRef = useRef(false);
  if (active) {
    seenActiveRef.current = true;
  } else if (seenActiveRef.current) {
    consumedRef.current = true;
  }
  return active && !consumedRef.current;
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

    let resetTimer: number | undefined;
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
  readonly entranceDelaySec: number;
}): JSX.Element {
  const radius = props.stacked ? "rounded-3xl" : "rounded-full";
  const width = props.stacked
    ? "w-[min(460px,calc(100vw-96px))]"
    : "max-w-[460px]";
  const contentKey = `${props.section?.label ?? "hero"}::${props.message.slice(0, 40)}`;
  const breathing = !props.reduced;
  const delay = props.reduced ? 0 : props.entranceDelaySec;
  return (
    <motion.div
      layout
      data-testid="speech-pill"
      data-polish-breathing={breathing ? "true" : "false"}
      data-polish-entrance-delay-ms={Math.round(delay * 1000)}
      data-floating-loop={
        breathing ? SPEECH_FLOAT_TRANSITION.repeatType : "off"
      }
      data-floating-amplitude-px={SPEECH_FLOAT_AMPLITUDE_PX}
      data-tail-anchor={props.currentAnchor}
      className={`relative ${width} ${radius} bg-ink/95 px-4 py-3 text-white shadow-[0_18px_40px_rgba(7,20,39,0.35)] backdrop-blur`}
      {...(breathing
        ? {
            initial: {
              y: 0,
              scale: delay > 0 ? 0.94 : 1,
              opacity: delay > 0 ? 0 : 1
            },
            animate: { ...SPEECH_FLOAT_ANIMATE, opacity: 1 },
            transition: {
              ...SPEECH_FLOAT_TRANSITION,
              opacity: { duration: 0.32, delay, ease: [0.2, 0.8, 0.2, 1] },
              scale:
                delay > 0
                  ? {
                      ...SPEECH_FLOAT_TRANSITION,
                      delay
                    }
                  : SPEECH_FLOAT_TRANSITION,
              y:
                delay > 0
                  ? { ...SPEECH_FLOAT_TRANSITION, delay }
                  : SPEECH_FLOAT_TRANSITION
            }
          }
        : { initial: false, transition: { duration: 0 } })}
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
          <TypewriterLine
            text={props.message}
            reduced={props.reduced}
            offsetTop={props.section !== null}
          />
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

function TypewriterLine(props: {
  readonly text: string;
  readonly reduced: boolean;
  readonly offsetTop: boolean;
}): JSX.Element {
  const { displayed, isComplete } = useTypewriter(props.text, {
    reducedMotion: props.reduced
  });
  const showCaret = !props.reduced && !isComplete;
  return (
    <p
      data-testid="speech-typewriter"
      data-tw-complete={isComplete ? "true" : "false"}
      className={`text-[13px] leading-[1.55] text-white/85 ${
        props.offsetTop ? "mt-1" : ""
      }`}
    >
      {displayed}
      {showCaret ? (
        <motion.span
          aria-hidden="true"
          data-testid="speech-typewriter-caret"
          className="ml-[1px] inline-block h-[0.85em] w-[2px] translate-y-[2px] bg-white/85 align-baseline"
          animate={{ opacity: [0.9, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
    </p>
  );
}

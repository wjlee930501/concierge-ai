import type { JSX } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type SubmittedCardProps = {
  readonly thanksMessage: string;
  readonly onReset: () => void;
};

/**
 * Polish iter 5 — sparkle visibility upgrade.
 *
 * Pre-iter5 (3 dots, 1.1s, 8px, low contrast) the celebration was perceptible
 * to a code reader but not to a screen-cold user — both static captures and
 * live submission saw the burst flash by before the eye could lock on. We
 * keep the burst calm enough to stay on-brand (no confetti) but pump every
 * axis (count, size, duration, glow) so the celebration actually registers.
 *
 *   count:    3   → 6
 *   size:     8px → 14px (with 12px box-shadow bloom)
 *   duration: 1.1s → 2.4s (plateau ~1.4s of "lit" before exit)
 *   curve:    [0,1.2,1,0] → [0,1.4,1,1,0]  (5-key with hold)
 *   rotate:   [0,45,90]   → [0,45,90,135,180]
 *
 * A mint check icon (top-center of the card) also pulses once 0.4s after the
 * card lands so even glance-readers get a clear success signal — Avatar
 * celebrate-keyframe lives behind LeadForm/SubmittedCard so the user can't
 * see it; the check icon is the visible substitute.
 */

const SPARKLES = [
  { left: "10%", top: "22%", delay: 0.05 },
  { left: "30%", top: "10%", delay: 0.14 },
  { left: "50%", top: "6%", delay: 0.22 },
  { left: "70%", top: "10%", delay: 0.3 },
  { left: "90%", top: "22%", delay: 0.38 },
  { left: "82%", top: "44%", delay: 0.46 }
] as const;

const SPARKLE_DURATION_SEC = 2.4;
const SPARKLE_SIZE_PX = 14;

export function SubmittedCard(props: SubmittedCardProps): JSX.Element {
  const reduced = useReducedMotion() === true;

  return (
    <motion.section
      aria-live="polite"
      data-concierge-hitbox="true"
      data-polish-submit-celebrate={reduced ? "off" : "on"}
      data-polish-sparkle-count={SPARKLES.length}
      data-polish-sparkle-duration-ms={Math.round(SPARKLE_DURATION_SEC * 1000)}
      className="pointer-events-auto fixed bottom-7 left-1/2 z-[95] w-[min(360px,calc(100vw-28px))] overflow-hidden rounded-[24px] border border-white/70 bg-white/95 p-5 pt-7 text-center shadow-[0_18px_56px_rgba(7,20,39,0.15)] backdrop-blur"
      initial={
        reduced ? { x: "-50%", opacity: 0 } : { x: "-50%", y: 18, opacity: 0 }
      }
      animate={{ x: "-50%", y: 0, opacity: 1 }}
      transition={
        reduced ? { duration: 0 } : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {reduced ? null : <SparkleField />}
      <CheckBadge reduced={reduced} />
      <p className="relative mt-3 text-sm font-bold text-ink">
        {props.thanksMessage}
      </p>
      <button
        type="button"
        className="relative mt-3 rounded-full border border-ink/20 px-4 py-1 text-xs font-bold text-ink hover:bg-ink hover:text-white"
        onClick={props.onReset}
      >
        다시 보기
      </button>
    </motion.section>
  );
}

function SparkleField(): JSX.Element {
  return (
    <>
      {SPARKLES.map((sparkle, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          data-testid="submitted-sparkle"
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            width: SPARKLE_SIZE_PX,
            height: SPARKLE_SIZE_PX,
            boxShadow: "0 0 12px rgba(55, 216, 178, 0.65)"
          }}
          initial={{ scale: 0, opacity: 0, rotate: 0 }}
          animate={{
            scale: [0, 1.4, 1, 1, 0],
            opacity: [0, 1, 1, 1, 0],
            rotate: [0, 45, 90, 135, 180]
          }}
          transition={{
            duration: SPARKLE_DURATION_SEC,
            delay: sparkle.delay,
            ease: [0.16, 1, 0.3, 1],
            times: [0, 0.18, 0.42, 0.78, 1]
          }}
        />
      ))}
    </>
  );
}

function CheckBadge(props: { readonly reduced: boolean }): JSX.Element {
  return (
    <motion.div
      aria-hidden="true"
      data-testid="submitted-check"
      data-polish-check-pulse={props.reduced ? "off" : "on"}
      className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-mint shadow-[0_0_18px_rgba(55,216,178,0.55)]"
      initial={
        props.reduced ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }
      }
      animate={
        props.reduced
          ? { scale: 1, opacity: 1 }
          : { scale: [0, 1.2, 1.0, 1.15, 1.0], opacity: 1 }
      }
      transition={
        props.reduced
          ? { duration: 0 }
          : {
              duration: 0.9,
              delay: 0.4,
              ease: [0.2, 0.8, 0.2, 1],
              times: [0, 0.4, 0.65, 0.85, 1]
            }
      }
    >
      <svg
        viewBox="0 0 24 24"
        width={20}
        height={20}
        fill="none"
        stroke="#071427"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12.5 L10 17 L19 7" />
      </svg>
    </motion.div>
  );
}

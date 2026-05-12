import type { JSX } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type SubmittedCardProps = {
  readonly thanksMessage: string;
  readonly onReset: () => void;
};

const SPARKLES = [
  { left: "18%", top: "22%", delay: 0.05 },
  { left: "82%", top: "30%", delay: 0.18 },
  { left: "50%", top: "8%", delay: 0.32 }
] as const;

export function SubmittedCard(props: SubmittedCardProps): JSX.Element {
  const reduced = useReducedMotion() === true;

  return (
    <motion.section
      aria-live="polite"
      data-concierge-hitbox="true"
      data-polish-submit-celebrate={reduced ? "off" : "on"}
      className="pointer-events-auto fixed bottom-7 left-1/2 z-[95] w-[min(360px,calc(100vw-28px))] overflow-hidden rounded-[24px] border border-white/70 bg-white/95 p-5 text-center shadow-[0_28px_90px_rgba(7,20,39,0.25)] backdrop-blur"
      initial={
        reduced ? { x: "-50%", opacity: 0 } : { x: "-50%", y: 18, opacity: 0 }
      }
      animate={{ x: "-50%", y: 0, opacity: 1 }}
      transition={
        reduced ? { duration: 0 } : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
      }
    >
      {reduced
        ? null
        : SPARKLES.map((sparkle, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              data-testid="submitted-sparkle"
              className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint shadow-[0_0_8px_rgba(55,216,178,0.85)]"
              style={{ left: sparkle.left, top: sparkle.top }}
              initial={{ scale: 0, opacity: 0, rotate: 0 }}
              animate={{
                scale: [0, 1.2, 1, 0],
                opacity: [0, 1, 1, 0],
                rotate: [0, 45, 90]
              }}
              transition={{
                duration: 1.1,
                delay: sparkle.delay,
                ease: [0.16, 1, 0.3, 1],
                times: [0, 0.35, 0.6, 1]
              }}
            />
          ))}
      <p className="relative text-sm font-bold text-ink">
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

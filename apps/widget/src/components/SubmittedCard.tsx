import type { JSX } from "react";
import { motion } from "framer-motion";

export type SubmittedCardProps = {
  readonly thanksMessage: string;
  readonly onReset: () => void;
};

export function SubmittedCard(props: SubmittedCardProps): JSX.Element {
  return (
    <motion.section
      aria-live="polite"
      className="pointer-events-auto fixed bottom-7 left-1/2 z-[95] w-[min(360px,calc(100vw-28px))] rounded-[24px] border border-white/70 bg-white/95 p-5 text-center shadow-[0_28px_90px_rgba(7,20,39,0.25)] backdrop-blur"
      initial={{ x: "-50%", y: 24, opacity: 0 }}
      animate={{ x: "-50%", y: 0, opacity: 1 }}
    >
      <p className="text-sm font-bold text-ink">{props.thanksMessage}</p>
      <button
        type="button"
        className="mt-3 rounded-full border border-ink/20 px-4 py-1 text-xs font-bold text-ink hover:bg-ink hover:text-white"
        onClick={props.onReset}
      >
        다시 보기
      </button>
    </motion.section>
  );
}

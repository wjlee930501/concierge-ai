import type { JSX } from "react";
import { motion } from "framer-motion";
import avatarSrc from "../../assets/concierge-avatar-v0.1-320.webp";

export type MinimizedPillProps = {
  readonly onReopen: () => void;
};

export function MinimizedPill(props: MinimizedPillProps): JSX.Element {
  return (
    <motion.button
      type="button"
      onClick={props.onReopen}
      aria-label="Concierge AI 안내 다시 받기"
      data-concierge-hitbox="true"
      className="pointer-events-auto fixed bottom-5 right-5 z-[90] flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-3 py-2 text-[12px] font-bold text-ink shadow-[0_12px_30px_rgba(7,20,39,0.18)] backdrop-blur hover:border-accent/40"
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
    >
      <span className="relative inline-block h-7 w-7 shrink-0">
        <img
          src={avatarSrc}
          alt=""
          className="h-full w-full rounded-full object-cover ring-1 ring-white/80"
          draggable={false}
        />
        {/*
          Mint status dot + expanding ping ring.
          - The base dot stays static (anchored to the avatar corner).
          - A sibling ring expands and fades outward on a 2.0s loop, like a
            soft radar ping — quieter than a scale pulse on the dot itself,
            and reads as "I'm awake" without competing with hero motion.
          - `prefers-reduced-motion: reduce` collapses to a static dot via
            the `motion-reduce:hidden` utility on the ping layer.
        */}
        <span
          data-polish-minimized-ping="on"
          className="pointer-events-none absolute -bottom-0.5 -right-0.5 inline-block h-2 w-2"
        >
          <motion.span
            aria-hidden="true"
            className="motion-reduce:hidden absolute inset-0 rounded-full bg-mint"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeOut"
            }}
          />
          <span className="absolute inset-0 rounded-full border-2 border-white bg-mint" />
        </span>
      </span>
      안내 받기
    </motion.button>
  );
}

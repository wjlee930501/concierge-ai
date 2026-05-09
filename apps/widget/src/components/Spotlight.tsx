import type { JSX } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type SpotlightProps = {
  readonly target: string | null;
  readonly active: boolean;
};

export function Spotlight(props: SpotlightProps): JSX.Element {
  return (
    <AnimatePresence>
      {props.active ? (
        <motion.div
          aria-hidden="true"
          data-spotlight-target={props.target ?? undefined}
          className="pointer-events-none fixed inset-0 z-[80] bg-ink/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        />
      ) : null}
    </AnimatePresence>
  );
}

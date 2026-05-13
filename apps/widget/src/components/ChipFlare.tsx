import type { JSX } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Mint particle that floats upward from the chip toward the avatar area.
// Purely cosmetic — no DOM interaction, no z-index conflicts.
export function ChipFlare({
  active
}: {
  readonly active: boolean;
}): JSX.Element {
  return (
    <AnimatePresence>
      {active ? (
        <motion.span
          aria-hidden="true"
          data-testid="chip-flare-particle"
          className="pointer-events-none absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-mint"
          initial={{ opacity: 0.85, scale: 1, y: 0, x: 0 }}
          animate={{ opacity: 0, scale: 0.4, y: -28, x: -10 }}
          exit={{}}
          transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
        />
      ) : null}
    </AnimatePresence>
  );
}

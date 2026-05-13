import { useCallback, useRef, useState, type JSX } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChipFlare } from "./ChipFlare";

export type ChipChoice = {
  readonly id: string;
  readonly label: string;
};

export type QuickChipsProps = {
  readonly chips: readonly ChipChoice[];
  readonly onSelect: (chipId: string) => void;
  readonly activeChipId?: string;
};

export function QuickChips({
  chips,
  onSelect,
  activeChipId
}: QuickChipsProps): JSX.Element {
  const reduced = useReducedMotion() === true;
  const [flaringId, setFlaringId] = useState<string | null>(null);
  const flareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSelect = useCallback(
    (chipId: string) => {
      if (!reduced) {
        if (flareTimerRef.current !== null) {
          clearTimeout(flareTimerRef.current);
        }
        setFlaringId(chipId);
        flareTimerRef.current = setTimeout(() => {
          setFlaringId(null);
          flareTimerRef.current = null;
        }, 420);
      }
      onSelect(chipId);
    },
    [onSelect, reduced]
  );

  return (
    <motion.div
      layout
      className="flex flex-wrap justify-center gap-1.5"
      role="group"
      aria-label="안내 선택지"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {chips.map((chip, index) => {
          const pressed = activeChipId === chip.id;
          const flaring = flaringId === chip.id;
          return (
            <motion.button
              key={chip.id}
              type="button"
              data-chip-id={chip.id}
              data-feedback-window-ms="120"
              aria-pressed={pressed}
              onClick={() => handleSelect(chip.id)}
              layout
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{
                opacity: {
                  duration: 0.3,
                  delay: index * 0.03,
                  ease: [0.16, 1, 0.3, 1]
                },
                y: {
                  duration: 0.3,
                  delay: index * 0.03,
                  ease: [0.16, 1, 0.3, 1]
                },
                scale: { duration: 0.12, ease: [0.16, 1, 0.3, 1] }
              }}
              whileHover={{ y: -1 }}
              whileTap={{ y: 1, scale: 0.98 }}
              whileFocus={{ y: -1 }}
              className={`relative ${
                pressed
                  ? "rounded-full border border-ink bg-ink px-3.5 py-1.5 text-[12px] font-bold text-white shadow-[0_6px_18px_rgba(7,20,39,0.22)]"
                  : "rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-[12px] font-bold text-ink shadow-[0_6px_18px_rgba(7,20,39,0.10)] backdrop-blur hover:border-accent/40 hover:bg-white"
              }`}
            >
              {chip.label}
              <ChipFlare active={flaring} />
            </motion.button>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

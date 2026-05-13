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
  readonly layout?: "wrap" | "grid" | "stack";
};

export function QuickChips({
  chips,
  onSelect,
  activeChipId,
  layout = "wrap"
}: QuickChipsProps): JSX.Element {
  const reduced = useReducedMotion() === true;
  const [flaringId, setFlaringId] = useState<string | null>(null);
  const flareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isGrid = layout === "grid";
  const isStack = layout === "stack";

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
      className={
        isStack
          ? "grid w-full max-w-[300px] grid-cols-1 gap-2"
          : isGrid
            ? "grid w-full max-w-[390px] grid-cols-2 gap-2"
            : "flex max-w-[min(560px,calc(100vw-32px))] flex-wrap justify-center gap-2.5"
      }
      role="group"
      aria-label="안내 선택지"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {chips.map((chip, index) => {
          const pressed = activeChipId === chip.id;
          const flaring = flaringId === chip.id;
          const spanRemainder =
            isGrid && chips.length === 1 && index === chips.length - 1;
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
              className={`relative inline-flex items-center justify-center text-center ${
                pressed
                  ? chipButtonClass(isGrid || isStack, "active")
                  : chipButtonClass(isGrid || isStack, "idle")
              } ${spanRemainder ? "col-span-2" : ""}`}
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

function chipButtonClass(grid: boolean, state: "active" | "idle"): string {
  const shape = grid
    ? "min-h-[46px] w-full rounded-2xl px-3 py-2.5 text-[12px] leading-tight"
    : "min-h-[38px] rounded-full px-5 py-2 text-[13px]";
  const tone =
    state === "active"
      ? "border border-accent bg-accent font-extrabold text-white shadow-[0_5px_14px_rgba(28,115,232,0.18)]"
      : "border border-ink/10 bg-white font-extrabold text-ink shadow-[0_4px_12px_rgba(7,20,39,0.07)] hover:border-accent/40 hover:bg-[#eef5ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return `${shape} ${tone}`;
}

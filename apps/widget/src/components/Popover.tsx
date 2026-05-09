import { useEffect, useState, type JSX } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ScenarioChoice, ScenarioPopover } from "@conciergeai/shared";

export type PopoverProps = {
  readonly target: string | null;
  readonly content: ScenarioPopover | null;
  readonly choices: readonly ScenarioChoice[];
  readonly visible: boolean;
  readonly onSelectChoice: (choiceId: string) => void;
};

type Position = { readonly top: number; readonly left: number };

export function Popover(props: PopoverProps): JSX.Element {
  const position = useTargetPosition(props.target, props.visible);

  return (
    <AnimatePresence>
      {props.visible && props.content !== null ? (
        <motion.aside
          aria-live="polite"
          className="fixed z-[91] max-w-[340px] rounded-2xl bg-ink p-4 text-white shadow-[0_18px_60px_rgba(7,20,39,0.30)]"
          style={{ top: position.top, left: position.left }}
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 6, opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <div className="mb-1 text-[11px] font-black uppercase tracking-[0.08em] text-mint">
            {props.content.label}
          </div>
          <div className="mb-1 font-black tracking-tight">{props.content.title}</div>
          <div className="text-[13px] leading-[1.52] text-white/80">
            {props.content.body}
          </div>
          {props.choices.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {props.choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white hover:bg-white/25"
                  onClick={() => props.onSelectChoice(choice.id)}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          ) : null}
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function useTargetPosition(
  target: string | null,
  visible: boolean
): Position {
  const [pos, setPos] = useState<Position>({ top: 100, left: 100 });

  useEffect(() => {
    if (!visible || target === null) return undefined;
    const compute = () => {
      const node = document.querySelector<HTMLElement>(target);
      if (node === null) return;
      const rect = node.getBoundingClientRect();
      const left = Math.min(
        window.innerWidth - 360,
        Math.max(18, rect.left + rect.width / 2 - 170)
      );
      const top =
        rect.top > window.innerHeight * 0.42
          ? Math.max(18, rect.top - 124)
          : Math.min(window.innerHeight - 180, rect.bottom + 18);
      setPos({ top, left });
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [target, visible]);

  return pos;
}

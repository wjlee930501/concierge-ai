import { useEffect, type JSX } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type SpotlightProps = {
  readonly target: string | null;
  readonly active: boolean;
};

const SPOTLIGHT_CLASS = "concierge-spotlight";

export function Spotlight(props: SpotlightProps): JSX.Element {
  useEffect(() => {
    if (!props.active || props.target === null) {
      removeSpotlight();
      return undefined;
    }
    const node = document.querySelector<HTMLElement>(props.target);
    if (node === null) {
      removeSpotlight();
      return undefined;
    }
    removeSpotlight();
    node.classList.add(SPOTLIGHT_CLASS);
    if (
      "scrollIntoView" in node &&
      typeof node.scrollIntoView === "function"
    ) {
      node.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth"
      });
    }
    return () => removeSpotlight();
  }, [props.active, props.target]);

  return (
    <AnimatePresence>
      {props.active ? (
        <motion.div
          aria-hidden="true"
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

function removeSpotlight(): void {
  const previous = document.querySelectorAll<HTMLElement>(
    `.${SPOTLIGHT_CLASS}`
  );
  previous.forEach((el) => el.classList.remove(SPOTLIGHT_CLASS));
}

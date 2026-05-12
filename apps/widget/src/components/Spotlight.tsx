import { useEffect, useState, type JSX } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Spotlight modes (PR#2 §B1).
 *
 * - `external`: A host-side driver (apps/embed/src/host-driver.ts) is attached
 *   to the parent page and renders the ring/outline by injecting CSS on the
 *   target node directly. The widget Spotlight only paints a soft backdrop
 *   so we avoid a double-ring.
 * - `internal`: The widget is running stand-alone (iframe with no host driver,
 *   preview mode, or local dev). There is no parent CSS injection, so the
 *   widget must paint both the dim mask AND the ring itself by querying the
 *   target rect from its own document.
 */
export type SpotlightMode = "external" | "internal";

export type SpotlightProps = {
  readonly target: string | null;
  readonly active: boolean;
  readonly mode: SpotlightMode;
  readonly reducedMotion?: boolean;
};

type TargetRect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

// `accent` (#1c73e8) lives inside the rgba(...) shadow constants below so the
// breathing bloom stays in lockstep with the base ring color.
const RING_WIDTH_PX = 3;
const RING_INSET_PX = 6;
const RING_RADIUS_PX = 12;
const DIM_OPACITY = 0.45;

export function Spotlight(props: SpotlightProps): JSX.Element {
  const isInternal = props.mode === "internal";
  const rect = useTargetRect({
    enabled: props.active && isInternal,
    selector: props.target
  });
  const transitionDuration = props.reducedMotion === true ? 0 : 0.18;

  return (
    <AnimatePresence>
      {props.active ? (
        isInternal && rect !== null ? (
          <InternalSpotlight
            key="internal"
            target={props.target}
            rect={rect}
            duration={transitionDuration}
            reducedMotion={props.reducedMotion === true}
          />
        ) : (
          <motion.div
            key="external"
            aria-hidden="true"
            data-spotlight-target={props.target ?? undefined}
            data-spotlight-mode="external"
            data-spotlight-source={isInternal ? "internal-fallback" : "host"}
            className="pointer-events-none fixed inset-0 z-[80] bg-ink/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: transitionDuration }}
          />
        )
      ) : null}
    </AnimatePresence>
  );
}

type InternalSpotlightProps = {
  readonly target: string | null;
  readonly rect: TargetRect;
  readonly duration: number;
  readonly reducedMotion: boolean;
};

const RING_SHADOW_BASE = `0 0 0 ${RING_WIDTH_PX}px rgba(28,115,232,1)`;
const RING_SHADOW_BLOOM = `0 0 0 ${RING_WIDTH_PX * 2}px rgba(28,115,232,0.42)`;

function InternalSpotlight(props: InternalSpotlightProps): JSX.Element {
  const inset = RING_INSET_PX;
  const holeLeft = Math.round(props.rect.left - inset);
  const holeTop = Math.round(props.rect.top - inset);
  const holeWidth = Math.round(props.rect.width + inset * 2);
  const holeHeight = Math.round(props.rect.height + inset * 2);
  const reduced = props.reducedMotion;

  // Ring entrance + breathing loop. When reducedMotion is on, freeze to the
  // static base ring with no scale animation (motion still mounts, but the
  // keyframes collapse to a single value so the loop is a no-op).
  const ringInitial = reduced
    ? { scale: 1, opacity: 1, boxShadow: RING_SHADOW_BASE }
    : { scale: 0.94, opacity: 0, boxShadow: RING_SHADOW_BASE };
  const ringAnimate = reduced
    ? { scale: 1, opacity: 1, boxShadow: RING_SHADOW_BASE }
    : {
        scale: 1,
        opacity: 1,
        boxShadow: [RING_SHADOW_BASE, RING_SHADOW_BLOOM, RING_SHADOW_BASE]
      };
  const ringTransition = reduced
    ? { duration: 0 }
    : {
        scale: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] as const },
        opacity: { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] as const },
        boxShadow: {
          duration: 2.4,
          repeat: Number.POSITIVE_INFINITY,
          ease: [0.45, 0, 0.55, 1] as const,
          delay: 0.32
        }
      };

  return (
    <motion.div
      aria-hidden="true"
      data-spotlight-target={props.target ?? undefined}
      data-spotlight-mode="internal"
      data-testid="widget-internal-spotlight"
      className="pointer-events-none fixed inset-0 z-[80]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: props.duration }}
    >
      {/* Dim mask via SVG (cut a hole over the target). */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="concierge-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={holeLeft}
              y={holeTop}
              width={holeWidth}
              height={holeHeight}
              rx={RING_RADIUS_PX}
              ry={RING_RADIUS_PX}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`rgba(7, 20, 39, ${DIM_OPACITY})`}
          mask="url(#concierge-spotlight-mask)"
        />
      </svg>
      {/* Ring outline — entrance scale-in + breathing bloom. */}
      <motion.div
        data-testid="widget-internal-spotlight-ring"
        data-polish-ring-breathing={reduced ? "off" : "on"}
        style={{
          position: "absolute",
          left: holeLeft,
          top: holeTop,
          width: holeWidth,
          height: holeHeight,
          borderRadius: RING_RADIUS_PX,
          pointerEvents: "none",
          transformOrigin: "center center"
        }}
        initial={ringInitial}
        animate={ringAnimate}
        transition={ringTransition}
      />
    </motion.div>
  );
}

/**
 * Polls the local document for the target rect when running in `internal`
 * mode. Recomputes on viewport resize/scroll so the ring tracks the section
 * as the page reflows. Returns `null` when the target is missing — the
 * caller then falls back to the dim-only external rendering so users still
 * see *something* even if the selector cannot be located.
 */
function useTargetRect(input: {
  readonly enabled: boolean;
  readonly selector: string | null;
}): TargetRect | null {
  const [rect, setRect] = useState<TargetRect | null>(null);

  useEffect(() => {
    if (!input.enabled || input.selector === null) {
      setRect(null);
      return undefined;
    }
    if (typeof document === "undefined" || typeof window === "undefined") {
      return undefined;
    }

    const update = () => {
      const node = document.querySelector<HTMLElement>(input.selector!);
      if (node === null) {
        setRect(null);
        return;
      }
      const r = node.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) {
        setRect(null);
        return;
      }
      setRect((prev) => {
        const next: TargetRect = {
          left: r.left,
          top: r.top,
          width: r.width,
          height: r.height
        };
        if (
          prev !== null &&
          prev.left === next.left &&
          prev.top === next.top &&
          prev.width === next.width &&
          prev.height === next.height
        ) {
          return prev;
        }
        return next;
      });
    };

    update();
    const raf = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true, capture: true });
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, { capture: true } as
        | EventListenerOptions
        | boolean);
    };
  }, [input.enabled, input.selector]);

  return rect;
}

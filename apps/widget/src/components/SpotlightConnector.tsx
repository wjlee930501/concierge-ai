import { useEffect, useState, type JSX } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Polish iter 5 — Spotlight ↔ HeroBubble connector.
 *
 * Renders a mint quadratic-bezier line from the spotlight ring's nearest edge
 * toward the hero bubble's anchor point so users perceive the two as one
 * guided gesture rather than two disconnected overlays.
 *
 * Implementation choice (simple direction-hint, not exact two-rect link):
 * - We measure ONLY the spotlight target rect (selector). The bubble side is
 *   taken from the App-provided `bubbleAnchor` (center-bottom of the floating
 *   stack). This keeps the helper at ≤60 logical lines and avoids leaking a
 *   ref out of SpeechPill, which is wrapped in framer-motion's `<LayoutGroup>`
 *   and would race the connector's measurement during chip-press magic-move.
 * - The path origin is the nearest edge of the spotlight ring to the bubble
 *   anchor; the control point sits at the midpoint offset 40px toward the
 *   "outside" of the ring → bubble vector, producing a soft arc.
 * - On `prefers-reduced-motion: reduce` the path draws instantly (pathLength
 *   1 from mount) instead of unmounting, so reduced-motion users still see
 *   the visual link.
 */
export type SpotlightConnectorProps = {
  readonly target: string | null;
  readonly active: boolean;
  readonly bubbleAnchor: { readonly x: number; readonly y: number } | null;
};

type Rect = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

const STROKE = "#37d8b2"; // mint
const STROKE_WIDTH = 1.5;
const STROKE_OPACITY = 0.65;
const CONTROL_OFFSET_PX = 40;

export function SpotlightConnector(
  props: SpotlightConnectorProps
): JSX.Element {
  const reduced = useReducedMotion() === true;
  const rect = useTargetRect(props.target, props.active);

  if (!props.active || rect === null || props.bubbleAnchor === null) {
    return <AnimatePresence />;
  }

  // Nearest point on the spotlight ring edge to the bubble anchor.
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const bx = props.bubbleAnchor.x;
  const by = props.bubbleAnchor.y;
  const dx = bx - cx;
  const dy = by - cy;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  const ringEdgeX = cx + nx * (rect.width / 2 + 6);
  const ringEdgeY = cy + ny * (rect.height / 2 + 6);

  // Pull the bubble endpoint back from the actual anchor so the path lands
  // just above the speech pill, not inside the avatar's footprint.
  const bubbleEdgeX = bx - nx * 28;
  const bubbleEdgeY = by - ny * 28;

  // Quadratic bezier control point: midpoint pushed perpendicular by
  // CONTROL_OFFSET_PX so the line curves gently rather than ruling straight.
  const mx = (ringEdgeX + bubbleEdgeX) / 2;
  const my = (ringEdgeY + bubbleEdgeY) / 2;
  const perpX = -ny;
  const perpY = nx;
  const ctrlX = mx + perpX * CONTROL_OFFSET_PX;
  const ctrlY = my + perpY * CONTROL_OFFSET_PX;

  const d = `M ${ringEdgeX} ${ringEdgeY} Q ${ctrlX} ${ctrlY} ${bubbleEdgeX} ${bubbleEdgeY}`;

  return (
    <AnimatePresence>
      <motion.svg
        key="connector"
        aria-hidden="true"
        data-testid="spotlight-connector"
        data-polish-connector={reduced ? "static" : "draw-in"}
        className="pointer-events-none fixed inset-0 z-[82] h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.18 }}
      >
        <motion.path
          d={d}
          fill="none"
          stroke={STROKE}
          strokeWidth={STROKE_WIDTH}
          strokeOpacity={STROKE_OPACITY}
          strokeLinecap="round"
          strokeDasharray="4 6"
          initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : {
                  duration: 0.42,
                  ease: [0.2, 0.8, 0.2, 1],
                  delay: 0.12
                }
          }
        />
      </motion.svg>
    </AnimatePresence>
  );
}

function useTargetRect(
  selector: string | null,
  enabled: boolean
): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  useEffect(() => {
    if (!enabled || selector === null) {
      setRect(null);
      return undefined;
    }
    if (typeof document === "undefined" || typeof window === "undefined") {
      return undefined;
    }
    const update = () => {
      const node = document.querySelector<HTMLElement>(selector);
      if (node === null) {
        setRect(null);
        return;
      }
      const r = node.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) {
        setRect(null);
        return;
      }
      setRect({
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height
      });
    };
    update();
    const raf = window.requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true, capture: true });
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, {
        capture: true
      } as EventListenerOptions);
    };
  }, [selector, enabled]);
  return rect;
}

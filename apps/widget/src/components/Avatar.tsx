import type { JSX } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ScenarioAvatarPoint } from "@conciergeai/shared";
import avatarSrc from "../../assets/concierge-avatar-v0.1-320.webp";

export type AvatarExpression =
  | "neutral"
  | "smile"
  | "surprise"
  | "thinking"
  | "celebrate"
  | "concerned"
  | "listening"
  | "farewell";

export type AvatarProps = {
  readonly point: ScenarioAvatarPoint;
  readonly mood?: "idle" | "thinking" | "replying" | "pointing";
  readonly expression?: AvatarExpression;
  readonly tilt?: number;
};

const POINT_OFFSET: Record<
  ScenarioAvatarPoint,
  { readonly x: number; readonly y: number; readonly rotate: number }
> = {
  up: { x: 0, y: -3, rotate: 0 },
  left: { x: -4, y: 0, rotate: -2 },
  right: { x: 4, y: 0, rotate: 2 }
};

export function Avatar(props: AvatarProps): JSX.Element {
  const reduced = useReducedMotion() === true;
  const mood = props.mood ?? "idle";
  const expression = props.expression ?? "neutral";
  const target = POINT_OFFSET[props.point];
  const tilt = props.tilt ?? 0;
  const idleAnimate =
    mood === "thinking"
      ? { y: [0, -1.5, 0, 1.5, 0] }
      : { y: [0, -2, 0] };
  const idleTransition = {
    duration: mood === "thinking" ? 1.2 : 4,
    repeat: Infinity,
    ease: "easeInOut" as const
  };

  const containerAnimate = reduced
    ? { x: 0, y: 0, rotate: 0 }
    : { x: target.x, y: target.y, rotate: target.rotate + tilt };
  const containerTransition = {
    type: "spring" as const,
    stiffness: 160,
    damping: 22,
    mass: 0.9
  };

  return (
    <motion.div
      aria-hidden="true"
      data-testid="concierge-avatar"
      data-avatar-expression={expression}
      data-avatar-mood={mood}
      className="relative h-[52px] w-[52px] shrink-0"
      animate={containerAnimate}
      transition={containerTransition}
    >
      <motion.div
        className="relative h-full w-full"
        {...(reduced
          ? {}
          : { animate: idleAnimate, transition: idleTransition })}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={expression}
            src={avatarSrc}
            alt=""
            className="h-full w-full select-none rounded-full object-cover ring-2 ring-white/80 shadow-[0_8px_18px_rgba(7,20,39,0.28)]"
            draggable={false}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
          />
        </AnimatePresence>
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-mint shadow-[0_0_0_2px_rgba(55,216,178,0.18)]" />
      </motion.div>
    </motion.div>
  );
}

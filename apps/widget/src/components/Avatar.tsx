import type { JSX } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ScenarioAvatarPoint } from "@conciergeai/shared";
import {
  AVATAR_EXPRESSION_ASSETS,
  type AvatarExpression
} from "./avatarAssets";

export type { AvatarExpression } from "./avatarAssets";

export type AvatarMood =
  | "idle"
  | "thinking"
  | "replying"
  | "pointing"
  | "celebrate";

export type AvatarProps = {
  readonly point: ScenarioAvatarPoint;
  readonly mood?: AvatarMood;
  readonly expression?: AvatarExpression;
  readonly tilt?: number;
  readonly firstWave?: boolean;
};

// Polish iter 4: tilt upweight. The pre-iter4 offsets (x:±4, rotate:±2°) read
// as a faint sway rather than a deliberate point — users could not feel where
// the avatar was directing them. Bumping to x:±7 and rotate:±4.5° lands at
// "obvious lean toward target" while staying inside the 52px avatar bounds so
// neither the speech-pill anchor nor the floating loop is destabilized.
const POINT_OFFSET: Record<
  ScenarioAvatarPoint,
  { readonly x: number; readonly y: number; readonly rotate: number }
> = {
  up: { x: 0, y: -3, rotate: 0 },
  left: { x: -7, y: 0, rotate: -4.5 },
  right: { x: 7, y: 0, rotate: 4.5 }
};

export function Avatar(props: AvatarProps): JSX.Element {
  const reduced = useReducedMotion() === true;
  const mood = props.mood ?? "idle";
  const expression = props.expression ?? "neutral";
  const asset = AVATAR_EXPRESSION_ASSETS[expression];
  const target = POINT_OFFSET[props.point];
  const tilt = props.tilt ?? 0;
  const idleAnimate =
    mood === "thinking" ? { y: [0, -1.5, 0, 1.5, 0] } : { y: [0, -2, 0] };
  const idleTransition = {
    duration: mood === "thinking" ? 1.2 : 4,
    repeat: Infinity,
    ease: "easeInOut" as const
  };

  const wave = props.firstWave === true && !reduced;
  const celebrate = mood === "celebrate" && !reduced;
  const targetRotate = target.rotate + tilt;
  let containerAnimate: Record<string, number | number[]>;
  let containerTransition:
    | {
        readonly duration: number;
        readonly ease: readonly number[];
        readonly times: readonly number[];
      }
    | {
        readonly type: "spring";
        readonly stiffness: number;
        readonly damping: number;
        readonly mass: number;
      };
  if (reduced) {
    containerAnimate = { x: 0, y: 0, rotate: 0 };
    containerTransition = {
      type: "spring",
      stiffness: 160,
      damping: 22,
      mass: 0.9
    } as const;
  } else if (celebrate) {
    containerAnimate = {
      x: target.x,
      y: [0, -5, 0, -3, 0],
      rotate: [0, -10, 8, -4, targetRotate]
    };
    containerTransition = {
      duration: 1.2,
      ease: [0.2, 0.8, 0.2, 1],
      times: [0, 0.2, 0.5, 0.75, 1]
    } as const;
  } else if (wave) {
    containerAnimate = {
      x: target.x,
      y: [0, -3, 0, -1, 0],
      rotate: [-6, 8, -4, 4, targetRotate]
    };
    containerTransition = {
      duration: 1.1,
      ease: [0.2, 0.8, 0.2, 1],
      times: [0, 0.25, 0.55, 0.8, 1]
    } as const;
  } else {
    containerAnimate = { x: target.x, y: target.y, rotate: targetRotate };
    containerTransition = {
      type: "spring",
      stiffness: 160,
      damping: 22,
      mass: 0.9
    } as const;
  }

  return (
    <motion.div
      aria-hidden="true"
      data-testid="concierge-avatar"
      data-avatar-expression={expression}
      data-avatar-asset={asset.id}
      data-avatar-mood={mood}
      data-polish-first-wave={wave ? "true" : "false"}
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
          <motion.picture
            key={expression}
            className="block h-full w-full"
            animate={{ opacity: 1 }}
            {...(reduced
              ? { initial: false, transition: { duration: 0 } }
              : {
                  initial: { opacity: 0 },
                  exit: { opacity: 0 },
                  transition: { duration: 0.3 }
                })}
          >
            <source srcSet={asset.avif} type="image/avif" />
            <source srcSet={asset.webp} type="image/webp" />
            <img
              src={asset.webp}
              alt=""
              className="h-full w-full select-none rounded-full object-cover ring-2 ring-white/80 shadow-[0_8px_18px_rgba(7,20,39,0.28)]"
              style={{ objectPosition: asset.objectPosition }}
              draggable={false}
            />
          </motion.picture>
        </AnimatePresence>
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-mint shadow-[0_0_0_2px_rgba(55,216,178,0.18)]" />
      </motion.div>
    </motion.div>
  );
}

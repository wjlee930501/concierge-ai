import type { AnchorPoint } from "./types";
import { computeMoveDuration } from "./anchors";

export type MoveProfileName = "short" | "standard" | "long";

export type MoveProfile = {
  readonly name: MoveProfileName;
  readonly durationMs: number;
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
};

const MAX_SCROLL_LAG = 18;

export function computeMoveProfile(distance: number): MoveProfile {
  const durationMs = computeMoveDuration(distance);
  if (distance < 240) {
    return {
      name: "short",
      durationMs,
      stiffness: 135,
      damping: 26,
      mass: 0.95
    };
  }

  if (distance > 900) {
    return {
      name: "long",
      durationMs,
      stiffness: 96,
      damping: 30,
      mass: 1.12
    };
  }

  return {
    name: "standard",
    durationMs,
    stiffness: 118,
    damping: 28,
    mass: 1.02
  };
}

export function computeMotionDistance(
  from: AnchorPoint,
  to: AnchorPoint
): number {
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function computeAnticipationOffset(
  from: AnchorPoint,
  to: AnchorPoint
): AnchorPoint {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: dx >= 0 ? -3 : 3, y: 0 };
  }

  return { x: 0, y: dy >= 0 ? -2 : 2 };
}

export function computeSettleOffset(): AnchorPoint {
  return { x: 0, y: -1 };
}

export function computePathControlPoint(
  from: AnchorPoint,
  to: AnchorPoint
): AnchorPoint {
  const midpoint = {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2
  };
  const distance = computeMotionDistance(from, to);
  const arcLift = Math.min(96, Math.max(28, distance * 0.12));

  return {
    x: midpoint.x,
    y: midpoint.y - arcLift
  };
}

export function computeScrollLagOffset(scrollDeltaY: number): number {
  const raw = scrollDeltaY * 0.06;
  return Math.round(clamp(raw, -MAX_SCROLL_LAG, MAX_SCROLL_LAG) * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

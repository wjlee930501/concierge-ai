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

const MAX_SCROLL_LAG = 36;

export function computeMoveProfile(distance: number): MoveProfile {
  const durationMs = computeMoveDuration(distance);
  if (distance < 240) {
    return {
      name: "short",
      durationMs,
      stiffness: 240,
      damping: 24,
      mass: 0.75
    };
  }

  if (distance > 900) {
    return {
      name: "long",
      durationMs,
      stiffness: 150,
      damping: 24,
      mass: 1
    };
  }

  return {
    name: "standard",
    durationMs,
    stiffness: 180,
    damping: 22,
    mass: 0.9
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
    return { x: dx >= 0 ? -6 : 6, y: 0 };
  }

  return { x: 0, y: dy >= 0 ? -4 : 4 };
}

export function computeSettleOffset(): AnchorPoint {
  return { x: 0, y: -2 };
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
  const raw = scrollDeltaY * 0.15;
  return clamp(raw, -MAX_SCROLL_LAG, MAX_SCROLL_LAG);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

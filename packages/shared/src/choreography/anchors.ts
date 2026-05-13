// CURATION_CHOREOGRAPHY_SPEC §2 — Anchor 7종 + pickAnchor 자동 선택.

import type {
  AnchorName,
  AnchorPoint,
  AnchorViewport,
  ChoreographyTargetRect
} from "./types";

export const ANCHOR_NAMES: readonly AnchorName[] = [
  "hero_center",
  "right_anchor",
  "left_anchor",
  "right_section_top",
  "right_section_bottom",
  "bottom_right",
  "top_center"
];

export const ANCHOR_AVATAR_SIZE: Readonly<Record<AnchorName, number>> = {
  hero_center: 44,
  right_anchor: 36,
  left_anchor: 36,
  right_section_top: 36,
  right_section_bottom: 36,
  bottom_right: 40,
  top_center: 36
};

export const MOBILE_AVATAR_SIZE = 28 as const;
export const MOBILE_BREAKPOINT = 768 as const;

export function isMobileViewport(viewport: AnchorViewport): boolean {
  if (viewport.isMobile === true) return true;
  return viewport.width < MOBILE_BREAKPOINT;
}

export function anchorToPoint(
  anchor: AnchorName,
  viewport: AnchorViewport
): AnchorPoint {
  const w = viewport.width;
  const h = viewport.height;
  switch (anchor) {
    case "hero_center":
      return { x: w / 2, y: h - 135 };
    case "right_anchor":
      return { x: w - 80, y: h / 2 };
    case "left_anchor":
      return { x: 80, y: h / 2 };
    case "right_section_top":
      return { x: w - 80, y: h / 2 - 100 };
    case "right_section_bottom":
      return { x: w - 80, y: h / 2 + 100 };
    case "bottom_right":
      return { x: w - 80, y: h - 80 };
    case "top_center":
      return { x: w / 2, y: 80 };
  }
}

export function pickAnchor(input: {
  readonly target: ChoreographyTargetRect;
  readonly viewport: AnchorViewport;
}): AnchorName {
  if (isMobileViewport(input.viewport)) {
    return "bottom_right";
  }
  const targetCenterX = input.target.left + input.target.width / 2;
  const targetCenterY = input.target.top + input.target.height / 2;

  if (targetCenterX < input.viewport.width / 2) {
    return targetCenterY < input.viewport.height / 2
      ? "right_section_top"
      : "right_section_bottom";
  }
  return "left_anchor";
}

export function computeAnchorDistance(
  from: AnchorName,
  to: AnchorName,
  viewport: AnchorViewport
): number {
  const a = anchorToPoint(from, viewport);
  const b = anchorToPoint(to, viewport);
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function computeMoveDuration(distance: number): number {
  return Math.min(900, Math.max(600, distance * 0.6));
}

export function computeTilt(avatar: AnchorPoint, target: AnchorPoint): number {
  return target.x > avatar.x ? -8 : 8;
}

export type BubblePosition = "top" | "right" | "bottom" | "left";

export function pickBubblePosition(input: {
  readonly avatar: {
    readonly left: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
  };
  readonly bubbleSize: { readonly w: number; readonly h: number };
  readonly viewport: AnchorViewport;
  readonly target?: ChoreographyTargetRect;
}): BubblePosition {
  const space = {
    top: input.avatar.top,
    bottom: input.viewport.height - input.avatar.bottom,
    left: input.avatar.left,
    right: input.viewport.width - input.avatar.right
  };

  if (input.target !== undefined) {
    if (
      input.target.left < input.avatar.left &&
      space.right > input.bubbleSize.w + 24
    ) {
      return "right";
    }
    if (
      input.target.left > input.avatar.left &&
      space.left > input.bubbleSize.w + 24
    ) {
      return "left";
    }
  }

  if (space.top > input.bubbleSize.h + 24) return "top";
  if (space.bottom > input.bubbleSize.h + 24) return "bottom";

  const ranked = (Object.entries(space) as [BubblePosition, number][]).sort(
    (a, b) => b[1] - a[1]
  );
  return ranked[0]?.[0] ?? "top";
}

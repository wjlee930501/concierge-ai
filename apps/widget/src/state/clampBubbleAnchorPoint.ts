import type { AnchorPoint } from "@conciergeai/shared";
import type { ViewportSnapshot } from "./useViewport";

export function clampBubbleAnchorPoint(
  point: AnchorPoint,
  viewport: ViewportSnapshot
): AnchorPoint {
  const bubbleWidth = Math.min(820, Math.max(0, viewport.width - 32));
  const horizontalInset = bubbleWidth / 2 + 16;
  const verticalInset = viewport.isMobile ? 190 : 112;

  return {
    x: clamp(point.x, horizontalInset, viewport.width - horizontalInset),
    y: clamp(point.y, verticalInset, viewport.height - verticalInset)
  };
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

import { describe, expect, it } from "vitest";
import { clampBubbleAnchorPoint } from "./clampBubbleAnchorPoint";

describe("clampBubbleAnchorPoint", () => {
  it("keeps the expanded choice rail inside a desktop viewport", () => {
    const point = clampBubbleAnchorPoint(
      { x: 1020, y: 280 },
      { width: 1100, height: 760, isMobile: false }
    );

    expect(point.x).toBe(674);
  });

  it("centers the bubble when a narrow viewport cannot fit side anchors", () => {
    const point = clampBubbleAnchorPoint(
      { x: 513, y: 265 },
      { width: 593, height: 345, isMobile: true }
    );

    expect(point.x).toBe(296.5);
    expect(point.y).toBe(172.5);
  });
});

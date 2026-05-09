import { describe, expect, it } from "vitest";
import {
  ANCHOR_NAMES,
  anchorToPoint,
  computeAnchorDistance,
  computeMoveDuration,
  computeTilt,
  isMobileViewport,
  pickAnchor,
  pickBubblePosition
} from "./anchors";

const desktop = { width: 1280, height: 800 };

describe("anchors", () => {
  it("declares 7 anchor names", () => {
    expect(ANCHOR_NAMES).toHaveLength(7);
  });

  it("computes hero_center close to center-bottom", () => {
    const p = anchorToPoint("hero_center", desktop);
    expect(p.x).toBe(640);
    expect(p.y).toBe(580);
  });

  it("right anchors sit 80px from right edge", () => {
    expect(anchorToPoint("right_anchor", desktop).x).toBe(1200);
    expect(anchorToPoint("right_section_top", desktop).x).toBe(1200);
    expect(anchorToPoint("right_section_bottom", desktop).x).toBe(1200);
  });

  it("isMobileViewport flags below breakpoint", () => {
    expect(isMobileViewport({ width: 360, height: 640 })).toBe(true);
    expect(isMobileViewport({ width: 1280, height: 800 })).toBe(false);
  });
});

describe("pickAnchor", () => {
  it("picks bottom_right on mobile", () => {
    const a = pickAnchor({
      target: { left: 100, top: 100, width: 200, height: 100 },
      viewport: { width: 360, height: 640 }
    });
    expect(a).toBe("bottom_right");
  });

  it("picks right_section_top when target is top-left", () => {
    const a = pickAnchor({
      target: { left: 100, top: 100, width: 200, height: 100 },
      viewport: desktop
    });
    expect(a).toBe("right_section_top");
  });

  it("picks right_section_bottom when target is bottom-left", () => {
    const a = pickAnchor({
      target: { left: 100, top: 600, width: 200, height: 100 },
      viewport: desktop
    });
    expect(a).toBe("right_section_bottom");
  });

  it("picks left_anchor when target is on the right half", () => {
    const a = pickAnchor({
      target: { left: 900, top: 200, width: 200, height: 100 },
      viewport: desktop
    });
    expect(a).toBe("left_anchor");
  });
});

describe("computeMoveDuration", () => {
  it("clamps to [600, 900] regardless of distance", () => {
    expect(computeMoveDuration(0)).toBe(600);
    expect(computeMoveDuration(2000)).toBe(900);
    expect(computeMoveDuration(1200)).toBe(720);
  });
});

describe("computeTilt", () => {
  it("returns -8 when target is to the right of avatar", () => {
    expect(computeTilt({ x: 100, y: 100 }, { x: 500, y: 100 })).toBe(-8);
  });
  it("returns +8 when target is to the left", () => {
    expect(computeTilt({ x: 500, y: 100 }, { x: 100, y: 100 })).toBe(8);
  });
});

describe("computeAnchorDistance", () => {
  it("computes pythagorean distance between two anchors on desktop", () => {
    const d = computeAnchorDistance("hero_center", "right_anchor", desktop);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(2000);
  });
});

describe("pickBubblePosition", () => {
  it("prefers right when target is to the left of avatar", () => {
    const p = pickBubblePosition({
      avatar: { left: 700, top: 380, right: 736, bottom: 416 },
      bubbleSize: { w: 280, h: 100 },
      viewport: desktop,
      target: { left: 100, top: 200, width: 100, height: 80 }
    });
    expect(p).toBe("right");
  });

  it("falls back to top when neither side has room and target is unset", () => {
    const p = pickBubblePosition({
      avatar: { left: 600, top: 400, right: 640, bottom: 440 },
      bubbleSize: { w: 280, h: 100 },
      viewport: desktop
    });
    expect(p).toBe("top");
  });
});

import { describe, expect, it } from "vitest";
import {
  computeAnticipationOffset,
  computeMotionDistance,
  computeMoveProfile,
  computePathControlPoint,
  computeScrollLagOffset,
  computeSettleOffset
} from "./motion";

describe("motion polish helpers", () => {
  it("returns distance-aware speed profiles within the choreography duration contract", () => {
    expect(computeMoveProfile(80)).toMatchObject({
      name: "short",
      durationMs: 600,
      stiffness: 240,
      damping: 24
    });
    expect(computeMoveProfile(600)).toMatchObject({
      name: "standard",
      durationMs: 600,
      stiffness: 180,
      damping: 22
    });
    expect(computeMoveProfile(1400)).toMatchObject({
      name: "long",
      durationMs: 840,
      stiffness: 150,
      damping: 24
    });
  });

  it("computes point distance for runtime anchor transitions", () => {
    expect(computeMotionDistance({ x: 10, y: 20 }, { x: 40, y: 60 })).toBe(50);
  });

  it("leans away from the target before moving and settles slightly above the final point", () => {
    expect(
      computeAnticipationOffset({ x: 100, y: 100 }, { x: 500, y: 120 })
    ).toEqual({ x: -6, y: 0 });
    expect(
      computeAnticipationOffset({ x: 500, y: 100 }, { x: 100, y: 80 })
    ).toEqual({ x: 6, y: 0 });
    expect(computeSettleOffset()).toEqual({ x: 0, y: -2 });
  });

  it("curves the transition path instead of using a straight midpoint", () => {
    const control = computePathControlPoint(
      { x: 80, y: 580 },
      { x: 1200, y: 300 }
    );

    expect(control.x).toBe(640);
    expect(control.y).toBeLessThan((580 + 300) / 2);
  });

  it("damps scroll lag to a small bounded offset", () => {
    expect(computeScrollLagOffset(120)).toBe(18);
    expect(computeScrollLagOffset(-500)).toBe(-36);
    expect(computeScrollLagOffset(1200)).toBe(36);
  });
});

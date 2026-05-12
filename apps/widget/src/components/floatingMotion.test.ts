import { describe, expect, it } from "vitest";
import {
  SPEECH_FLOAT_AMPLITUDE_PX,
  SPEECH_FLOAT_ANIMATE,
  SPEECH_FLOAT_TRANSITION
} from "./floatingMotion";

describe("speech bubble floating motion", () => {
  it("loops through neutral keyframes instead of jumping from bottom to top", () => {
    expect(SPEECH_FLOAT_ANIMATE.y).toEqual([
      0,
      -SPEECH_FLOAT_AMPLITUDE_PX,
      0,
      SPEECH_FLOAT_AMPLITUDE_PX,
      0
    ]);
    expect(SPEECH_FLOAT_TRANSITION.repeat).toBe(Number.POSITIVE_INFINITY);
    expect(SPEECH_FLOAT_TRANSITION.repeatType).toBe("loop");
  });

  it("keeps the floating range subtle enough for speech content", () => {
    const range =
      Math.max(...SPEECH_FLOAT_ANIMATE.y) - Math.min(...SPEECH_FLOAT_ANIMATE.y);

    // Polish iteration 1 (2026-05-13): amplitude upweighted to 2.4px so the
    // breath actually registers. Mirror-loop range is now 4.8px, still well
    // inside the "subtle" envelope (<6px) so the pill never overshoots the
    // hero bubble crown.
    expect(range).toBeLessThanOrEqual(6);
    expect(SPEECH_FLOAT_TRANSITION.duration).toBeGreaterThanOrEqual(4.8);
  });

  it("upweights the scale breath so depth reads on screen", () => {
    const scaleRange =
      Math.max(...SPEECH_FLOAT_ANIMATE.scale) -
      Math.min(...SPEECH_FLOAT_ANIMATE.scale);

    // 2x the previous 0.003 amplitude — still ≤0.012 so the bubble never
    // visibly grows, only "breathes".
    expect(scaleRange).toBeGreaterThanOrEqual(0.005);
    expect(scaleRange).toBeLessThanOrEqual(0.012);
  });
});

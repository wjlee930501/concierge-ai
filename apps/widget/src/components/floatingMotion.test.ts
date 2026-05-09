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
      Math.max(...SPEECH_FLOAT_ANIMATE.y) -
      Math.min(...SPEECH_FLOAT_ANIMATE.y);

    expect(range).toBeLessThanOrEqual(3.2);
    expect(SPEECH_FLOAT_TRANSITION.duration).toBeGreaterThanOrEqual(4.8);
  });
});

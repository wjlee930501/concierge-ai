import { describe, expect, it } from "vitest";
import {
  SPEECH_FLOAT_AMPLITUDE_PX,
  SPEECH_FLOAT_ANIMATE,
  SPEECH_FLOAT_TRANSITION
} from "./floatingMotion";

describe("speech bubble floating motion", () => {
  it("mirrors between adjacent endpoints instead of resetting from bottom to top", () => {
    expect(SPEECH_FLOAT_ANIMATE.y).toEqual([
      -SPEECH_FLOAT_AMPLITUDE_PX,
      SPEECH_FLOAT_AMPLITUDE_PX
    ]);
    expect(SPEECH_FLOAT_TRANSITION.repeat).toBe(Number.POSITIVE_INFINITY);
    expect(SPEECH_FLOAT_TRANSITION.repeatType).toBe("mirror");
  });

  it("keeps the floating range subtle enough for speech content", () => {
    const range =
      Math.max(...SPEECH_FLOAT_ANIMATE.y) -
      Math.min(...SPEECH_FLOAT_ANIMATE.y);

    expect(range).toBeLessThanOrEqual(3.2);
    expect(SPEECH_FLOAT_TRANSITION.duration).toBeGreaterThanOrEqual(4.8);
  });
});

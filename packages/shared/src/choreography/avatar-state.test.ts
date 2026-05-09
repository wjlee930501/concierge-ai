import { describe, expect, it } from "vitest";
import {
  AVATAR_INITIAL_STATE,
  reduceAvatarState,
  tryReduceAvatarState
} from "./avatar-state";

describe("avatar-state machine", () => {
  it("starts at idle", () => {
    expect(AVATAR_INITIAL_STATE).toBe("idle");
  });

  it("walks the canonical loop idle → moving → pointing → talking → idle", () => {
    let s = AVATAR_INITIAL_STATE;
    s = tryReduceAvatarState(s, { type: "user-click" });
    expect(s).toBe("moving");
    s = tryReduceAvatarState(s, { type: "moving-arrived" });
    expect(s).toBe("pointing");
    s = tryReduceAvatarState(s, { type: "talking-start" });
    expect(s).toBe("talking");
    s = tryReduceAvatarState(s, { type: "talking-end" });
    expect(s).toBe("idle");
  });

  it("forbids talking → moving direct (must go via idle)", () => {
    const result = reduceAvatarState("talking", { type: "user-click" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("no-op-event");
  });

  it("forbids pointing → idle direct (must go via talking)", () => {
    const result = reduceAvatarState("pointing", { type: "talking-end" });
    expect(result.ok).toBe(false);
  });

  it("forbids moving → moving direct (queue handles re-entry)", () => {
    const result = reduceAvatarState("moving", { type: "user-click" });
    expect(result.ok).toBe(false);
  });

  it("cancel forces back to idle from any state", () => {
    expect(tryReduceAvatarState("moving", { type: "cancel" })).toBe("idle");
    expect(tryReduceAvatarState("pointing", { type: "cancel" })).toBe("idle");
    expect(tryReduceAvatarState("talking", { type: "cancel" })).toBe("idle");
  });

  it("timeout from talking returns to idle", () => {
    expect(tryReduceAvatarState("talking", { type: "timeout" })).toBe("idle");
  });
});

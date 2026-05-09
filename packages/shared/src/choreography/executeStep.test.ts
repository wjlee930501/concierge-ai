import { describe, expect, it } from "vitest";
import { executeStep, type ExecuteStepHooks, type PostMessagePayload } from "./executeStep";
import type {
  AnchorName,
  AvatarStateName,
  ChoreographyChoice,
  ChoreographyStep,
  ChoreographyTargetRect
} from "./types";

const baseStep: ChoreographyStep = {
  id: "step_demo",
  target_selector: "#section-demo",
  transition_hint: "함께 보러 가실까요?",
  popover: {
    message: "이 부분이 핵심이에요",
    choices: [
      { label: "다음", next: "step_case" },
      { label: "그만", next: "exit" }
    ]
  }
};

function makeHooks(): {
  readonly hooks: ExecuteStepHooks;
  readonly stateLog: AvatarStateName[];
  readonly anchorLog: AnchorName[];
  readonly postLog: PostMessagePayload[];
  readonly tiltLog: number[];
  readonly choicesLog: readonly ChoreographyChoice[][];
  readonly bubbleVisibility: boolean[];
} {
  const stateLog: AvatarStateName[] = [];
  const anchorLog: AnchorName[] = [];
  const postLog: PostMessagePayload[] = [];
  const tiltLog: number[] = [];
  const choicesLog: ChoreographyChoice[][] = [];
  const bubbleVisibility: boolean[] = [];
  const targetRect: ChoreographyTargetRect = {
    left: 100,
    top: 100,
    width: 300,
    height: 200
  };
  const hooks: ExecuteStepHooks = {
    setAvatarState: (s) => stateLog.push(s),
    setBubbleMessage: () => {},
    setBubbleVisible: (v) => bubbleVisibility.push(v),
    setCurrentAnchor: (a) => anchorLog.push(a),
    setTilt: (t) => tiltLog.push(t),
    setChoices: (c) => choicesLog.push([...c]),
    postToHost: (p) => postLog.push(p),
    queryHostRect: async () => targetRect,
    enterConversationMode: () => {}
  };
  return { hooks, stateLog, anchorLog, postLog, tiltLog, choicesLog, bubbleVisibility };
}

describe("executeStep", () => {
  it("walks talking → moving → pointing → talking with proper postMessages", async () => {
    const env = makeHooks();
    const result = await executeStep(baseStep, {
      viewport: { width: 1280, height: 800 },
      currentAnchor: "hero_center",
      hooks: env.hooks,
      wait: async () => {}
    });
    expect(result.outcome).toBe("completed");
    expect(env.stateLog).toEqual(["talking", "moving", "pointing", "talking"]);
    expect(env.postLog.map((p) => p.type)).toEqual([
      "concierge:scroll_to",
      "concierge:driver_highlight"
    ]);
    expect(env.choicesLog[0]).toHaveLength(2);
  });

  it("falls back to conversation mode when target is not found", async () => {
    const env = makeHooks();
    const noRect: ExecuteStepHooks = {
      ...env.hooks,
      queryHostRect: async () => null
    };
    const result = await executeStep(baseStep, {
      viewport: { width: 1280, height: 800 },
      currentAnchor: "hero_center",
      hooks: noRect,
      wait: async () => {}
    });
    expect(result.outcome).toBe("conversation-fallback");
  });

  it("respects preferred_anchor when provided", async () => {
    const env = makeHooks();
    const stepWithPref: ChoreographyStep = {
      ...baseStep,
      preferred_anchor: "top_center"
    };
    await executeStep(stepWithPref, {
      viewport: { width: 1280, height: 800 },
      currentAnchor: "hero_center",
      hooks: env.hooks,
      wait: async () => {}
    });
    expect(env.anchorLog).toEqual(["top_center"]);
  });

  it("uses explicit pointing_tilt over auto computation", async () => {
    const env = makeHooks();
    const stepWithTilt: ChoreographyStep = {
      ...baseStep,
      pointing_tilt: -12
    };
    await executeStep(stepWithTilt, {
      viewport: { width: 1280, height: 800 },
      currentAnchor: "hero_center",
      hooks: env.hooks,
      wait: async () => {}
    });
    expect(env.tiltLog).toEqual([-12]);
  });
});

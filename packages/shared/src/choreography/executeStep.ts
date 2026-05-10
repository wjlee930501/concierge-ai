// CURATION_CHOREOGRAPHY_SPEC §5 — Choreography Orchestrator.
// 본 함수는 한 step의 timeline을 책임진다. postMessage 발송은 hooks를 통해 외부 의존을
// 주입받아 unit test에서 mock 가능. UI rendering은 hooks의 setter들이 처리한다.

import type {
  AnchorName,
  AnchorViewport,
  AvatarExpressionName,
  ChoreographyChoice,
  ChoreographyBeat,
  ChoreographyStep,
  ChoreographyTargetRect,
  AvatarStateName
} from "./types";
import {
  anchorToPoint,
  computeAnchorDistance,
  computeMoveDuration,
  computeTilt,
  pickAnchor
} from "./anchors";

export type PostMessagePayload =
  | {
      readonly type: "concierge:scroll_to";
      readonly payload: {
        readonly selector: string;
        readonly behavior: "smooth" | "instant";
        readonly block: "start" | "center" | "end";
      };
    }
  | {
      readonly type: "concierge:driver_highlight";
      readonly payload: {
        readonly selector: string;
        readonly padding: number;
        readonly radius: number;
        readonly color: string;
      };
    }
  | {
      readonly type: "concierge:driver_clear";
      readonly payload: Record<string, never>;
    }
  | {
      readonly type: "concierge:rect_query";
      readonly payload: {
        readonly selector: string;
        readonly request_id: string;
      };
    };

export type ExecuteStepHooks = {
  readonly setAvatarState: (state: AvatarStateName) => void;
  readonly setBubbleMessage: (msg: string | null) => void;
  readonly setBubbleVisible: (visible: boolean) => void;
  readonly setCurrentAnchor: (anchor: AnchorName) => void;
  readonly setTilt: (deg: number) => void;
  readonly setAvatarExpression?: (
    expression: AvatarExpressionName | null
  ) => void;
  readonly setChoices: (choices: readonly ChoreographyChoice[]) => void;
  readonly postToHost: (payload: PostMessagePayload) => void;
  readonly queryHostRect: (
    selector: string
  ) => Promise<ChoreographyTargetRect | null>;
  readonly enterConversationMode: (fallback?: string) => void;
};

export type ExecuteStepEnv = {
  readonly viewport: AnchorViewport;
  readonly currentAnchor: AnchorName;
  readonly hooks: ExecuteStepHooks;
  readonly reducedMotion?: boolean;
  readonly wait?: (ms: number) => Promise<void>;
};

export const EXECUTE_STEP_TIMINGS = {
  transitionHint: 250,
  bubbleFadeOut: 250,
  spotlightFadeIn: 400,
  typewriterPerChar: 60
} as const;

const realWait = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function executeStep(
  step: ChoreographyStep,
  env: ExecuteStepEnv
): Promise<{ readonly outcome: "completed" | "conversation-fallback" }> {
  const wait = env.wait ?? realWait;
  const { hooks } = env;
  const reducedMotion = env.reducedMotion === true;
  const waitFor = (ms: number): Promise<void> => wait(reducedMotion ? 0 : ms);
  const microBeats = step.beats ?? [];

  // T+0ms — bouncing/talking + transition hint
  hooks.postToHost({
    type: "concierge:driver_clear",
    payload: {}
  });
  hooks.setAvatarState("talking");
  if (step.transition_hint !== undefined) {
    hooks.setBubbleMessage(step.transition_hint);
  }
  await waitFor(EXECUTE_STEP_TIMINGS.transitionHint);

  // T+250ms — bubble fade-out + rect query
  hooks.setBubbleVisible(false);
  const targetRect = await hooks.queryHostRect(step.target_selector);
  if (targetRect === null) {
    hooks.enterConversationMode(step.fallback_message);
    return { outcome: "conversation-fallback" };
  }
  await waitFor(EXECUTE_STEP_TIMINGS.bubbleFadeOut);

  // T+500ms — host scroll + Avatar moving
  hooks.postToHost({
    type: "concierge:scroll_to",
    payload: {
      selector: step.target_selector,
      behavior: reducedMotion ? "instant" : "smooth",
      block: "center"
    }
  });

  const newAnchor =
    step.preferred_anchor ??
    pickAnchor({ target: targetRect, viewport: env.viewport });
  hooks.setAvatarState("moving");
  hooks.setCurrentAnchor(newAnchor);

  const distance = computeAnchorDistance(
    env.currentAnchor,
    newAnchor,
    env.viewport
  );
  const moveDuration = computeMoveDuration(distance);
  await waitFor(moveDuration);

  // T+1100~1400ms — pointing
  hooks.setAvatarState("pointing");
  const avatarPoint = anchorToPoint(newAnchor, env.viewport);
  const targetCenter = {
    x: targetRect.left + targetRect.width / 2,
    y: targetRect.top + targetRect.height / 2
  };
  const tilt = reducedMotion
    ? 0
    : step.pointing_tilt === undefined || step.pointing_tilt === "auto"
      ? computeTilt(avatarPoint, targetCenter)
      : step.pointing_tilt;
  hooks.setTilt(tilt);

  hooks.postToHost({
    type: "concierge:driver_highlight",
    payload: {
      selector: step.target_selector,
      padding: 12,
      radius: 8,
      color: "rgba(26, 86, 219, 0.25)"
    }
  });
  await waitFor(EXECUTE_STEP_TIMINGS.spotlightFadeIn);

  if (microBeats.length > 0) {
    let beatAnchor = newAnchor;
    for (const beat of microBeats) {
      const result = await executeBeat(beat, {
        currentAnchor: beatAnchor,
        reducedMotion,
        viewport: env.viewport,
        waitFor,
        hooks
      });
      if (result.outcome === "conversation-fallback") {
        return { outcome: result.outcome };
      }
      beatAnchor = result.currentAnchor;
    }
  }

  // T+1500~1800ms — talking
  hooks.setAvatarState("talking");
  hooks.setBubbleMessage(step.popover.message);
  hooks.setBubbleVisible(true);
  await waitFor(
    step.popover.message.length * EXECUTE_STEP_TIMINGS.typewriterPerChar
  );

  // After typewriter — choices
  hooks.setChoices(step.popover.choices);
  return { outcome: "completed" };
}

async function executeBeat(
  beat: ChoreographyBeat,
  env: {
    readonly currentAnchor: AnchorName;
    readonly reducedMotion: boolean;
    readonly viewport: AnchorViewport;
    readonly hooks: ExecuteStepHooks;
    readonly waitFor: (ms: number) => Promise<void>;
  }
): Promise<
  | { readonly outcome: "completed"; readonly currentAnchor: AnchorName }
  | {
      readonly outcome: "conversation-fallback";
      readonly currentAnchor: AnchorName;
    }
> {
  const selector = beat.selector;
  const hooks = env.hooks;
  let targetRect: ChoreographyTargetRect | null = null;
  let elapsedMs = 0;

  if (beat.expression !== undefined) {
    hooks.setAvatarExpression?.(beat.expression);
  }

  if (selector !== undefined) {
    targetRect = await hooks.queryHostRect(selector);
    if (targetRect === null) {
      hooks.enterConversationMode();
      return {
        outcome: "conversation-fallback",
        currentAnchor: env.currentAnchor
      };
    }
    if (beat.scroll !== false) {
      hooks.postToHost({
        type: "concierge:scroll_to",
        payload: {
          selector,
          behavior: env.reducedMotion ? "instant" : "smooth",
          block: "center"
        }
      });
    }
  }

  if (beat.anchor !== undefined) {
    hooks.setAvatarState("moving");
    hooks.setCurrentAnchor(beat.anchor);
    const moveDuration = computeMoveDuration(
      computeAnchorDistance(env.currentAnchor, beat.anchor, env.viewport)
    );
    await env.waitFor(moveDuration);
    elapsedMs += moveDuration;
  }

  if (selector !== undefined && beat.highlight !== false) {
    hooks.setAvatarState("pointing");
    const anchor = beat.anchor ?? env.currentAnchor;
    const avatarPoint = anchorToPoint(anchor, env.viewport);
    const targetCenter =
      targetRect === null
        ? avatarPoint
        : {
            x: targetRect.left + targetRect.width / 2,
            y: targetRect.top + targetRect.height / 2
          };
    hooks.setTilt(
      env.reducedMotion
        ? 0
        : beat.tilt === undefined || beat.tilt === "auto"
          ? computeTilt(avatarPoint, targetCenter)
          : beat.tilt
    );
    hooks.postToHost({
      type: "concierge:driver_highlight",
      payload: {
        selector,
        padding: 12,
        radius: 8,
        color: "rgba(26, 86, 219, 0.25)"
      }
    });
    await env.waitFor(EXECUTE_STEP_TIMINGS.spotlightFadeIn);
    elapsedMs += EXECUTE_STEP_TIMINGS.spotlightFadeIn;
  }

  if (beat.message !== undefined) {
    hooks.setAvatarState("talking");
    hooks.setBubbleMessage(beat.message);
    hooks.setBubbleVisible(true);
    const speed =
      beat.typewriter_speed_ms ?? EXECUTE_STEP_TIMINGS.typewriterPerChar;
    const typewriterMs = beat.message.length * speed;
    await env.waitFor(typewriterMs);
    elapsedMs += typewriterMs;
  }

  await env.waitFor(Math.max(0, (beat.duration_ms ?? 3000) - elapsedMs));
  if (beat.pause_after_ms !== undefined) {
    await env.waitFor(beat.pause_after_ms);
  }
  return {
    outcome: "completed",
    currentAnchor: beat.anchor ?? env.currentAnchor
  };
}

// CURATION_CHOREOGRAPHY_SPEC §1.5 — Avatar 4 state machine + transition rules.
//
// 금지 전이:
// - Talking → Moving 직접 (반드시 Idle 거침)
// - Pointing → Idle 직접 (반드시 Talking 거침)
// - Moving 중 새 Moving (queue로 처리, 본 머신은 거부)
//
// 본 모듈은 pure reducer다. UI rendering, 시간, 큐는 위 layer가 책임진다.

import type { AvatarStateName } from "./types";

export const AVATAR_INITIAL_STATE: AvatarStateName = "idle";

export type AvatarStateEvent =
  | { readonly type: "user-click" }
  | { readonly type: "moving-arrived" }
  | { readonly type: "talking-start" }
  | { readonly type: "talking-end" }
  | { readonly type: "timeout" }
  | { readonly type: "cancel" };

export type AvatarStateTransitionResult =
  | { readonly ok: true; readonly next: AvatarStateName }
  | {
      readonly ok: false;
      readonly reason: "forbidden-transition" | "no-op-event";
    };

const TRANSITIONS: Readonly<
  Record<AvatarStateName, Partial<Record<AvatarStateEvent["type"], AvatarStateName>>>
> = {
  idle: {
    "user-click": "moving",
    cancel: "idle"
  },
  moving: {
    "moving-arrived": "pointing",
    cancel: "idle"
  },
  pointing: {
    "talking-start": "talking",
    cancel: "idle"
  },
  talking: {
    "talking-end": "idle",
    timeout: "idle",
    cancel: "idle"
  }
};

export function reduceAvatarState(
  state: AvatarStateName,
  event: AvatarStateEvent
): AvatarStateTransitionResult {
  const map = TRANSITIONS[state];
  const next = map[event.type];
  if (next === undefined) {
    return { ok: false, reason: "no-op-event" };
  }
  // SPEC §5.4 — cancel is an emergency exit that bypasses normal transition rules.
  if (event.type !== "cancel" && isForbiddenTransition(state, next)) {
    return { ok: false, reason: "forbidden-transition" };
  }
  return { ok: true, next };
}

export function tryReduceAvatarState(
  state: AvatarStateName,
  event: AvatarStateEvent
): AvatarStateName {
  const result = reduceAvatarState(state, event);
  return result.ok ? result.next : state;
}

function isForbiddenTransition(
  from: AvatarStateName,
  to: AvatarStateName
): boolean {
  if (from === "talking" && to === "moving") return true;
  if (from === "pointing" && to === "idle") return true;
  if (from === "moving" && to === "moving") return true;
  return false;
}

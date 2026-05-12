import {
  POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
  POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE,
  POST_MESSAGE_PARENT_SOURCE,
  POST_MESSAGE_WIDGET_SOURCE,
  createEnvelopeReplayGuard,
  createPostMessageEnvelope,
  generateNonce,
  validateOneOfKnownEnvelopes,
  type ChoreographyBeat,
  type ChoreographyStep,
  type ChoreographyTargetRect,
  type HostRectResponsePayload,
  type HostSectionNotFoundPayload,
  type PostMessagePayload,
  type PostMessageEnvelope,
  type PostMessageKnownType,
  type Scenario,
  type ScenarioBeat,
  type ScenarioStep
} from "@conciergeai/shared";
import { isDevBuild } from "./isDevBuild";

export function scenarioStepToChoreographyStep(
  step: ScenarioStep,
  scenario?: Scenario
): ChoreographyStep {
  const beats =
    scenario === undefined
      ? []
      : findStepBeats(scenario, step.id).map(scenarioBeatToChoreographyBeat);
  return {
    id: step.id,
    target_selector: step.spotlightTarget,
    transition_hint: step.popover.title,
    ...(beats.length > 0 ? { beats } : {}),
    popover: {
      message: step.popover.body,
      choices: step.choices.map((choice) => ({
        label: choice.label,
        next: choice.nextStepId ?? "lead_form"
      }))
    }
  };
}

function findStepBeats(
  scenario: Scenario,
  stepId: string
): readonly ScenarioBeat[] {
  const beats: ScenarioBeat[] = [];
  for (const chapter of scenario.chapters ?? []) {
    for (const section of chapter.sections) {
      if (section.stepId === stepId) beats.push(...section.beats);
    }
  }
  return beats;
}

function scenarioBeatToChoreographyBeat(beat: ScenarioBeat): ChoreographyBeat {
  const bubbleMessage = beat.bubbleMessage;
  const base = {
    id: beat.id,
    ...(beat.durationMs !== undefined ? { duration_ms: beat.durationMs } : {}),
    ...(bubbleMessage?.text !== undefined
      ? { message: bubbleMessage.text }
      : {}),
    ...(bubbleMessage?.typewriterSpeedMs !== undefined
      ? { typewriter_speed_ms: bubbleMessage.typewriterSpeedMs }
      : {}),
    ...(bubbleMessage?.pauseAfterMs !== undefined
      ? { pause_after_ms: bubbleMessage.pauseAfterMs }
      : {})
  } satisfies ChoreographyBeat;

  switch (beat.action.type) {
    case "scroll_to":
      return {
        ...base,
        selector: beat.action.selector,
        scroll: true,
        highlight: false
      };
    case "highlight":
      return {
        ...base,
        selector: beat.action.selector,
        ...(beat.action.durationMs !== undefined
          ? { duration_ms: beat.action.durationMs }
          : {}),
        scroll: false,
        highlight: true
      };
    case "move":
      return {
        ...base,
        anchor: beat.action.anchor,
        ...(beat.action.tilt !== undefined ? { tilt: beat.action.tilt } : {})
      };
    case "expression_change":
      return {
        ...base,
        expression: beat.action.expression
      };
    case "wait":
      return {
        ...base,
        duration_ms: beat.action.durationMs
      };
  }
}

export function createHostDriverEnvelope(input: {
  readonly payload: PostMessagePayload;
  readonly nonce: string;
  readonly timestamp?: number;
}): PostMessageEnvelope {
  const envelopeInput = {
    type: input.payload.type,
    nonce: input.nonce,
    source: POST_MESSAGE_WIDGET_SOURCE,
    payload: input.payload.payload
  };

  if (input.timestamp === undefined) {
    return createPostMessageEnvelope(envelopeInput);
  }

  return createPostMessageEnvelope({
    ...envelopeInput,
    timestamp: input.timestamp
  });
}

export function createHostDriverPost(input: {
  readonly targetWindow: Pick<Window, "postMessage">;
  readonly targetOrigin: string;
  readonly nonceFactory?: () => string;
}): (payload: PostMessagePayload) => void {
  return (payload) => {
    input.targetWindow.postMessage(
      createHostDriverEnvelope({
        payload,
        nonce: input.nonceFactory?.() ?? generateNonce()
      }),
      input.targetOrigin
    );
  };
}

export function createHostDriverBridge(input: {
  readonly targetWindow: Pick<Window, "postMessage">;
  readonly listenWindow: Pick<
    Window,
    "addEventListener" | "removeEventListener"
  >;
  readonly sourceWindow?: Window;
  readonly targetOrigin: string;
  readonly allowedOrigins: readonly string[];
  readonly nonceFactory?: () => string;
  readonly requestIdFactory?: () => string;
  readonly timeoutMs?: number;
  readonly onSectionNotFound?: (payload: HostSectionNotFoundPayload) => void;
  // Replay guard (nonce LRU + clock skew) is ON by default — fail-closed per
  // FINAL_ALIGNMENT §1. Production code must never set `disableReplayGuard`;
  // it exists only as a dev-mode escape hatch for fixtures with frozen
  // timestamps. The flag is ignored outside `import.meta.env.DEV`.
  readonly disableReplayGuard?: boolean;
  readonly maxNonces?: number;
  readonly maxClockSkewMs?: number;
}): {
  readonly postToHost: (payload: PostMessagePayload) => void;
  readonly queryHostRect: (
    selector: string
  ) => Promise<ChoreographyTargetRect | null>;
  readonly detach: () => void;
} {
  const postToHost = createHostDriverPost(input);
  const pending = new Map<
    string,
    {
      readonly resolve: (rect: ChoreographyTargetRect | null) => void;
      readonly timeout: ReturnType<typeof setTimeout>;
    }
  >();
  const replayGuardDisabled =
    input.disableReplayGuard === true && isDevBuild();
  const replayGuard = replayGuardDisabled
    ? null
    : createEnvelopeReplayGuard({
        ...(input.maxNonces !== undefined
          ? { maxNonces: input.maxNonces }
          : {}),
        ...(input.maxClockSkewMs !== undefined
          ? { maxClockSkewMs: input.maxClockSkewMs }
          : {})
      });

  const onMessage = (event: Event) => {
    if (!(event instanceof MessageEvent)) return;
    if (
      input.sourceWindow !== undefined &&
      event.source !== input.sourceWindow
    ) {
      return;
    }

    const envelope = validateHostResponse(event, input.allowedOrigins);
    if (envelope === null) return;

    if (replayGuard !== null) {
      // envelope here is the narrowed response type without nonce/timestamp;
      // pull them from the raw event data after re-validation.
      const raw = (event.data ?? {}) as {
        readonly nonce?: unknown;
        readonly timestamp?: unknown;
      };
      if (
        typeof raw.nonce !== "string" ||
        typeof raw.timestamp !== "number" ||
        !replayGuard.verify({ nonce: raw.nonce, timestamp: raw.timestamp }).ok
      ) {
        return;
      }
    }

    if (envelope.type === POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE) {
      input.onSectionNotFound?.(envelope.payload);
      return;
    }

    const payload = envelope.payload;
    const entry = pending.get(payload.request_id);
    if (entry === undefined) return;
    pending.delete(payload.request_id);
    clearTimeout(entry.timeout);
    entry.resolve(payload.rect);
  };

  input.listenWindow.addEventListener("message", onMessage);

  return {
    postToHost,
    queryHostRect(selector) {
      const requestId = input.requestIdFactory?.() ?? generateRequestId();
      return new Promise<ChoreographyTargetRect | null>((resolve) => {
        const timeout = setTimeout(() => {
          pending.delete(requestId);
          resolve(null);
        }, input.timeoutMs ?? 750);
        pending.set(requestId, { resolve, timeout });
        postToHost({
          type: "concierge:rect_query",
          payload: {
            selector,
            request_id: requestId
          }
        });
      });
    },
    detach() {
      input.listenWindow.removeEventListener("message", onMessage);
      for (const [requestId, entry] of pending) {
        pending.delete(requestId);
        clearTimeout(entry.timeout);
        entry.resolve(null);
      }
    }
  };
}

function validateHostResponse(
  event: MessageEvent,
  allowedOrigins: readonly string[]
):
  | {
      readonly type: typeof POST_MESSAGE_HOST_RECT_RESPONSE_TYPE;
      readonly payload: HostRectResponsePayload;
    }
  | {
      readonly type: typeof POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE;
      readonly payload: HostSectionNotFoundPayload;
    }
  | null {
  const responseTypes = [
    POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
    POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE
  ] as const satisfies readonly PostMessageKnownType[];

  const matched = validateOneOfKnownEnvelopes({
    value: event.data,
    origin: event.origin,
    allowedOrigins,
    expectedTypes: responseTypes
  });
  if (matched === null) return null;

  const envelope = matched.envelope;
  if (envelope.source !== POST_MESSAGE_PARENT_SOURCE) return null;

  if (matched.type === POST_MESSAGE_HOST_RECT_RESPONSE_TYPE) {
    return {
      type: POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
      payload: envelope.payload as HostRectResponsePayload
    };
  }
  return {
    type: POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE,
    payload: envelope.payload as HostSectionNotFoundPayload
  };
}

function generateRequestId(): string {
  return `rect-${generateNonce()}`;
}

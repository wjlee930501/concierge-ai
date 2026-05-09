import {
  POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
  POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE,
  POST_MESSAGE_PARENT_SOURCE,
  POST_MESSAGE_WIDGET_SOURCE,
  createPostMessageEnvelope,
  validateKnownPostMessageEnvelope,
  type ChoreographyStep,
  type ChoreographyTargetRect,
  type HostRectResponsePayload,
  type HostSectionNotFoundPayload,
  type PostMessagePayload,
  type PostMessageEnvelope,
  type PostMessageKnownType,
  type ScenarioStep
} from "@conciergeai/shared";

export function scenarioStepToChoreographyStep(
  step: ScenarioStep
): ChoreographyStep {
  return {
    id: step.id,
    target_selector: step.spotlightTarget,
    transition_hint: step.popover.title,
    popover: {
      message: step.popover.body,
      choices: step.choices.map((choice) => ({
        label: choice.label,
        next: choice.nextStepId ?? "lead_form"
      }))
    }
  };
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
  readonly listenWindow: Pick<Window, "addEventListener" | "removeEventListener">;
  readonly sourceWindow?: Window;
  readonly targetOrigin: string;
  readonly allowedOrigins: readonly string[];
  readonly nonceFactory?: () => string;
  readonly requestIdFactory?: () => string;
  readonly timeoutMs?: number;
  readonly onSectionNotFound?: (payload: HostSectionNotFoundPayload) => void;
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
  const responseTypes: readonly PostMessageKnownType[] = [
    POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
    POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE
  ];

  for (const expectedType of responseTypes) {
    try {
      const envelope = validateKnownPostMessageEnvelope(event.data, {
        origin: event.origin,
        allowedOrigins,
        expectedType
      });
      if (envelope.source !== POST_MESSAGE_PARENT_SOURCE) return null;
      if (envelope.type === POST_MESSAGE_HOST_RECT_RESPONSE_TYPE) {
        return {
          type: POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
          payload: envelope.payload as HostRectResponsePayload
        };
      }
      if (envelope.type !== POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE) {
        return null;
      }
      return {
        type: POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE,
        payload: envelope.payload as HostSectionNotFoundPayload
      };
    } catch {
      // Try the next known host response type, then fail closed.
    }
  }

  return null;
}

function generateNonce(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `widget-host-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function generateRequestId(): string {
  return `rect-${generateNonce()}`;
}

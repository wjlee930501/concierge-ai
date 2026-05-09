import { isOriginAllowed } from "./origin";

export const POST_MESSAGE_ENVELOPE_VERSION = 1 as const;
export const POST_MESSAGE_READY_TYPE = "concierge.embed.ready" as const;
export const POST_MESSAGE_HANDSHAKE_TYPE =
  "concierge.parent.handshake" as const;
export const POST_MESSAGE_RESIZE_TYPE = "concierge.widget.resize" as const;
export const POST_MESSAGE_HOST_SCROLL_TO_TYPE = "concierge:scroll_to" as const;
export const POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE =
  "concierge:driver_highlight" as const;
export const POST_MESSAGE_HOST_DRIVER_CLEAR_TYPE =
  "concierge:driver_clear" as const;
export const POST_MESSAGE_HOST_RECT_QUERY_TYPE = "concierge:rect_query" as const;
export const POST_MESSAGE_HOST_RECT_RESPONSE_TYPE =
  "concierge:rect_response" as const;
export const POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE =
  "concierge:section_not_found" as const;

export const POST_MESSAGE_EMBED_SOURCE = "concierge.embed" as const;
export const POST_MESSAGE_PARENT_SOURCE = "concierge.parent" as const;
export const POST_MESSAGE_WIDGET_SOURCE = "concierge.widget" as const;

export const POST_MESSAGE_ENVELOPE_KEYS = [
  "version",
  "type",
  "nonce",
  "timestamp",
  "source",
  "payload"
] as const;

export type PostMessageEnvelopeKey = (typeof POST_MESSAGE_ENVELOPE_KEYS)[number];

export type PostMessageEnvelope<
  TPayload = unknown,
  TType extends string = string
> = {
  readonly version: typeof POST_MESSAGE_ENVELOPE_VERSION;
  readonly type: TType;
  readonly nonce: string;
  readonly timestamp: number;
  readonly source: string;
  readonly payload: TPayload;
};

export type PostMessageKnownType =
  | typeof POST_MESSAGE_READY_TYPE
  | typeof POST_MESSAGE_HANDSHAKE_TYPE
  | typeof POST_MESSAGE_RESIZE_TYPE
  | typeof POST_MESSAGE_HOST_SCROLL_TO_TYPE
  | typeof POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE
  | typeof POST_MESSAGE_HOST_DRIVER_CLEAR_TYPE
  | typeof POST_MESSAGE_HOST_RECT_QUERY_TYPE
  | typeof POST_MESSAGE_HOST_RECT_RESPONSE_TYPE
  | typeof POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE;

export type ReadyMessagePayload = {
  readonly sandbox: string;
  readonly frameAncestors: readonly string[];
  readonly parentAccessPolicy: Record<string, unknown>;
};

export type HandshakeMessagePayload = {
  readonly targetSource: typeof POST_MESSAGE_EMBED_SOURCE;
};

export type ResizeMessagePayload = {
  readonly width: number;
  readonly height: number;
};

export type HostScrollToMessagePayload = {
  readonly selector: string;
  readonly behavior: "smooth" | "instant";
  readonly block: "start" | "center" | "end";
};

export type HostDriverHighlightMessagePayload = {
  readonly selector: string;
  readonly padding: number;
  readonly radius: number;
  readonly color: string;
};

export type HostDriverClearMessagePayload = Record<string, never>;

export type HostRectQueryMessagePayload = {
  readonly selector: string;
  readonly request_id: string;
};

export type HostRectResponsePayload = {
  readonly request_id: string;
  readonly rect: HostRectPayload | null;
  readonly viewport: {
    readonly w: number;
    readonly h: number;
  };
};

export type HostRectPayload = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

export type HostSectionNotFoundPayload = {
  readonly selector: string;
};

export type ReadyMessageEnvelope = PostMessageEnvelope<
  ReadyMessagePayload,
  typeof POST_MESSAGE_READY_TYPE
>;
export type HandshakeMessageEnvelope = PostMessageEnvelope<
  HandshakeMessagePayload,
  typeof POST_MESSAGE_HANDSHAKE_TYPE
>;
export type ResizeMessageEnvelope = PostMessageEnvelope<
  ResizeMessagePayload,
  typeof POST_MESSAGE_RESIZE_TYPE
>;
export type HostScrollToMessageEnvelope = PostMessageEnvelope<
  HostScrollToMessagePayload,
  typeof POST_MESSAGE_HOST_SCROLL_TO_TYPE
>;
export type HostDriverHighlightMessageEnvelope = PostMessageEnvelope<
  HostDriverHighlightMessagePayload,
  typeof POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE
>;
export type HostDriverClearMessageEnvelope = PostMessageEnvelope<
  HostDriverClearMessagePayload,
  typeof POST_MESSAGE_HOST_DRIVER_CLEAR_TYPE
>;
export type HostRectQueryMessageEnvelope = PostMessageEnvelope<
  HostRectQueryMessagePayload,
  typeof POST_MESSAGE_HOST_RECT_QUERY_TYPE
>;
export type HostRectResponseEnvelope = PostMessageEnvelope<
  HostRectResponsePayload,
  typeof POST_MESSAGE_HOST_RECT_RESPONSE_TYPE
>;
export type HostSectionNotFoundEnvelope = PostMessageEnvelope<
  HostSectionNotFoundPayload,
  typeof POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE
>;

export type KnownPostMessageEnvelope =
  | ReadyMessageEnvelope
  | HandshakeMessageEnvelope
  | ResizeMessageEnvelope
  | HostScrollToMessageEnvelope
  | HostDriverHighlightMessageEnvelope
  | HostDriverClearMessageEnvelope
  | HostRectQueryMessageEnvelope
  | HostRectResponseEnvelope
  | HostSectionNotFoundEnvelope;

export type PostMessageValidationContext = {
  readonly origin: string;
  readonly allowedOrigins: readonly string[];
  readonly expectedType?: PostMessageKnownType;
  readonly expectedNonce?: string;
};

type EnvelopeRecord = Record<PostMessageEnvelopeKey, unknown>;

export function createPostMessageEnvelope<
  TPayload,
  TType extends string
>(input: {
  readonly type: TType;
  readonly nonce: string;
  readonly timestamp?: number;
  readonly source: string;
  readonly payload: TPayload;
}): PostMessageEnvelope<TPayload, TType> {
  return {
    version: POST_MESSAGE_ENVELOPE_VERSION,
    type: input.type,
    nonce: input.nonce,
    timestamp: input.timestamp ?? Date.now(),
    source: input.source,
    payload: input.payload
  };
}

export function isPostMessageEnvelope(
  value: unknown
): value is PostMessageEnvelope {
  if (!hasExactEnvelopeKeys(value)) {
    return false;
  }

  return (
    value.version === POST_MESSAGE_ENVELOPE_VERSION &&
    isNonEmptyString(value.type) &&
    isNonEmptyString(value.nonce) &&
    typeof value.timestamp === "number" &&
    Number.isFinite(value.timestamp) &&
    value.timestamp > 0 &&
    isNonEmptyString(value.source) &&
    value.payload !== undefined
  );
}

export function validatePostMessageEnvelope(
  value: unknown
): PostMessageEnvelope {
  if (!isPostMessageEnvelope(value)) {
    throw new Error("Invalid Concierge postMessage envelope");
  }

  return value;
}

export function validateKnownPostMessageEnvelope(
  value: unknown,
  context: PostMessageValidationContext
): KnownPostMessageEnvelope {
  const envelope = validatePostMessageEnvelope(value);

  if (!isOriginInAllowlist(context.origin, context.allowedOrigins)) {
    throw new Error("Invalid Concierge postMessage origin");
  }

  if (
    context.expectedType !== undefined &&
    envelope.type !== context.expectedType
  ) {
    throw new Error("Invalid Concierge postMessage type");
  }

  if (
    context.expectedNonce !== undefined &&
    envelope.nonce !== context.expectedNonce
  ) {
    throw new Error("Invalid Concierge postMessage nonce");
  }

  switch (envelope.type) {
    case POST_MESSAGE_READY_TYPE:
      if (
        envelope.source !== POST_MESSAGE_EMBED_SOURCE ||
        !isReadyPayload(envelope.payload)
      ) {
        throw new Error("Invalid Concierge ready postMessage");
      }
      return envelope as ReadyMessageEnvelope;
    case POST_MESSAGE_HANDSHAKE_TYPE:
      if (
        envelope.source !== POST_MESSAGE_PARENT_SOURCE ||
        !isHandshakePayload(envelope.payload)
      ) {
        throw new Error("Invalid Concierge handshake postMessage");
      }
      return envelope as HandshakeMessageEnvelope;
    case POST_MESSAGE_RESIZE_TYPE:
      if (
        envelope.source !== POST_MESSAGE_WIDGET_SOURCE ||
        !isResizePayload(envelope.payload)
      ) {
        throw new Error("Invalid Concierge resize postMessage");
      }
      return envelope as ResizeMessageEnvelope;
    case POST_MESSAGE_HOST_SCROLL_TO_TYPE:
      if (
        envelope.source !== POST_MESSAGE_WIDGET_SOURCE ||
        !isHostScrollToPayload(envelope.payload)
      ) {
        throw new Error("Invalid Concierge host-driver postMessage");
      }
      return envelope as HostScrollToMessageEnvelope;
    case POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE:
      if (
        envelope.source !== POST_MESSAGE_WIDGET_SOURCE ||
        !isHostDriverHighlightPayload(envelope.payload)
      ) {
        throw new Error("Invalid Concierge host-driver postMessage");
      }
      return envelope as HostDriverHighlightMessageEnvelope;
    case POST_MESSAGE_HOST_DRIVER_CLEAR_TYPE:
      if (
        envelope.source !== POST_MESSAGE_WIDGET_SOURCE ||
        !isEmptyRecord(envelope.payload)
      ) {
        throw new Error("Invalid Concierge host-driver postMessage");
      }
      return envelope as HostDriverClearMessageEnvelope;
    case POST_MESSAGE_HOST_RECT_QUERY_TYPE:
      if (
        envelope.source !== POST_MESSAGE_WIDGET_SOURCE ||
        !isHostRectQueryPayload(envelope.payload)
      ) {
        throw new Error("Invalid Concierge host-driver postMessage");
      }
      return envelope as HostRectQueryMessageEnvelope;
    case POST_MESSAGE_HOST_RECT_RESPONSE_TYPE:
      if (
        envelope.source !== POST_MESSAGE_PARENT_SOURCE ||
        !isHostRectResponsePayload(envelope.payload)
      ) {
        throw new Error("Invalid Concierge host response postMessage");
      }
      return envelope as HostRectResponseEnvelope;
    case POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE:
      if (
        envelope.source !== POST_MESSAGE_PARENT_SOURCE ||
        !isHostSectionNotFoundPayload(envelope.payload)
      ) {
        throw new Error("Invalid Concierge host response postMessage");
      }
      return envelope as HostSectionNotFoundEnvelope;
    default:
      throw new Error("Unknown Concierge postMessage type");
  }
}

export function isKnownPostMessageEnvelope(
  value: unknown,
  context: PostMessageValidationContext
): value is KnownPostMessageEnvelope {
  try {
    validateKnownPostMessageEnvelope(value, context);
    return true;
  } catch {
    return false;
  }
}

function hasExactEnvelopeKeys(value: unknown): value is EnvelopeRecord {
  if (!isRecord(value)) {
    return false;
  }

  const keys = Object.keys(value);

  return (
    keys.length === POST_MESSAGE_ENVELOPE_KEYS.length &&
    POST_MESSAGE_ENVELOPE_KEYS.every((key) =>
      Object.prototype.hasOwnProperty.call(value, key)
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOriginInAllowlist(
  origin: string,
  allowedOrigins: readonly string[]
): boolean {
  return isNonEmptyString(origin) && isOriginAllowed(origin, allowedOrigins);
}

function isReadyPayload(value: unknown): value is ReadyMessagePayload {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNonEmptyString(value.sandbox) &&
    Array.isArray(value.frameAncestors) &&
    value.frameAncestors.every(isNonEmptyString) &&
    isRecord(value.parentAccessPolicy)
  );
}

function isHandshakePayload(value: unknown): value is HandshakeMessagePayload {
  return isRecord(value) && value.targetSource === POST_MESSAGE_EMBED_SOURCE;
}

function isResizePayload(value: unknown): value is ResizeMessagePayload {
  return (
    isRecord(value) &&
    typeof value.width === "number" &&
    Number.isFinite(value.width) &&
    value.width > 0 &&
    typeof value.height === "number" &&
    Number.isFinite(value.height) &&
    value.height > 0
  );
}

function isHostScrollToPayload(
  value: unknown
): value is HostScrollToMessagePayload {
  return (
    isRecord(value) &&
    isNonEmptyString(value.selector) &&
    (value.behavior === "smooth" || value.behavior === "instant") &&
    (value.block === "start" ||
      value.block === "center" ||
      value.block === "end")
  );
}

function isHostDriverHighlightPayload(
  value: unknown
): value is HostDriverHighlightMessagePayload {
  return (
    isRecord(value) &&
    isNonEmptyString(value.selector) &&
    isNonNegativeFiniteNumber(value.padding) &&
    isNonNegativeFiniteNumber(value.radius) &&
    isNonEmptyString(value.color)
  );
}

function isHostRectQueryPayload(
  value: unknown
): value is HostRectQueryMessagePayload {
  return (
    isRecord(value) &&
    isNonEmptyString(value.selector) &&
    isNonEmptyString(value.request_id)
  );
}

function isHostRectResponsePayload(
  value: unknown
): value is HostRectResponsePayload {
  return (
    isRecord(value) &&
    isNonEmptyString(value.request_id) &&
    (value.rect === null || isHostRectPayload(value.rect)) &&
    isRecord(value.viewport) &&
    isPositiveFiniteNumber(value.viewport.w) &&
    isPositiveFiniteNumber(value.viewport.h)
  );
}

function isHostRectPayload(value: unknown): value is HostRectPayload {
  return (
    isRecord(value) &&
    isFiniteNumber(value.left) &&
    isFiniteNumber(value.top) &&
    isNonNegativeFiniteNumber(value.width) &&
    isNonNegativeFiniteNumber(value.height)
  );
}

function isHostSectionNotFoundPayload(
  value: unknown
): value is HostSectionNotFoundPayload {
  return isRecord(value) && isNonEmptyString(value.selector);
}

function isEmptyRecord(value: unknown): value is Record<string, never> {
  return isRecord(value) && Object.keys(value).length === 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

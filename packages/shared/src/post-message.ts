import { isOriginAllowed } from "./origin";

export const POST_MESSAGE_ENVELOPE_VERSION = 1 as const;
export const POST_MESSAGE_READY_TYPE = "concierge.embed.ready" as const;
export const POST_MESSAGE_HANDSHAKE_TYPE =
  "concierge.parent.handshake" as const;
export const POST_MESSAGE_RESIZE_TYPE = "concierge.widget.resize" as const;

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
  | typeof POST_MESSAGE_RESIZE_TYPE;

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

export type KnownPostMessageEnvelope =
  | ReadyMessageEnvelope
  | HandshakeMessageEnvelope
  | ResizeMessageEnvelope;

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
  return (
    isRecord(value) &&
    value.targetSource === POST_MESSAGE_EMBED_SOURCE
  );
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

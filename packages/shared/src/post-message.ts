export const POST_MESSAGE_ENVELOPE_VERSION = 1 as const;

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

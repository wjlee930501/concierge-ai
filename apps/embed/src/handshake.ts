import {
  type PostMessageEnvelope,
  isPostMessageEnvelope
} from "@conciergeai/shared";
import { EMBED_READY_MESSAGE_TYPE, EMBED_RUNTIME_SOURCE } from "./runtime";

export const EMBED_HANDSHAKE_ACK_TYPE =
  "concierge.embed.handshake_ack" as const;
export const EMBED_PARENT_SOURCE = "concierge.parent" as const;

export type HandshakeAckPayload = {
  readonly accepted: boolean;
};

export type HandshakeState =
  | { readonly phase: "idle" }
  | { readonly phase: "ready_sent"; readonly nonce: string }
  | { readonly phase: "completed"; readonly nonce: string }
  | { readonly phase: "rejected"; readonly nonce: string };

export function createInitialHandshakeState(): HandshakeState {
  return { phase: "idle" };
}

export function markReadySent(nonce: string): HandshakeState {
  if (nonce.trim().length === 0) {
    throw new Error("Handshake nonce must not be empty");
  }

  return { phase: "ready_sent", nonce };
}

export function processHandshakeAck(
  state: HandshakeState,
  envelope: unknown
): HandshakeState {
  if (state.phase !== "ready_sent") {
    return state;
  }

  if (!isPostMessageEnvelope(envelope)) {
    return state;
  }

  if (envelope.type !== EMBED_HANDSHAKE_ACK_TYPE) {
    return state;
  }

  if (envelope.nonce !== state.nonce) {
    return state;
  }

  const payload = envelope.payload as Record<string, unknown>;

  if (typeof payload !== "object" || payload === null) {
    return state;
  }

  if (payload["accepted"] === true) {
    return { phase: "completed", nonce: state.nonce };
  }

  return { phase: "rejected", nonce: state.nonce };
}

export function isHandshakeComplete(state: HandshakeState): boolean {
  return state.phase === "completed";
}

export type IncomingEnvelopeValidation = {
  readonly valid: boolean;
  readonly envelope: PostMessageEnvelope | null;
  readonly reason: string;
};

export function validateIncomingEnvelope(
  data: unknown,
  expected: {
    readonly expectedTypes: readonly string[];
    readonly expectedNonce?: string;
  }
): IncomingEnvelopeValidation {
  if (!isPostMessageEnvelope(data)) {
    return { valid: false, envelope: null, reason: "not_envelope" };
  }

  if (!expected.expectedTypes.includes(data.type)) {
    return { valid: false, envelope: data, reason: "unexpected_type" };
  }

  if (
    expected.expectedNonce !== undefined &&
    data.nonce !== expected.expectedNonce
  ) {
    return { valid: false, envelope: data, reason: "nonce_mismatch" };
  }

  return { valid: true, envelope: data, reason: "ok" };
}

export function createHandshakeAckEnvelope(input: {
  readonly nonce: string;
  readonly accepted: boolean;
  readonly timestamp?: number;
}): PostMessageEnvelope<HandshakeAckPayload, typeof EMBED_HANDSHAKE_ACK_TYPE> {
  return {
    version: 1,
    type: EMBED_HANDSHAKE_ACK_TYPE,
    nonce: input.nonce,
    timestamp: input.timestamp ?? Date.now(),
    source: EMBED_PARENT_SOURCE,
    payload: { accepted: input.accepted }
  };
}

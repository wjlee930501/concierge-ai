import { describe, expect, it } from "vitest";
import { validatePostMessageEnvelope } from "@conciergeai/shared";
import {
  EMBED_HANDSHAKE_ACK_TYPE,
  EMBED_PARENT_SOURCE,
  createHandshakeAckEnvelope,
  createInitialHandshakeState,
  isHandshakeComplete,
  markReadySent,
  processHandshakeAck,
  validateIncomingEnvelope
} from "./handshake";
import { createEmbedRuntime, EMBED_READY_MESSAGE_TYPE } from "./runtime";

describe("handshake flow", () => {
  describe("state machine", () => {
    it("starts in idle phase", () => {
      const state = createInitialHandshakeState();

      expect(state.phase).toBe("idle");
    });

    it("transitions to ready_sent with a nonce", () => {
      const state = markReadySent("nonce-abc");

      expect(state).toEqual({ phase: "ready_sent", nonce: "nonce-abc" });
    });

    it("rejects empty nonce", () => {
      expect(() => markReadySent("")).toThrow(/empty/u);
      expect(() => markReadySent("  ")).toThrow(/empty/u);
    });

    it("completes handshake when ack matches nonce and accepted=true", () => {
      const readyState = markReadySent("nonce-123");
      const ack = createHandshakeAckEnvelope({
        nonce: "nonce-123",
        accepted: true,
        timestamp: 1_714_000_000_000
      });
      const result = processHandshakeAck(readyState, ack);

      expect(result).toEqual({ phase: "completed", nonce: "nonce-123" });
      expect(isHandshakeComplete(result)).toBe(true);
    });

    it("rejects handshake when accepted=false", () => {
      const readyState = markReadySent("nonce-reject");
      const ack = createHandshakeAckEnvelope({
        nonce: "nonce-reject",
        accepted: false,
        timestamp: 1_714_000_000_000
      });
      const result = processHandshakeAck(readyState, ack);

      expect(result).toEqual({ phase: "rejected", nonce: "nonce-reject" });
      expect(isHandshakeComplete(result)).toBe(false);
    });

    it("ignores ack with mismatched nonce", () => {
      const readyState = markReadySent("nonce-a");
      const ack = createHandshakeAckEnvelope({
        nonce: "nonce-b",
        accepted: true,
        timestamp: 1_714_000_000_000
      });
      const result = processHandshakeAck(readyState, ack);

      expect(result).toBe(readyState);
    });

    it("ignores ack when state is not ready_sent", () => {
      const idleState = createInitialHandshakeState();
      const ack = createHandshakeAckEnvelope({
        nonce: "nonce-1",
        accepted: true,
        timestamp: 1_714_000_000_000
      });
      const result = processHandshakeAck(idleState, ack);

      expect(result).toBe(idleState);
    });

    it("ignores non-envelope data", () => {
      const readyState = markReadySent("nonce-1");
      const result = processHandshakeAck(readyState, { garbage: true });

      expect(result).toBe(readyState);
    });

    it("ignores envelopes with wrong type", () => {
      const readyState = markReadySent("nonce-1");
      const wrongType = {
        version: 1,
        type: "some.other.type",
        nonce: "nonce-1",
        timestamp: 1_714_000_000_000,
        source: EMBED_PARENT_SOURCE,
        payload: { accepted: true }
      };
      const result = processHandshakeAck(readyState, wrongType);

      expect(result).toBe(readyState);
    });
  });

  describe("createHandshakeAckEnvelope", () => {
    it("creates a valid 6-field envelope", () => {
      const ack = createHandshakeAckEnvelope({
        nonce: "nonce-valid",
        accepted: true,
        timestamp: 1_714_000_000_000
      });

      expect(validatePostMessageEnvelope(ack)).toBe(ack);
      expect(ack.type).toBe(EMBED_HANDSHAKE_ACK_TYPE);
      expect(ack.source).toBe(EMBED_PARENT_SOURCE);
      expect(ack.payload).toEqual({ accepted: true });
    });
  });

  describe("ready → ack round trip", () => {
    it("completes a full nonce-based handshake via embed runtime", () => {
      const runtime = createEmbedRuntime();
      const nonce = "nonce-round-trip";
      const readyEnvelope = runtime.createReadyEnvelope({
        nonce,
        timestamp: 1_714_000_000_000
      });

      expect(readyEnvelope.type).toBe(EMBED_READY_MESSAGE_TYPE);
      expect(readyEnvelope.nonce).toBe(nonce);

      let state = createInitialHandshakeState();
      state = markReadySent(readyEnvelope.nonce);

      const ack = createHandshakeAckEnvelope({
        nonce: readyEnvelope.nonce,
        accepted: true,
        timestamp: 1_714_000_000_001
      });
      state = processHandshakeAck(state, ack);

      expect(isHandshakeComplete(state)).toBe(true);
    });
  });

  describe("validateIncomingEnvelope", () => {
    const validEnvelope = {
      version: 1,
      type: EMBED_HANDSHAKE_ACK_TYPE,
      nonce: "nonce-v",
      timestamp: 1_714_000_000_000,
      source: EMBED_PARENT_SOURCE,
      payload: { accepted: true }
    };

    it("accepts envelope matching expected type", () => {
      const result = validateIncomingEnvelope(validEnvelope, {
        expectedTypes: [EMBED_HANDSHAKE_ACK_TYPE]
      });

      expect(result.valid).toBe(true);
      expect(result.reason).toBe("ok");
      expect(result.envelope).toBe(validEnvelope);
    });

    it("rejects non-envelope data", () => {
      const result = validateIncomingEnvelope("not an envelope", {
        expectedTypes: [EMBED_HANDSHAKE_ACK_TYPE]
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("not_envelope");
      expect(result.envelope).toBeNull();
    });

    it("rejects unexpected message type", () => {
      const result = validateIncomingEnvelope(validEnvelope, {
        expectedTypes: ["some.other.type"]
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("unexpected_type");
    });

    it("rejects nonce mismatch when expectedNonce is provided", () => {
      const result = validateIncomingEnvelope(validEnvelope, {
        expectedTypes: [EMBED_HANDSHAKE_ACK_TYPE],
        expectedNonce: "different-nonce"
      });

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("nonce_mismatch");
    });

    it("passes when nonce matches", () => {
      const result = validateIncomingEnvelope(validEnvelope, {
        expectedTypes: [EMBED_HANDSHAKE_ACK_TYPE],
        expectedNonce: "nonce-v"
      });

      expect(result.valid).toBe(true);
    });

    it("skips nonce check when expectedNonce is not provided", () => {
      const result = validateIncomingEnvelope(validEnvelope, {
        expectedTypes: [EMBED_HANDSHAKE_ACK_TYPE]
      });

      expect(result.valid).toBe(true);
    });
  });
});

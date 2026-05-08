import { describe, expect, it } from "vitest";
import {
  POST_MESSAGE_ENVELOPE_KEYS,
  createPostMessageEnvelope,
  isPostMessageEnvelope,
  validatePostMessageEnvelope
} from "./post-message";

describe("postMessage envelope", () => {
  it("accepts an envelope with exactly the six required fields", () => {
    const envelope = createPostMessageEnvelope({
      type: "concierge.ready",
      nonce: "nonce-1",
      timestamp: 1_714_000_000_000,
      source: "concierge.embed",
      payload: { ready: true }
    });

    expect(Object.keys(envelope).sort()).toEqual(
      [...POST_MESSAGE_ENVELOPE_KEYS].sort()
    );
    expect(isPostMessageEnvelope(envelope)).toBe(true);
    expect(validatePostMessageEnvelope(envelope)).toBe(envelope);
  });

  it("rejects a missing required field", () => {
    const envelope = {
      version: 1,
      type: "concierge.ready",
      nonce: "nonce-1",
      timestamp: 1_714_000_000_000,
      source: "concierge.embed"
    };

    expect(isPostMessageEnvelope(envelope)).toBe(false);
  });

  it("rejects extra fields outside the six-field envelope", () => {
    const envelope = {
      version: 1,
      type: "concierge.ready",
      nonce: "nonce-1",
      timestamp: 1_714_000_000_000,
      source: "concierge.embed",
      payload: {},
      extra: true
    };

    expect(isPostMessageEnvelope(envelope)).toBe(false);
  });

  it("rejects empty identity fields and undefined payloads", () => {
    expect(
      isPostMessageEnvelope({
        version: 1,
        type: "",
        nonce: "nonce-1",
        timestamp: 1_714_000_000_000,
        source: "concierge.embed",
        payload: {}
      })
    ).toBe(false);

    expect(
      isPostMessageEnvelope({
        version: 1,
        type: "concierge.ready",
        nonce: "nonce-1",
        timestamp: 1_714_000_000_000,
        source: "concierge.embed",
        payload: undefined
      })
    ).toBe(false);
  });
});

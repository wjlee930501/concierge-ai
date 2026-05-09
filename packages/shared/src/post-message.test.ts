import { describe, expect, it } from "vitest";
import {
  POST_MESSAGE_ENVELOPE_KEYS,
  POST_MESSAGE_EMBED_SOURCE,
  POST_MESSAGE_HANDSHAKE_TYPE,
  POST_MESSAGE_HOST_DRIVER_CLEAR_TYPE,
  POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE,
  POST_MESSAGE_HOST_RECT_QUERY_TYPE,
  POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
  POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE,
  POST_MESSAGE_HOST_SCROLL_TO_TYPE,
  POST_MESSAGE_PARENT_SOURCE,
  POST_MESSAGE_READY_TYPE,
  POST_MESSAGE_RESIZE_TYPE,
  POST_MESSAGE_WIDGET_SOURCE,
  createPostMessageEnvelope,
  isKnownPostMessageEnvelope,
  isPostMessageEnvelope,
  validateKnownPostMessageEnvelope,
  validatePostMessageEnvelope
} from "./post-message";

const ALLOWED_ORIGINS = ["https://host.example.test"] as const;

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

describe("message-specific postMessage validation", () => {
  it("accepts the ready scaffold message only with the expected source, nonce, origin, and payload", () => {
    const envelope = createPostMessageEnvelope({
      type: POST_MESSAGE_READY_TYPE,
      nonce: "nonce-ready",
      timestamp: 1_714_000_000_000,
      source: POST_MESSAGE_EMBED_SOURCE,
      payload: {
        sandbox: "allow-scripts",
        frameAncestors: ["https://host.example.test"],
        parentAccessPolicy: { parentDomScrape: false }
      }
    });

    expect(
      validateKnownPostMessageEnvelope(envelope, {
        origin: "https://host.example.test/page",
        allowedOrigins: ALLOWED_ORIGINS,
        expectedType: POST_MESSAGE_READY_TYPE,
        expectedNonce: "nonce-ready"
      })
    ).toBe(envelope);
  });

  it("accepts the handshake scaffold message only with parent source and target embed field", () => {
    const envelope = createPostMessageEnvelope({
      type: POST_MESSAGE_HANDSHAKE_TYPE,
      nonce: "nonce-handshake",
      timestamp: 1_714_000_000_000,
      source: POST_MESSAGE_PARENT_SOURCE,
      payload: {
        targetSource: POST_MESSAGE_EMBED_SOURCE
      }
    });

    expect(
      isKnownPostMessageEnvelope(envelope, {
        origin: "https://host.example.test",
        allowedOrigins: ALLOWED_ORIGINS,
        expectedType: POST_MESSAGE_HANDSHAKE_TYPE,
        expectedNonce: "nonce-handshake"
      })
    ).toBe(true);
  });

  it("accepts the resize scaffold message only with widget source and finite positive dimensions", () => {
    const envelope = createPostMessageEnvelope({
      type: POST_MESSAGE_RESIZE_TYPE,
      nonce: "nonce-resize",
      timestamp: 1_714_000_000_000,
      source: POST_MESSAGE_WIDGET_SOURCE,
      payload: {
        width: 320,
        height: 480
      }
    });

    expect(
      validateKnownPostMessageEnvelope(envelope, {
        origin: "https://host.example.test",
        allowedOrigins: ALLOWED_ORIGINS,
        expectedType: POST_MESSAGE_RESIZE_TYPE,
        expectedNonce: "nonce-resize"
      })
    ).toBe(envelope);
  });

  it.each([
    [
      POST_MESSAGE_HOST_SCROLL_TO_TYPE,
      {
        selector: "#section-demo",
        behavior: "smooth",
        block: "center"
      }
    ],
    [
      POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE,
      {
        selector: "#section-demo",
        padding: 12,
        radius: 8,
        color: "rgba(26, 86, 219, 0.25)"
      }
    ],
    [POST_MESSAGE_HOST_DRIVER_CLEAR_TYPE, {}],
    [
      POST_MESSAGE_HOST_RECT_QUERY_TYPE,
      {
        selector: "#section-demo",
        request_id: "rect-1"
      }
    ]
  ])("accepts host-driver message %s from widget source", (type, payload) => {
    const envelope = createPostMessageEnvelope({
      type,
      nonce: "nonce-host-driver",
      timestamp: 1_714_000_000_000,
      source: POST_MESSAGE_WIDGET_SOURCE,
      payload
    });

    expect(
      validateKnownPostMessageEnvelope(envelope, {
        origin: "https://host.example.test",
        allowedOrigins: ALLOWED_ORIGINS,
        expectedType: type,
        expectedNonce: "nonce-host-driver"
      })
    ).toBe(envelope);
  });

  it("rejects malformed host-driver payloads", () => {
    const envelope = createPostMessageEnvelope({
      type: POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE,
      nonce: "nonce-host-driver",
      timestamp: 1_714_000_000_000,
      source: POST_MESSAGE_WIDGET_SOURCE,
      payload: {
        selector: "#section-demo",
        padding: -1,
        radius: 8,
        color: "rgba(26, 86, 219, 0.25)"
      }
    });

    expect(() =>
      validateKnownPostMessageEnvelope(envelope, {
        origin: "https://host.example.test",
        allowedOrigins: ALLOWED_ORIGINS
      })
    ).toThrow(/Invalid Concierge host-driver postMessage/u);
  });

  it.each([
    [
      POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
      {
        request_id: "rect-1",
        rect: { left: 10, top: 20, width: 300, height: 120 },
        viewport: { w: 1280, h: 800 }
      }
    ],
    [
      POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
      {
        request_id: "rect-missing",
        rect: null,
        viewport: { w: 1280, h: 800 }
      }
    ],
    [
      POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE,
      {
        selector: "#missing"
      }
    ]
  ])("accepts host response message %s from parent source", (type, payload) => {
    const envelope = createPostMessageEnvelope({
      type,
      nonce: "nonce-host-response",
      timestamp: 1_714_000_000_000,
      source: POST_MESSAGE_PARENT_SOURCE,
      payload
    });

    expect(
      validateKnownPostMessageEnvelope(envelope, {
        origin: "https://host.example.test",
        allowedOrigins: ALLOWED_ORIGINS,
        expectedType: type,
        expectedNonce: "nonce-host-response"
      })
    ).toBe(envelope);
  });

  it("rejects malformed host rect responses", () => {
    const envelope = createPostMessageEnvelope({
      type: POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
      nonce: "nonce-host-response",
      timestamp: 1_714_000_000_000,
      source: POST_MESSAGE_PARENT_SOURCE,
      payload: {
        request_id: "rect-1",
        rect: { left: 10, top: 20, width: -1, height: 120 },
        viewport: { w: 1280, h: 800 }
      }
    });

    expect(() =>
      validateKnownPostMessageEnvelope(envelope, {
        origin: "https://host.example.test",
        allowedOrigins: ALLOWED_ORIGINS
      })
    ).toThrow(/Invalid Concierge host response postMessage/u);
  });

  it("rejects unknown message types before payload-specific handling", () => {
    const envelope = createPostMessageEnvelope({
      type: "concierge.unknown",
      nonce: "nonce-unknown",
      timestamp: 1_714_000_000_000,
      source: POST_MESSAGE_EMBED_SOURCE,
      payload: {}
    });

    expect(() =>
      validateKnownPostMessageEnvelope(envelope, {
        origin: "https://host.example.test",
        allowedOrigins: ALLOWED_ORIGINS
      })
    ).toThrow(/Unknown Concierge postMessage type/u);
  });

  it("rejects missing nonce, mismatched source, disallowed origin, and malformed payloads", () => {
    const readyEnvelope = createPostMessageEnvelope({
      type: POST_MESSAGE_READY_TYPE,
      nonce: "nonce-ready",
      timestamp: 1_714_000_000_000,
      source: POST_MESSAGE_EMBED_SOURCE,
      payload: {
        sandbox: "allow-scripts",
        frameAncestors: ["https://host.example.test"],
        parentAccessPolicy: {}
      }
    });

    expect(() =>
      validateKnownPostMessageEnvelope(
        { ...readyEnvelope, nonce: "" },
        {
          origin: "https://host.example.test",
          allowedOrigins: ALLOWED_ORIGINS
        }
      )
    ).toThrow(/Invalid Concierge postMessage envelope/u);

    expect(() =>
      validateKnownPostMessageEnvelope(
        { ...readyEnvelope, source: POST_MESSAGE_PARENT_SOURCE },
        {
          origin: "https://host.example.test",
          allowedOrigins: ALLOWED_ORIGINS
        }
      )
    ).toThrow(/Invalid Concierge ready postMessage/u);

    expect(() =>
      validateKnownPostMessageEnvelope(readyEnvelope, {
        origin: "https://other.example.test",
        allowedOrigins: ALLOWED_ORIGINS
      })
    ).toThrow(/Invalid Concierge postMessage origin/u);

    expect(() =>
      validateKnownPostMessageEnvelope(
        {
          ...readyEnvelope,
          payload: { sandbox: "allow-scripts" }
        },
        {
          origin: "https://host.example.test",
          allowedOrigins: ALLOWED_ORIGINS
        }
      )
    ).toThrow(/Invalid Concierge ready postMessage/u);

    expect(() =>
      validateKnownPostMessageEnvelope(readyEnvelope, {
        origin: "https://host.example.test",
        allowedOrigins: ALLOWED_ORIGINS,
        expectedNonce: "nonce-other"
      })
    ).toThrow(/Invalid Concierge postMessage nonce/u);
  });
});

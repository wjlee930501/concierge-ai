// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
  POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE,
  POST_MESSAGE_HOST_SCROLL_TO_TYPE,
  POST_MESSAGE_PARENT_SOURCE,
  POST_MESSAGE_WIDGET_SOURCE
} from "@conciergeai/shared";
import {
  createHostDriverBridge,
  createHostDriverPost,
  scenarioStepToChoreographyStep
} from "./choreographyBridge";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("choreographyBridge", () => {
  it("maps scenario steps into executeStep input without changing copy", () => {
    const step = scenarioStepToChoreographyStep({
      id: "step_demo",
      popover: {
        label: "Demo",
        title: "데모 보기",
        body: "이 부분이 핵심이에요"
      },
      spotlightTarget: "#section-demo",
      avatarPoint: "left",
      choices: [
        { id: "next", label: "다음", nextStepId: "step_next" },
        { id: "lead", label: "상담", nextStepId: null }
      ],
      isClosing: false
    });

    expect(step).toMatchObject({
      id: "step_demo",
      target_selector: "#section-demo",
      transition_hint: "데모 보기",
      popover: {
        message: "이 부분이 핵심이에요",
        choices: [
          { label: "다음", next: "step_next" },
          { label: "상담", next: "lead_form" }
        ]
      }
    });
  });

  it("posts host-driver payloads as six-field envelopes to a fixed target origin", () => {
    const postMessage = vi.fn();
    const postToHost = createHostDriverPost({
      targetWindow: { postMessage },
      targetOrigin: "https://host.example.test",
      nonceFactory: () => "nonce-1"
    });

    postToHost({
      type: POST_MESSAGE_HOST_SCROLL_TO_TYPE,
      payload: {
        selector: "#section-demo",
        behavior: "smooth",
        block: "center"
      }
    });

    expect(postMessage).toHaveBeenCalledWith(
      {
        version: 1,
        type: POST_MESSAGE_HOST_SCROLL_TO_TYPE,
        nonce: "nonce-1",
        timestamp: expect.any(Number),
        source: POST_MESSAGE_WIDGET_SOURCE,
        payload: {
          selector: "#section-demo",
          behavior: "smooth",
          block: "center"
        }
      },
      "https://host.example.test"
    );
  });

  it("resolves rect queries from validated parent rect responses", async () => {
    const postMessage = vi.fn();
    const bridge = createHostDriverBridge({
      targetWindow: { postMessage },
      listenWindow: window,
      targetOrigin: "https://host.example.test",
      allowedOrigins: ["https://host.example.test"],
      nonceFactory: () => "nonce-query",
      requestIdFactory: () => "rect-1",
      timeoutMs: 100
    });

    const rectPromise = bridge.queryHostRect("#section-demo");
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "concierge:rect_query",
        source: POST_MESSAGE_WIDGET_SOURCE,
        payload: {
          selector: "#section-demo",
          request_id: "rect-1"
        }
      }),
      "https://host.example.test"
    );

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://host.example.test",
        data: {
          version: 1,
          type: POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
          nonce: "nonce-response",
          timestamp: 1_714_000_000_000,
          source: POST_MESSAGE_PARENT_SOURCE,
          payload: {
            request_id: "rect-1",
            rect: { left: 10, top: 20, width: 300, height: 120 },
            viewport: { w: 1280, h: 800 }
          }
        }
      })
    );

    await expect(rectPromise).resolves.toEqual({
      left: 10,
      top: 20,
      width: 300,
      height: 120
    });
    bridge.detach();
  });

  it("routes validated parent section_not_found responses to the bridge callback", () => {
    const onSectionNotFound = vi.fn();
    const bridge = createHostDriverBridge({
      targetWindow: { postMessage: vi.fn() },
      listenWindow: window,
      targetOrigin: "https://host.example.test",
      allowedOrigins: ["https://host.example.test"],
      onSectionNotFound
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: "https://host.example.test",
        data: {
          version: 1,
          type: POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE,
          nonce: "nonce-section-missing",
          timestamp: 1_714_000_000_000,
          source: POST_MESSAGE_PARENT_SOURCE,
          payload: { selector: "#missing" }
        }
      })
    );

    expect(onSectionNotFound).toHaveBeenCalledWith({ selector: "#missing" });
    bridge.detach();
  });

  it("ignores host responses from a mismatched MessageEvent source", () => {
    const onSectionNotFound = vi.fn();
    const bridge = createHostDriverBridge({
      targetWindow: { postMessage: vi.fn() },
      listenWindow: window,
      sourceWindow: window,
      targetOrigin: "https://host.example.test",
      allowedOrigins: ["https://host.example.test"],
      onSectionNotFound
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        source: null,
        origin: "https://host.example.test",
        data: {
          version: 1,
          type: POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE,
          nonce: "nonce-section-missing",
          timestamp: 1_714_000_000_000,
          source: POST_MESSAGE_PARENT_SOURCE,
          payload: { selector: "#missing" }
        }
      })
    );

    expect(onSectionNotFound).not.toHaveBeenCalled();
    bridge.detach();
  });

  it("times out unresolved rect queries as null so choreography can fail open", async () => {
    vi.useFakeTimers();
    const bridge = createHostDriverBridge({
      targetWindow: { postMessage: vi.fn() },
      listenWindow: window,
      targetOrigin: "https://host.example.test",
      allowedOrigins: ["https://host.example.test"],
      requestIdFactory: () => "rect-timeout",
      timeoutMs: 10
    });

    const rectPromise = bridge.queryHostRect("#missing");
    await vi.advanceTimersByTimeAsync(10);

    await expect(rectPromise).resolves.toBeNull();
    bridge.detach();
  });
});

// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  POST_MESSAGE_HOST_DRIVER_CLEAR_TYPE,
  POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE,
  POST_MESSAGE_HOST_RECT_QUERY_TYPE,
  POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
  POST_MESSAGE_HOST_SCROLL_TO_TYPE,
  POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE,
  POST_MESSAGE_PARENT_SOURCE,
  POST_MESSAGE_WIDGET_SOURCE,
  createPostMessageEnvelope
} from "@conciergeai/shared";
import { attachConciergeHostDriver } from "./host-driver";

describe("attachConciergeHostDriver", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("applies and clears validated driver highlights from the widget iframe", () => {
    const target = document.createElement("section");
    target.id = "section-demo";
    document.body.appendChild(target);
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const detach = attachConciergeHostDriver({
      iframe,
      widgetOrigin: "https://widget.example.test"
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        source: iframe.contentWindow,
        origin: "https://widget.example.test",
        data: createPostMessageEnvelope({
          type: POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE,
          nonce: "nonce-1",
          source: POST_MESSAGE_WIDGET_SOURCE,
          payload: {
            selector: "#section-demo",
            padding: 12,
            radius: 8,
            color: "rgba(26, 86, 219, 0.25)"
          }
        })
      })
    );

    expect(target.classList.contains("concierge-driver-highlight")).toBe(true);
    const style = document.querySelector<HTMLStyleElement>(
      "style[data-concierge-driver-style]"
    );
    expect(style?.textContent ?? "").toContain(".concierge-driver-highlight");

    window.dispatchEvent(
      new MessageEvent("message", {
        source: iframe.contentWindow,
        origin: "https://widget.example.test",
        data: createPostMessageEnvelope({
          type: POST_MESSAGE_HOST_DRIVER_CLEAR_TYPE,
          nonce: "nonce-2",
          source: POST_MESSAGE_WIDGET_SOURCE,
          payload: {}
        })
      })
    );

    expect(target.classList.contains("concierge-driver-highlight")).toBe(false);
    detach();
  });

  it("responds to rect queries with viewport-relative host element geometry", () => {
    const target = document.createElement("section");
    target.id = "section-demo";
    target.getBoundingClientRect = () =>
      ({
        left: 10,
        top: 20,
        width: 300,
        height: 120,
        right: 310,
        bottom: 140,
        x: 10,
        y: 20,
        toJSON: () => ({})
      }) as DOMRect;
    document.body.appendChild(target);
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const postMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", {
      configurable: true,
      value: { postMessage }
    });
    const detach = attachConciergeHostDriver({
      iframe,
      widgetOrigin: "https://widget.example.test"
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        source: iframe.contentWindow,
        origin: "https://widget.example.test",
        data: createPostMessageEnvelope({
          type: POST_MESSAGE_HOST_RECT_QUERY_TYPE,
          nonce: "nonce-rect-query",
          source: POST_MESSAGE_WIDGET_SOURCE,
          payload: {
            selector: "#section-demo",
            request_id: "rect-1"
          }
        })
      })
    );

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
        source: POST_MESSAGE_PARENT_SOURCE,
        payload: {
          request_id: "rect-1",
          rect: { left: 10, top: 20, width: 300, height: 120 },
          viewport: { w: window.innerWidth, h: window.innerHeight }
        }
      }),
      "https://widget.example.test"
    );
    detach();
  });

  it("prefers iframe.src origin over wildcard when the sandboxed widget posts an opaque-origin message", () => {
    const target = document.createElement("section");
    target.id = "section-demo";
    target.getBoundingClientRect = () =>
      ({
        left: 12,
        top: 24,
        width: 320,
        height: 140,
        right: 332,
        bottom: 164,
        x: 12,
        y: 24,
        toJSON: () => ({})
      }) as DOMRect;
    document.body.appendChild(target);
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("src", "https://widget.example.test/v1");
    document.body.appendChild(iframe);
    const postMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", {
      configurable: true,
      value: { postMessage }
    });
    const detach = attachConciergeHostDriver({
      iframe,
      widgetOrigin: "https://widget.example.test"
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        source: iframe.contentWindow,
        origin: "null",
        data: createPostMessageEnvelope({
          type: POST_MESSAGE_HOST_RECT_QUERY_TYPE,
          nonce: "nonce-opaque-rect-query",
          source: POST_MESSAGE_WIDGET_SOURCE,
          payload: {
            selector: "#section-demo",
            request_id: "rect-opaque"
          }
        })
      })
    );

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: POST_MESSAGE_HOST_RECT_RESPONSE_TYPE,
        source: POST_MESSAGE_PARENT_SOURCE,
        payload: expect.objectContaining({
          request_id: "rect-opaque",
          rect: { left: 12, top: 24, width: 320, height: 140 }
        })
      }),
      "https://widget.example.test"
    );
    detach();
  });

  it("falls back to wildcard target only when allowWildcardTarget is explicitly enabled and the iframe.src origin is unresolvable", () => {
    const target = document.createElement("section");
    target.id = "section-demo";
    target.getBoundingClientRect = () =>
      ({
        left: 1,
        top: 2,
        width: 3,
        height: 4,
        right: 4,
        bottom: 6,
        x: 1,
        y: 2,
        toJSON: () => ({})
      }) as DOMRect;
    document.body.appendChild(target);
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    // No src attribute → iframe.src origin cannot be resolved. Wildcard
    // fallback is permitted only because allowWildcardTarget was explicitly
    // passed by the host driver caller.
    document.body.appendChild(iframe);
    const postMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", {
      configurable: true,
      value: { postMessage }
    });
    const detach = attachConciergeHostDriver({
      iframe,
      widgetOrigin: "https://widget.example.test",
      allowWildcardTarget: true
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        source: iframe.contentWindow,
        origin: "null",
        data: createPostMessageEnvelope({
          type: POST_MESSAGE_HOST_RECT_QUERY_TYPE,
          nonce: "nonce-opaque-wildcard",
          source: POST_MESSAGE_WIDGET_SOURCE,
          payload: {
            selector: "#section-demo",
            request_id: "rect-wildcard"
          }
        })
      })
    );

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ source: POST_MESSAGE_PARENT_SOURCE }),
      "*"
    );
    detach();
  });

  it("rejects opaque-origin messages when the iframe is not sandboxed", () => {
    const target = document.createElement("section");
    target.id = "section-demo";
    document.body.appendChild(target);
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const detach = attachConciergeHostDriver({
      iframe,
      widgetOrigin: "https://widget.example.test"
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        source: iframe.contentWindow,
        origin: "null",
        data: createPostMessageEnvelope({
          type: POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE,
          nonce: "nonce-opaque-reject",
          source: POST_MESSAGE_WIDGET_SOURCE,
          payload: {
            selector: "#section-demo",
            padding: 12,
            radius: 8,
            color: "rgba(26, 86, 219, 0.25)"
          }
        })
      })
    );

    expect(target.classList.contains("concierge-driver-highlight")).toBe(false);
    detach();
  });

  it("notifies the widget when a requested scroll target is missing", () => {
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const postMessage = vi.fn();
    Object.defineProperty(iframe, "contentWindow", {
      configurable: true,
      value: { postMessage }
    });
    const detach = attachConciergeHostDriver({
      iframe,
      widgetOrigin: "https://widget.example.test"
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        source: iframe.contentWindow,
        origin: "https://widget.example.test",
        data: createPostMessageEnvelope({
          type: POST_MESSAGE_HOST_SCROLL_TO_TYPE,
          nonce: "nonce-scroll",
          source: POST_MESSAGE_WIDGET_SOURCE,
          payload: {
            selector: "#missing",
            behavior: "smooth",
            block: "center"
          }
        })
      })
    );

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: POST_MESSAGE_HOST_SECTION_NOT_FOUND_TYPE,
        source: POST_MESSAGE_PARENT_SOURCE,
        payload: { selector: "#missing" }
      }),
      "https://widget.example.test"
    );
    detach();
  });

  it("silently drops widget envelopes that replay an already-seen nonce", () => {
    const target = document.createElement("section");
    target.id = "section-demo";
    document.body.appendChild(target);
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const detach = attachConciergeHostDriver({
      iframe,
      widgetOrigin: "https://widget.example.test"
    });

    const replayedNonce = "nonce-replay";
    const buildHighlight = () =>
      new MessageEvent("message", {
        source: iframe.contentWindow,
        origin: "https://widget.example.test",
        data: createPostMessageEnvelope({
          type: POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE,
          nonce: replayedNonce,
          source: POST_MESSAGE_WIDGET_SOURCE,
          payload: {
            selector: "#section-demo",
            padding: 12,
            radius: 8,
            color: "rgba(26, 86, 219, 0.25)"
          }
        })
      });

    window.dispatchEvent(buildHighlight());
    expect(target.classList.contains("concierge-driver-highlight")).toBe(true);

    // Clear via a *different* nonce so the first apply isn't undone by a
    // replayed clear. Then re-dispatch the original highlight with the same
    // nonce — the replay guard must drop it (target stays cleared).
    window.dispatchEvent(
      new MessageEvent("message", {
        source: iframe.contentWindow,
        origin: "https://widget.example.test",
        data: createPostMessageEnvelope({
          type: POST_MESSAGE_HOST_DRIVER_CLEAR_TYPE,
          nonce: "nonce-replay-clear",
          source: POST_MESSAGE_WIDGET_SOURCE,
          payload: {}
        })
      })
    );
    expect(target.classList.contains("concierge-driver-highlight")).toBe(false);

    window.dispatchEvent(buildHighlight());
    expect(target.classList.contains("concierge-driver-highlight")).toBe(false);

    detach();
  });

  it("ignores driver messages from unapproved origins", () => {
    const target = document.createElement("section");
    target.id = "section-demo";
    document.body.appendChild(target);
    const iframe = document.createElement("iframe");
    document.body.appendChild(iframe);
    const detach = attachConciergeHostDriver({
      iframe,
      widgetOrigin: "https://widget.example.test"
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        source: iframe.contentWindow,
        origin: "https://attacker.example.test",
        data: createPostMessageEnvelope({
          type: POST_MESSAGE_HOST_DRIVER_HIGHLIGHT_TYPE,
          nonce: "nonce-1",
          source: POST_MESSAGE_WIDGET_SOURCE,
          payload: {
            selector: "#section-demo",
            padding: 12,
            radius: 8,
            color: "rgba(26, 86, 219, 0.25)"
          }
        })
      })
    );

    expect(target.classList.contains("concierge-driver-highlight")).toBe(false);
    detach();
  });
});

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  POST_MESSAGE_EMBED_SOURCE,
  POST_MESSAGE_IFRAME_HITBOX_TYPE,
  POST_MESSAGE_LEAD_SUBMITTED_TYPE,
  POST_MESSAGE_WIDGET_SOURCE,
  createPostMessageEnvelope
} from "@conciergeai/shared";
import { CONCIERGE_DEFAULT_IFRAME_ID, injectConciergeWidget } from "./inject";
import { EMBED_READY_MESSAGE_TYPE } from "./runtime";

describe("injectConciergeWidget", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("appends an iframe with sandbox attribute and widget src", () => {
    const handle = injectConciergeWidget({
      widgetSrc: "https://host.example.test/widget/",
      allowedParentOrigins: ["https://host.example.test"],
      frameAncestors: ["https://host.example.test"]
    });

    expect(handle.iframe.id).toBe(CONCIERGE_DEFAULT_IFRAME_ID);
    expect(handle.iframe.src).toBe("https://host.example.test/widget/");
    const sandbox = handle.iframe.getAttribute("sandbox");
    expect(typeof sandbox).toBe("string");
    expect(sandbox).not.toContain("allow-same-origin");
    expect(handle.iframe.parentElement).toBe(document.body);
    handle.destroy();
    expect(document.body.contains(handle.iframe)).toBe(false);
  });

  it("throws when widgetSrc is missing", () => {
    expect(() =>
      injectConciergeWidget({
        // @ts-expect-error missing widgetSrc on purpose
        widgetSrc: undefined,
        allowedParentOrigins: ["https://host.example.test"],
        frameAncestors: ["https://host.example.test"]
      })
    ).toThrow();
  });

  it.each([
    ["javascript:alert(1)", /javascript/u],
    ["data:text/html,<h1>xss</h1>", /data/u],
    ["blob:https://example.test/abc", /blob/u],
    ["vbscript:msgbox(1)", /vbscript/u],
    ["file:///etc/passwd", /file/u]
  ])("rejects dangerous widgetSrc protocol %s", (widgetSrc, message) => {
    expect(() =>
      injectConciergeWidget({
        widgetSrc,
        allowedParentOrigins: ["https://host.example.test"],
        frameAncestors: ["https://host.example.test"]
      })
    ).toThrow(message);
  });

  it("attaches to a custom mount target", () => {
    const mount = document.createElement("section");
    document.body.appendChild(mount);

    const handle = injectConciergeWidget({
      widgetSrc: "https://host.example.test/widget/",
      mountTarget: mount,
      allowedParentOrigins: ["https://host.example.test"],
      frameAncestors: ["https://host.example.test"]
    });

    expect(handle.iframe.parentElement).toBe(mount);
    handle.destroy();
  });

  it("starts click-through and clips pointer events to widget hitbox messages", () => {
    const handle = injectConciergeWidget({
      widgetSrc: "https://widget.example.test/widget/",
      allowedParentOrigins: ["https://host.example.test"],
      frameAncestors: ["https://host.example.test"]
    });

    expect(handle.iframe.style.pointerEvents).toBe("none");

    window.dispatchEvent(
      new MessageEvent("message", {
        source: handle.iframe.contentWindow,
        origin: "https://widget.example.test",
        data: createPostMessageEnvelope({
          type: POST_MESSAGE_IFRAME_HITBOX_TYPE,
          nonce: "hitbox-1",
          source: POST_MESSAGE_WIDGET_SOURCE,
          payload: {
            rect: { left: 720, top: 520, width: 420, height: 220 },
            viewport: { w: 1280, h: 800 },
            padding: 16
          }
        })
      })
    );

    expect(handle.iframe.style.pointerEvents).toBe("auto");
    expect(handle.iframe.style.clipPath).toBe(
      "inset(504px 124px 44px 704px round 28px)"
    );

    handle.destroy();
  });

  it("accepts ready messages from the widget origin even when the parent origin allowlist differs", () => {
    const onReady = vi.fn();
    const handle = injectConciergeWidget({
      widgetSrc: "https://widget.example.test/widget/",
      allowedParentOrigins: ["https://host.example.test"],
      frameAncestors: ["https://host.example.test"],
      onReady
    });
    const postMessage = vi.spyOn(handle.iframe.contentWindow!, "postMessage");

    window.dispatchEvent(
      new MessageEvent("message", {
        source: handle.iframe.contentWindow,
        origin: "https://widget.example.test",
        data: createPostMessageEnvelope({
          type: EMBED_READY_MESSAGE_TYPE,
          nonce: "ready-1",
          source: POST_MESSAGE_EMBED_SOURCE,
          payload: {
            sandbox: "allow-scripts",
            frameAncestors: ["https://host.example.test"],
            parentAccessPolicy: { parentDomScrape: false }
          }
        })
      })
    );

    expect(onReady).toHaveBeenCalledOnce();
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "concierge.parent.handshake" }),
      "https://widget.example.test"
    );
    handle.destroy();
  });

  it("exposes injectConciergeWidget on the browser bundle contract", async () => {
    await import("./embed-bundle");

    expect(window.Concierge?.injectConciergeWidget).toBe(injectConciergeWidget);
  });

  it("treats the replay-guard nonce LRU as type-agnostic so a ready nonce cannot be reused as a lead_submitted nonce", () => {
    // The inject ready/lead branches share one envelope replay guard instance
    // by design. The LRU is keyed by nonce only — type-agnostic — so an
    // attacker who captures a valid ready envelope cannot resend the same
    // nonce as a forged lead_submitted message. This test pins that
    // fail-closed contract so a refactor toward type-prefixed keys would
    // surface here.
    const onReady = vi.fn();
    const onLeadSubmit = vi.fn();
    const handle = injectConciergeWidget({
      widgetSrc: "https://widget.example.test/widget/",
      allowedParentOrigins: ["https://host.example.test"],
      frameAncestors: ["https://host.example.test"],
      onReady,
      onLeadSubmit
    });

    const sharedNonce = "shared-nonce-cross-type";

    window.dispatchEvent(
      new MessageEvent("message", {
        source: handle.iframe.contentWindow,
        origin: "https://widget.example.test",
        data: createPostMessageEnvelope({
          type: EMBED_READY_MESSAGE_TYPE,
          nonce: sharedNonce,
          source: POST_MESSAGE_EMBED_SOURCE,
          payload: {
            sandbox: "allow-scripts",
            frameAncestors: ["https://host.example.test"],
            parentAccessPolicy: { parentDomScrape: false }
          }
        })
      })
    );

    expect(onReady).toHaveBeenCalledOnce();

    window.dispatchEvent(
      new MessageEvent("message", {
        source: handle.iframe.contentWindow,
        origin: "https://widget.example.test",
        data: createPostMessageEnvelope({
          type: POST_MESSAGE_LEAD_SUBMITTED_TYPE,
          nonce: sharedNonce,
          source: POST_MESSAGE_WIDGET_SOURCE,
          payload: {
            lead: {
              source: "concierge_ai",
              host: "motionlabs",
              intent: "revisit",
              hospitalName: "서울OO의원",
              name: "홍길동",
              phone: "010-0000-0000",
              interestArea: "revisit",
              consent: true
            }
          }
        })
      })
    );

    expect(onLeadSubmit).not.toHaveBeenCalled();
    handle.destroy();
  });

  it("routes lead submitted payloads through a separate callback from host-driver messages", () => {
    const onLeadSubmit = vi.fn();
    const handle = injectConciergeWidget({
      widgetSrc: "https://widget.example.test/widget/",
      allowedParentOrigins: ["https://host.example.test"],
      frameAncestors: ["https://host.example.test"],
      onLeadSubmit
    });

    window.dispatchEvent(
      new MessageEvent("message", {
        source: handle.iframe.contentWindow,
        origin: "null",
        data: createPostMessageEnvelope({
          type: POST_MESSAGE_LEAD_SUBMITTED_TYPE,
          nonce: "lead-1",
          source: POST_MESSAGE_WIDGET_SOURCE,
          payload: {
            lead: {
              source: "concierge_ai",
              host: "motionlabs",
              intent: "revisit",
              hospitalName: "서울OO의원",
              name: "홍길동",
              phone: "010-0000-0000",
              interestArea: "revisit",
              consent: true
            }
          }
        })
      })
    );

    expect(onLeadSubmit).toHaveBeenCalledWith({
      lead: expect.objectContaining({
        source: "concierge_ai",
        host: "motionlabs",
        intent: "revisit"
      })
    });
    handle.destroy();
  });
});

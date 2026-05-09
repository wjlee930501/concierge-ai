// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  POST_MESSAGE_EMBED_SOURCE,
  createPostMessageEnvelope
} from "@conciergeai/shared";
import {
  CONCIERGE_DEFAULT_IFRAME_ID,
  injectConciergeWidget
} from "./inject";
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
});

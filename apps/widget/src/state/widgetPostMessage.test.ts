import { describe, expect, it, vi } from "vitest";
import {
  POST_MESSAGE_IFRAME_HITBOX_TYPE,
  POST_MESSAGE_WIDGET_SOURCE
} from "@conciergeai/shared";
import {
  postWidgetMessageToParent,
  resolveWidgetParentTargetOrigin
} from "./widgetPostMessage";

describe("widgetPostMessage", () => {
  it("uses the computed parent origin instead of wildcard when available", () => {
    expect(
      resolveWidgetParentTargetOrigin({
        parentOrigin: "https://host.example.test",
        opaqueOrigin: true
      })
    ).toBe("https://host.example.test");
  });

  it("allows wildcard only when the widget has sandbox opaque origin AND the caller explicitly opts in", () => {
    expect(
      resolveWidgetParentTargetOrigin({
        parentOrigin: null,
        opaqueOrigin: true,
        allowWildcardTarget: true
      })
    ).toBe("*");
    // Default (allowWildcardTarget undefined or false) is fail-closed.
    expect(
      resolveWidgetParentTargetOrigin({
        parentOrigin: null,
        opaqueOrigin: true
      })
    ).toBeNull();
    expect(
      resolveWidgetParentTargetOrigin({
        parentOrigin: null,
        opaqueOrigin: true,
        allowWildcardTarget: false
      })
    ).toBeNull();
    expect(
      resolveWidgetParentTargetOrigin({
        parentOrigin: null,
        opaqueOrigin: false,
        allowWildcardTarget: true
      })
    ).toBeNull();
    expect(
      resolveWidgetParentTargetOrigin({
        parentOrigin: null,
        opaqueOrigin: false
      })
    ).toBeNull();
  });

  it("does not post when neither parent origin nor opaque-origin fallback is available", () => {
    const targetWindow = { postMessage: vi.fn() };

    postWidgetMessageToParent({
      targetWindow,
      parentOrigin: null,
      opaqueOrigin: false,
      type: POST_MESSAGE_IFRAME_HITBOX_TYPE,
      payload: {
        rect: null,
        viewport: { w: 1280, h: 800 },
        padding: 16
      }
    });

    expect(targetWindow.postMessage).not.toHaveBeenCalled();
  });

  it("posts widget envelopes to the resolved target origin", () => {
    const targetWindow = { postMessage: vi.fn() };

    postWidgetMessageToParent({
      targetWindow,
      parentOrigin: "https://host.example.test",
      opaqueOrigin: true,
      nonce: "hitbox-1",
      type: POST_MESSAGE_IFRAME_HITBOX_TYPE,
      payload: {
        rect: null,
        viewport: { w: 1280, h: 800 },
        padding: 16
      }
    });

    expect(targetWindow.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: POST_MESSAGE_IFRAME_HITBOX_TYPE,
        nonce: "hitbox-1",
        source: POST_MESSAGE_WIDGET_SOURCE
      }),
      "https://host.example.test"
    );
  });
});

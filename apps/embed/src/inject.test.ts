// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CONCIERGE_DEFAULT_IFRAME_ID,
  injectConciergeWidget
} from "./inject";

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
});

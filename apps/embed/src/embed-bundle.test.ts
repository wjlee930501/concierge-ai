// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { CONCIERGE_DEFAULT_IFRAME_ID } from "./inject";

describe("embed bundle auto injection", () => {
  afterEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    Object.defineProperty(document, "currentScript", {
      configurable: true,
      value: null
    });
    delete window.Concierge;
  });

  it("auto-injects when the script tag declares local widget and host origins", async () => {
    const script = document.createElement("script");
    script.src = "http://localhost:5173/embed.js";
    script.dataset.conciergeWidgetOrigin = "http://localhost:5173";
    script.dataset.conciergeHostOrigin = "http://localhost:5180";
    document.body.appendChild(script);
    Object.defineProperty(document, "currentScript", {
      configurable: true,
      value: script
    });

    await import("./embed-bundle");

    const iframe = document.getElementById(
      CONCIERGE_DEFAULT_IFRAME_ID
    ) as HTMLIFrameElement | null;
    expect(iframe).not.toBeNull();
    expect(iframe?.src).toBe("http://localhost:5173/");
    expect(iframe?.getAttribute("sandbox")).toBe("allow-scripts");
  });
});

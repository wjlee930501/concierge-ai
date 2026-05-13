// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { CONCIERGE_DEFAULT_IFRAME_ID } from "./inject";
import { resolveEmbedEnvironment } from "./embed-bundle";

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

  it("auto-injects when the script tag declares local widget, host origins, and development environment", async () => {
    // Reset module cache so embed-bundle top-level side effects re-run against
    // the currentScript we set up below. Without this, an earlier import in
    // this same suite (e.g. for resolveEmbedEnvironment) would short-circuit
    // the auto-inject path.
    vi.resetModules();
    const script = document.createElement("script");
    script.src = "http://localhost:5173/embed.js";
    script.dataset.conciergeWidgetOrigin = "http://localhost:5173";
    script.dataset.conciergeHostOrigin = "http://localhost:5180";
    script.dataset.conciergeEnvironment = "development";
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

describe("resolveEmbedEnvironment", () => {
  it("returns the parsed environment for each supported value", () => {
    expect(resolveEmbedEnvironment("development")).toBe("development");
    expect(resolveEmbedEnvironment("test")).toBe("test");
    expect(resolveEmbedEnvironment("staging")).toBe("staging");
    expect(resolveEmbedEnvironment("preview")).toBe("preview");
    expect(resolveEmbedEnvironment("production")).toBe("production");
  });

  it("normalizes whitespace and case", () => {
    expect(resolveEmbedEnvironment("  Development  ")).toBe("development");
    expect(resolveEmbedEnvironment("STAGING")).toBe("staging");
  });

  it("defaults to production when dataset is missing or invalid (fail-closed)", () => {
    expect(resolveEmbedEnvironment(undefined)).toBe("production");
    expect(resolveEmbedEnvironment("")).toBe("production");
    expect(resolveEmbedEnvironment("prod")).toBe("production");
    expect(resolveEmbedEnvironment("unknown-env")).toBe("production");
  });
});

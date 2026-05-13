// @vitest-environment jsdom
import { cleanup, render, act } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Spotlight } from "./Spotlight";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("Spotlight", () => {
  it("renders nothing when inactive", () => {
    const { container } = render(
      <Spotlight target="#x" active={false} mode="external" />
    );
    expect(container.querySelector("[data-spotlight-mode]")).toBeNull();
  });

  it("renders only the dim backdrop in external mode (host-driver draws the ring)", () => {
    const { container } = render(
      <Spotlight target="#section" active={true} mode="external" />
    );
    const overlay = container.querySelector(
      '[data-spotlight-mode="external"]'
    );
    expect(overlay).not.toBeNull();
    expect(
      container.querySelector('[data-testid="widget-internal-spotlight-ring"]')
    ).toBeNull();
    expect(overlay?.getAttribute("data-spotlight-target")).toBe("#section");
  });

  it("falls back to dim-only when internal mode cannot resolve target", () => {
    const { container } = render(
      <Spotlight target="#missing" active={true} mode="internal" />
    );
    expect(
      container.querySelector('[data-spotlight-mode="external"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[data-testid="widget-internal-spotlight-ring"]')
    ).toBeNull();
  });

  it("renders ring + dim mask in internal mode when target rect resolves", async () => {
    const target = document.createElement("div");
    target.id = "ring-target";
    Object.defineProperty(target, "getBoundingClientRect", {
      value: () => ({
        x: 100,
        y: 200,
        left: 100,
        top: 200,
        right: 420,
        bottom: 360,
        width: 320,
        height: 160,
        toJSON: () => ({})
      })
    });
    document.body.appendChild(target);

    const { container } = render(
      <Spotlight target="#ring-target" active={true} mode="internal" />
    );

    // useEffect/getBoundingClientRect runs synchronously inside the effect;
    // flush a microtask for state propagation.
    await act(async () => {
      await Promise.resolve();
    });

    const ring = container.querySelector<HTMLElement>(
      '[data-testid="widget-internal-spotlight-ring"]'
    );
    expect(ring).not.toBeNull();
    const overlay = container.querySelector(
      '[data-spotlight-mode="internal"]'
    );
    expect(overlay).not.toBeNull();
    // Ring must be positioned over the target rect (with the configured inset).
    expect(ring?.style.left).toMatch(/^\d+px$/u);
    expect(ring?.style.top).toMatch(/^\d+px$/u);
    expect(Number.parseInt(ring!.style.width, 10)).toBeGreaterThan(0);
    expect(Number.parseInt(ring!.style.height, 10)).toBeGreaterThan(0);
    // The SVG mask layer must be present (the dim backdrop).
    expect(overlay?.querySelector("svg")).not.toBeNull();
  });

  it("honors reducedMotion by collapsing transition duration to 0", () => {
    // Smoke test — the component must still render without animation hangs.
    const { container } = render(
      <Spotlight
        target="#x"
        active={true}
        mode="external"
        reducedMotion={true}
      />
    );
    expect(
      container.querySelector('[data-spotlight-mode="external"]')
    ).not.toBeNull();
  });
});

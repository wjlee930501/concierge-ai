// @vitest-environment jsdom
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveParentOrigin, useParentOrigin } from "./useParentOrigin";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("resolveParentOrigin", () => {
  it("returns the document.referrer origin when allowed", () => {
    vi.spyOn(document, "referrer", "get").mockReturnValue(
      "https://example.com/some/path"
    );
    const result = resolveParentOrigin(["https://example.com"]);
    expect(result).toBe("https://example.com");
  });

  it("skips disallowed referrers and falls back to the first allowed origin", () => {
    vi.spyOn(document, "referrer", "get").mockReturnValue(
      "https://evil.com/path"
    );
    const result = resolveParentOrigin(["https://example.com"]);
    // After dropping the disallowed referrer, the fallback is the first
    // configured allowed origin.
    expect(result).toBe("https://example.com");
  });

  it("returns null when no candidate is allowed and allowedOrigins is empty", () => {
    vi.spyOn(document, "referrer", "get").mockReturnValue(
      "https://evil.com/path"
    );
    const result = resolveParentOrigin([]);
    expect(result).toBeNull();
  });

  it("falls back to the first allowed origin when there is no referrer", () => {
    vi.spyOn(document, "referrer", "get").mockReturnValue("");
    const result = resolveParentOrigin(["https://example.com"]);
    expect(result).toBe("https://example.com");
  });
});

describe("useParentOrigin", () => {
  it("memoizes the resolved origin across renders with the same allowedOrigins", () => {
    vi.spyOn(document, "referrer", "get").mockReturnValue(
      "https://example.com/page"
    );
    const allowed = Object.freeze(["https://example.com"]);
    const { result, rerender } = renderHook(
      ({ list }) => useParentOrigin(list),
      { initialProps: { list: allowed as readonly string[] } }
    );
    const first = result.current;
    rerender({ list: allowed });
    expect(result.current).toBe(first);
  });
});

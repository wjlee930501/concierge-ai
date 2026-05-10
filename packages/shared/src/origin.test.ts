import { describe, expect, it } from "vitest";
import {
  OriginPolicyError,
  assertOriginAllowedForEnvironment,
  createOriginPolicy,
  isSupportedPostMessageOrigin,
  isOriginAllowed,
  parseOriginAllowlist,
  toSafeTargetOrigin
} from "./origin";

describe("origin allowlist", () => {
  it("parses env-style config strings into normalized origins", () => {
    expect(
      parseOriginAllowlist(
        "https://staging.example.test, http://localhost:5173\nhttps://preview.example.test/path"
      )
    ).toEqual([
      "https://staging.example.test",
      "http://localhost:5173",
      "https://preview.example.test"
    ]);
  });

  it("matches only explicit allowlisted origins", () => {
    const allowedOrigins = [
      "https://staging.example.test",
      "http://localhost:5173"
    ];

    expect(
      isOriginAllowed("https://staging.example.test/path", allowedOrigins)
    ).toBe(true);
    expect(isOriginAllowed("https://other.example.test", allowedOrigins)).toBe(
      false
    );
  });

  it("rejects wildcard targetOrigin values", () => {
    expect(() => toSafeTargetOrigin("*")).toThrow(OriginPolicyError);
    expect(() => toSafeTargetOrigin("https://*.example.test")).toThrow(
      OriginPolicyError
    );
    expect(() =>
      parseOriginAllowlist("https://staging.example.test,*")
    ).toThrow(OriginPolicyError);
  });

  it("returns a safe targetOrigin only when the origin is allowlisted", () => {
    const policy = createOriginPolicy({
      allowedOrigins: "https://staging.example.test http://localhost:5173"
    });

    expect(policy.targetOriginFor("https://staging.example.test/page")).toBe(
      "https://staging.example.test"
    );
    expect(() => policy.targetOriginFor("https://other.example.test")).toThrow(
      OriginPolicyError
    );
  });

  it("rejects null and opaque origins for postMessage handshakes", () => {
    const allowedOrigins = ["https://staging.example.test"];

    expect(isSupportedPostMessageOrigin("null")).toBe(false);
    expect(isSupportedPostMessageOrigin("about:blank")).toBe(false);
    expect(isSupportedPostMessageOrigin("data:text/html,hello")).toBe(false);
    expect(isSupportedPostMessageOrigin("file:///tmp/index.html")).toBe(false);
    expect(isSupportedPostMessageOrigin("javascript:alert(1)")).toBe(false);
    expect(isSupportedPostMessageOrigin("chrome-extension://abc123")).toBe(
      false
    );
    expect(isOriginAllowed("null", allowedOrigins)).toBe(false);
    expect(() => toSafeTargetOrigin("null")).toThrow(OriginPolicyError);
    expect(() => toSafeTargetOrigin("about:blank")).toThrow(/Null\/opaque/u);
  });

  it("requires https for staging, preview, and production origin policies", () => {
    expect(() => parseOriginAllowlist("http://staging.example.test")).toThrow(
      /must use https/u
    );
    expect(() => parseOriginAllowlist("http://preview.example.test")).toThrow(
      /must use https/u
    );
    expect(() => parseOriginAllowlist("http://prod.example.test")).toThrow(
      /must use https/u
    );

    for (const environment of ["staging", "preview", "production"] as const) {
      expect(() =>
        createOriginPolicy({
          allowedOrigins: ["http://staging.example.test"],
          environment
        })
      ).toThrow(/must use https/u);

      expect(() =>
        createOriginPolicy({
          allowedOrigins: ["https://staging.example.test"],
          environment
        })
      ).not.toThrow();
    }
  });

  it("keeps development and test origins limited to localhost, loopback, and fixture hosts", () => {
    for (const environment of ["development", "test"] as const) {
      expect(() =>
        assertOriginAllowedForEnvironment("http://localhost:5173", environment)
      ).not.toThrow();
      expect(() =>
        assertOriginAllowedForEnvironment("http://127.0.0.1:5173", environment)
      ).not.toThrow();
      expect(() =>
        assertOriginAllowedForEnvironment("http://[::1]:5173", environment)
      ).not.toThrow();
      expect(() =>
        assertOriginAllowedForEnvironment(
          "https://host.example.test",
          environment
        )
      ).not.toThrow();

      expect(() =>
        assertOriginAllowedForEnvironment(
          "https://staging.motion.test",
          environment
        )
      ).toThrow(/localhost, loopback, or \.example\.test/u);
    }
  });
});

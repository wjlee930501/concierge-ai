import { describe, expect, it } from "vitest";
import {
  OriginPolicyError,
  validatePostMessageEnvelope
} from "@conciergeai/shared";
import {
  DEFAULT_PARENT_PAGE_ACCESS_POLICY,
  createEmbedRuntime,
  TEST_ONLY_EMBED_PARENT_ORIGINS
} from "./index";

describe("embed runtime factory scaffold", () => {
  it("composes parent access, sandbox, origin allowlist, targetOrigin, and CSP helpers", () => {
    const runtime = createEmbedRuntime();

    expect(runtime.parentAccessPolicy).toBe(
      DEFAULT_PARENT_PAGE_ACCESS_POLICY
    );
    expect(runtime.iframePolicy.sandbox).toBe("allow-scripts");
    expect(runtime.originPolicy.allowedOrigins).toEqual([
      ...TEST_ONLY_EMBED_PARENT_ORIGINS
    ]);
    expect(runtime.cspPolicy.headerValue).toBe(
      "frame-ancestors https://host.example.test"
    );
    expect(runtime.isAllowedParentOrigin("https://host.example.test/page")).toBe(
      true
    );
    expect(runtime.targetOriginFor("https://host.example.test/page")).toBe(
      "https://host.example.test"
    );
  });

  it("links the parent-access assertion into runtime construction", () => {
    expect(() =>
      createEmbedRuntime({
        parentAccessPolicy: {
          parentDomScrape: false,
          parentCookieRead: true,
          parentLocalStorageRead: false,
          parentSessionStorageRead: false,
          parentDomWrite: false
        }
      })
    ).toThrow(/disabled/u);
  });

  it("rejects unsafe or non-allowlisted target origins", () => {
    const runtime = createEmbedRuntime();

    expect(runtime.isAllowedParentOrigin("https://other.example.test")).toBe(
      false
    );
    expect(() => runtime.targetOriginFor("https://other.example.test")).toThrow(
      OriginPolicyError
    );
    expect(() =>
      createEmbedRuntime({ allowedParentOrigins: "*" })
    ).toThrow(OriginPolicyError);
  });

  it("applies environment-specific origin scheme guards", () => {
    expect(() =>
      createEmbedRuntime({
        allowedParentOrigins: ["http://staging.example.test"],
        environment: "staging"
      })
    ).toThrow(/must use https/u);

    expect(() =>
      createEmbedRuntime({
        allowedParentOrigins: ["http://localhost:5173"],
        environment: "development"
      })
    ).not.toThrow();

    expect(() =>
      createEmbedRuntime({
        allowedParentOrigins: ["https://host.example.test"],
        environment: "test"
      })
    ).not.toThrow();
  });

  it("defaults CSP frame-ancestors to the allowed parent origins", () => {
    const runtime = createEmbedRuntime({
      allowedParentOrigins: [
        "https://parent-a.example.test/path",
        "https://parent-b.example.test"
      ]
    });

    expect(runtime.originPolicy.allowedOrigins).toEqual([
      "https://parent-a.example.test",
      "https://parent-b.example.test"
    ]);
    expect(runtime.cspPolicy.frameAncestors).toEqual(
      runtime.originPolicy.allowedOrigins
    );
    expect(runtime.cspPolicy.headerValue).toBe(
      "frame-ancestors https://parent-a.example.test https://parent-b.example.test"
    );
  });

  it("allows explicit no-frame CSP while allowedParentOrigins still controls postMessage", () => {
    const runtime = createEmbedRuntime({
      allowedParentOrigins: ["https://host.example.test"],
      frameAncestors: []
    });
    const envelope = runtime.createReadyEnvelope({
      nonce: "nonce-no-frame",
      timestamp: 1_714_000_000_000
    });

    expect(runtime.cspPolicy.frameAncestors).toEqual([]);
    expect(runtime.cspPolicy.headerValue).toBe("frame-ancestors 'none'");
    expect(runtime.isAllowedParentOrigin("https://host.example.test/page")).toBe(
      true
    );
    expect(runtime.targetOriginFor("https://host.example.test/page")).toBe(
      "https://host.example.test"
    );
    expect(envelope.payload.frameAncestors).toEqual([]);
  });

  it("fails closed for null and opaque postMessage origins", () => {
    const runtime = createEmbedRuntime();

    expect(runtime.isAllowedParentOrigin("null")).toBe(false);
    expect(runtime.isAllowedParentOrigin("about:blank")).toBe(false);
    expect(() => runtime.targetOriginFor("null")).toThrow(OriginPolicyError);
  });

  it("creates a ready envelope with the shared six-field contract", () => {
    const runtime = createEmbedRuntime();
    const envelope = runtime.createReadyEnvelope({
      nonce: "nonce-1",
      timestamp: 1_714_000_000_000
    });

    expect(validatePostMessageEnvelope(envelope)).toBe(envelope);
    expect(envelope.type).toBe("concierge.embed.ready");
    expect(envelope.source).toBe("concierge.embed");
    expect(envelope.payload).toEqual({
      sandbox: "allow-scripts",
      frameAncestors: ["https://host.example.test"],
      parentAccessPolicy: DEFAULT_PARENT_PAGE_ACCESS_POLICY
    });
  });

  it("keeps ready envelope payload free of parent-page identifiers", () => {
    const runtime = createEmbedRuntime();
    const envelope = runtime.createReadyEnvelope({
      nonce: "nonce-identifiers",
      timestamp: 1_714_000_000_000
    });

    expect(Object.keys(envelope.payload).sort()).toEqual([
      "frameAncestors",
      "parentAccessPolicy",
      "sandbox"
    ]);
    expect(envelope.payload).not.toHaveProperty("clientId");
    expect(envelope.payload).not.toHaveProperty("visitorId");
    expect(envelope.payload).not.toHaveProperty("sessionId");
    expect(envelope.payload).not.toHaveProperty("userAgent");
    expect(envelope.payload).not.toHaveProperty("referrer");
  });
});

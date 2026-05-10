import { describe, expect, it } from "vitest";
import { OriginPolicyError } from "@conciergeai/shared";
import {
  DEFAULT_EMBED_FRAME_ANCESTORS,
  FRAME_ANCESTORS_DIRECTIVE,
  buildFrameAncestorsDirective,
  createEmbedCspPolicy
} from "./csp";

describe("embed CSP frame-ancestors scaffold", () => {
  it("creates a default test-only frame-ancestors directive", () => {
    const policy = createEmbedCspPolicy();

    expect(policy.frameAncestors).toEqual([...DEFAULT_EMBED_FRAME_ANCESTORS]);
    expect(policy.frameAncestorsDirective).toBe(
      "frame-ancestors https://host.example.test"
    );
    expect(policy.headerValue).toContain(FRAME_ANCESTORS_DIRECTIVE);
  });

  it("keeps frame-ancestors present even when no parent origin is configured", () => {
    expect(buildFrameAncestorsDirective([])).toBe("frame-ancestors 'none'");
  });

  it("normalizes duplicate frame ancestors", () => {
    expect(
      createEmbedCspPolicy({
        frameAncestors:
          "https://host.example.test/path https://host.example.test"
      }).headerValue
    ).toBe("frame-ancestors https://host.example.test");
  });

  it("rejects wildcard and null frame ancestors", () => {
    expect(() => buildFrameAncestorsDirective("*")).toThrow(OriginPolicyError);
    expect(() => buildFrameAncestorsDirective("null")).toThrow(
      OriginPolicyError
    );
  });
});

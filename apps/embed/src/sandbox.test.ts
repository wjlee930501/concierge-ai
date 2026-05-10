import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_IFRAME_SANDBOX_TOKENS,
  buildIframeSandbox,
  createEmbedIframePolicy
} from "./sandbox";

describe("embed iframe sandbox policy", () => {
  it("keeps allow-same-origin off in the default sandbox", () => {
    const policy = createEmbedIframePolicy();

    expect(policy.sandbox).toBe("allow-scripts");
    expect(policy.sandbox).not.toContain("allow-same-origin");
  });

  it("forbids top-navigation sandbox tokens", () => {
    for (const token of FORBIDDEN_IFRAME_SANDBOX_TOKENS) {
      expect(() => buildIframeSandbox(["allow-scripts", token])).toThrow(token);
    }
  });

  it("normalizes duplicate and empty sandbox tokens", () => {
    expect(buildIframeSandbox(["allow-scripts", "", "allow-scripts"])).toBe(
      "allow-scripts"
    );
  });
});

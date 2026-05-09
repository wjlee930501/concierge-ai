import { describe, expect, it } from "vitest";
import {
  AVATAR_EXPRESSION_ASSETS,
  TIER1_AVATAR_EXPRESSIONS
} from "./avatarAssets";

describe("avatar expression assets", () => {
  it("maps the Tier 1 generated expressions to real image sources", () => {
    expect(TIER1_AVATAR_EXPRESSIONS).toEqual([
      "neutral",
      "smile",
      "surprise",
      "thinking"
    ]);

    for (const expression of TIER1_AVATAR_EXPRESSIONS) {
      const asset = AVATAR_EXPRESSION_ASSETS[expression];
      expect(asset.id).toBe(expression);
      expect(asset.webp).toMatch(/concierge-(neutral|smile|surprise|thinking)-256\.webp$/);
      expect(asset.avif).toMatch(/concierge-(neutral|smile|surprise|thinking)-256\.avif$/);
      expect(asset.objectPosition).toMatch(/center/);
    }
  });

  it("falls back optional expressions to the closest generated Tier 1 asset", () => {
    expect(AVATAR_EXPRESSION_ASSETS.celebrate.id).toBe("smile");
    expect(AVATAR_EXPRESSION_ASSETS.concerned.id).toBe("thinking");
    expect(AVATAR_EXPRESSION_ASSETS.listening.id).toBe("neutral");
    expect(AVATAR_EXPRESSION_ASSETS.farewell.id).toBe("smile");
  });
});

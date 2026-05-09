import { describe, expect, it } from "vitest";
import { ADMIN_ROUTES, isAdminRoute, readRouteFromHash } from "./router";

describe("admin router", () => {
  it("exposes 5 routes", () => {
    expect(ADMIN_ROUTES).toHaveLength(5);
  });

  it("falls back to dashboard for unknown hash", () => {
    expect(readRouteFromHash("#/unknown")).toBe("dashboard");
    expect(readRouteFromHash("")).toBe("dashboard");
  });

  it("parses known routes", () => {
    expect(readRouteFromHash("#/scenarios")).toBe("scenarios");
    expect(readRouteFromHash("#/audit")).toBe("audit");
  });

  it("type-narrows on admin route", () => {
    expect(isAdminRoute("dashboard")).toBe(true);
    expect(isAdminRoute("nope")).toBe(false);
  });
});

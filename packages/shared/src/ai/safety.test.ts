import { describe, expect, it } from "vitest";
import {
  buildDefaultSafetyResponse,
  isSafetyResponseReason,
  SAFETY_RESPONSE_REASONS,
  safetyResponsePayloadSchema
} from "./safety";

describe("safety response (PRD v1.2)", () => {
  it("exposes exactly five enum values", () => {
    expect(SAFETY_RESPONSE_REASONS).toHaveLength(5);
  });

  it("builds payload with offer_handoff default true for every reason", () => {
    for (const reason of SAFETY_RESPONSE_REASONS) {
      const payload = buildDefaultSafetyResponse(reason);
      const parsed = safetyResponsePayloadSchema.parse(payload);
      expect(parsed.reason).toBe(reason);
      expect(parsed.message.length).toBeGreaterThan(0);
      expect(parsed.message.length).toBeLessThanOrEqual(200);
      expect(parsed.offer_handoff).toBe(true);
    }
  });

  it("allows offer_handoff override", () => {
    const payload = buildDefaultSafetyResponse("out_of_scope", {
      offer_handoff: false
    });
    expect(payload.offer_handoff).toBe(false);
  });

  it("rejects payloads with message > 200 chars", () => {
    const long = "가".repeat(201);
    const result = safetyResponsePayloadSchema.safeParse({
      reason: "out_of_scope",
      message: long,
      offer_handoff: true
    });
    expect(result.success).toBe(false);
  });

  it("guards against unknown reasons", () => {
    expect(isSafetyResponseReason("out_of_scope")).toBe(true);
    expect(isSafetyResponseReason("unknown")).toBe(false);
  });
});

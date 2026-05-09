import { describe, expect, it } from "vitest";
import {
  buildPlaceholderSafetyResponse,
  isSafetyResponseReason,
  SAFETY_RESPONSE_REASONS,
  safetyResponsePayloadSchema
} from "./safety";

describe("safety response", () => {
  it("exposes exactly five enum values", () => {
    expect(SAFETY_RESPONSE_REASONS).toHaveLength(5);
  });

  it("builds payload with isPlaceholderCopy=true for every reason", () => {
    for (const reason of SAFETY_RESPONSE_REASONS) {
      const payload = buildPlaceholderSafetyResponse(reason);
      const parsed = safetyResponsePayloadSchema.parse(payload);
      expect(parsed.reason).toBe(reason);
      expect(parsed.message.length).toBeGreaterThan(0);
      expect(parsed.isPlaceholderCopy).toBe(true);
    }
  });

  it("guards against unknown reasons", () => {
    expect(isSafetyResponseReason("out_of_scope")).toBe(true);
    expect(isSafetyResponseReason("unknown")).toBe(false);
  });
});

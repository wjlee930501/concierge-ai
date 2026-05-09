import { describe, expect, it } from "vitest";
import {
  collectDesignPolishEvidence,
  validateDesignPolishEvidence
} from "./verify-design-polish-contract.mjs";

describe("design polish contract verifier", () => {
  it("checks expression assets, guided conversion anchors, and staging checklist anchors", async () => {
    const evidence = await collectDesignPolishEvidence({
      repoRoot: process.cwd()
    });

    expect(evidence.tier1Assets).toHaveLength(4);
    expect(evidence.hostSections).toEqual(
      expect.arrayContaining([
        "hero",
        "revisit",
        "newvisit",
        "px-intelligence",
        "contact"
      ])
    );
    expect(evidence.quickChipLabels).toEqual(
      expect.arrayContaining([
        "기존 환자 재방문을 높이고 싶어요",
        "신환 유치와 병원 성장을 고민 중이에요",
        "PX Intelligence가 궁금해요",
        "상담을 받고 싶어요"
      ])
    );
    expect(evidence.leadFieldIds).toEqual(
      expect.arrayContaining([
        "hospitalName",
        "name",
        "phone",
        "interestArea"
      ])
    );
    expect(evidence.stagingChecklistItems).toBeGreaterThanOrEqual(10);

    expect(validateDesignPolishEvidence(evidence)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
  collectDesignPolishEvidence,
  validateDesignPolishEvidence
} from "./verify-design-polish-contract.mjs";

describe("design polish contract verifier", () => {
  it("checks expression assets, micro-beat coverage, and staging checklist anchors", async () => {
    const evidence = await collectDesignPolishEvidence({
      repoRoot: process.cwd()
    });

    expect(evidence.tier1Assets).toHaveLength(4);
    expect(evidence.totalBeatCount).toBeGreaterThanOrEqual(25);
    expect(evidence.actionTypes.sort()).toEqual([
      "expression_change",
      "highlight",
      "move",
      "scroll_to",
      "wait"
    ]);
    expect(evidence.stagingChecklistItems).toBeGreaterThanOrEqual(10);

    expect(validateDesignPolishEvidence(evidence)).toEqual([]);
  });
});

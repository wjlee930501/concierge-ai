import { describe, expect, it } from "vitest";
import { TEST_ONLY_DIFF_PATHS_FIXTURE } from "../../../tests/fixtures/pr-evidence/diff-paths.fixture";
import {
  COST_LEDGER_ENTRY_KEYS,
  PR_EVIDENCE_CHANGE_AREAS,
  PR_EVIDENCE_PATH_RULES,
  PR_EVIDENCE_SCOPES,
  PrEvidenceError,
  RUNNING_TOTAL_WEEK_KEYS,
  createCostLedgerEntry,
  inferPrEvidenceChangeAreas,
  inferPrEvidenceChangeAreasForPath,
  isCostLedgerEntry,
  isPrEvidenceChangeArea,
  isPrEvidenceScope,
  isRunningTotalWeek,
  normalizePrEvidencePath,
  requiredExtraEvidenceFor,
  validateCostLedgerEntry
} from "./pr-evidence";

const validRunningTotal = () =>
  ({
    week_id: "W1",
    computer_use_minutes: 0,
    claude_review_tokens_estimate: 0,
    llm_calls_estimate: 0
  }) as const;

const validEntry = () =>
  ({
    pr_number: 12,
    computer_use_minutes: 1.5,
    claude_review_tokens_estimate: 1500,
    llm_calls_estimate: 4,
    running_total_week: validRunningTotal()
  }) as const;

describe("pr evidence scope", () => {
  it("exposes the FINAL_ALIGNMENT scope enum", () => {
    expect([...PR_EVIDENCE_SCOPES]).toEqual([
      "scaffolding-only",
      "AI",
      "KB",
      "PIPA",
      "Admin",
      "polish"
    ]);
  });

  it("guards scope and change-area enums", () => {
    expect(isPrEvidenceScope("scaffolding-only")).toBe(true);
    expect(isPrEvidenceScope("unknown")).toBe(false);
    expect(isPrEvidenceChangeArea("ai-or-kb")).toBe(true);
    expect(isPrEvidenceChangeArea("misc")).toBe(false);
  });

  it("maps scope to required extra evidence per FINAL_ALIGNMENT §5", () => {
    expect(requiredExtraEvidenceFor("scaffolding-only")).toEqual([]);
    expect(requiredExtraEvidenceFor("polish")).toEqual([]);
    expect(requiredExtraEvidenceFor("AI")).toEqual(["ai-or-kb"]);
    expect(requiredExtraEvidenceFor("KB")).toEqual(["ai-or-kb"]);
    expect(requiredExtraEvidenceFor("PIPA")).toEqual(["pipa"]);
    expect(requiredExtraEvidenceFor("Admin")).toEqual(["admin"]);
  });

  it("never silently includes iframe evidence; iframe is keyed by area not scope", () => {
    for (const scope of PR_EVIDENCE_SCOPES) {
      expect(requiredExtraEvidenceFor(scope)).not.toContain("iframe");
    }

    expect(PR_EVIDENCE_CHANGE_AREAS).toContain("iframe");
  });
});

describe("running total week shape", () => {
  it("accepts a well-formed running total", () => {
    expect(isRunningTotalWeek(validRunningTotal())).toBe(true);
  });

  it("rejects malformed week ids", () => {
    expect(
      isRunningTotalWeek({ ...validRunningTotal(), week_id: "Week-1" })
    ).toBe(false);
    expect(isRunningTotalWeek({ ...validRunningTotal(), week_id: "" })).toBe(
      false
    );
    expect(isRunningTotalWeek({ ...validRunningTotal(), week_id: "W0" })).toBe(
      false
    );
  });

  it("rejects negative or non-integer accumulators", () => {
    expect(
      isRunningTotalWeek({
        ...validRunningTotal(),
        computer_use_minutes: -1
      })
    ).toBe(false);
    expect(
      isRunningTotalWeek({
        ...validRunningTotal(),
        claude_review_tokens_estimate: 1.2
      })
    ).toBe(false);
    expect(
      isRunningTotalWeek({
        ...validRunningTotal(),
        llm_calls_estimate: Number.NaN
      })
    ).toBe(false);
  });

  it("rejects extra fields beyond the four declared keys", () => {
    expect(
      isRunningTotalWeek({ ...validRunningTotal(), notes: "extra" })
    ).toBe(false);
    expect([...RUNNING_TOTAL_WEEK_KEYS]).toEqual([
      "week_id",
      "computer_use_minutes",
      "claude_review_tokens_estimate",
      "llm_calls_estimate"
    ]);
  });
});

describe("cost ledger entry shape", () => {
  it("declares the FINAL_ALIGNMENT five-field shape", () => {
    expect([...COST_LEDGER_ENTRY_KEYS]).toEqual([
      "pr_number",
      "computer_use_minutes",
      "claude_review_tokens_estimate",
      "llm_calls_estimate",
      "running_total_week"
    ]);
  });

  it("accepts a well-formed entry", () => {
    expect(isCostLedgerEntry(validEntry())).toBe(true);
    expect(validateCostLedgerEntry(validEntry())).toEqual(validEntry());
  });

  it("accepts pr_number=null for not-yet-numbered PRs", () => {
    expect(isCostLedgerEntry({ ...validEntry(), pr_number: null })).toBe(true);
  });

  it("rejects pr_number that is not a positive integer", () => {
    expect(isCostLedgerEntry({ ...validEntry(), pr_number: 0 })).toBe(false);
    expect(isCostLedgerEntry({ ...validEntry(), pr_number: -3 })).toBe(false);
    expect(isCostLedgerEntry({ ...validEntry(), pr_number: 1.5 })).toBe(false);
    expect(isCostLedgerEntry({ ...validEntry(), pr_number: "12" })).toBe(false);
  });

  it("rejects negative or non-finite computer_use_minutes", () => {
    expect(
      isCostLedgerEntry({ ...validEntry(), computer_use_minutes: -0.5 })
    ).toBe(false);
    expect(
      isCostLedgerEntry({
        ...validEntry(),
        computer_use_minutes: Number.POSITIVE_INFINITY
      })
    ).toBe(false);
  });

  it("rejects token/call estimates that are not non-negative integers", () => {
    expect(
      isCostLedgerEntry({
        ...validEntry(),
        claude_review_tokens_estimate: 1500.5
      })
    ).toBe(false);
    expect(isCostLedgerEntry({ ...validEntry(), llm_calls_estimate: -1 })).toBe(
      false
    );
  });

  it("rejects entries missing the running_total_week or carrying extra keys", () => {
    const missingTotal: Record<string, unknown> = { ...validEntry() };
    delete missingTotal["running_total_week"];
    expect(isCostLedgerEntry(missingTotal)).toBe(false);

    expect(
      isCostLedgerEntry({ ...validEntry(), commentary: "extra" })
    ).toBe(false);
  });

  it("propagates running_total_week shape failures", () => {
    expect(
      isCostLedgerEntry({
        ...validEntry(),
        running_total_week: {
          ...validRunningTotal(),
          week_id: "wrong"
        }
      })
    ).toBe(false);
  });

  it("createCostLedgerEntry validates and returns an exact-shaped entry", () => {
    const entry = createCostLedgerEntry(validEntry());
    expect(entry).toEqual(validEntry());
    expect(() =>
      createCostLedgerEntry({ ...validEntry(), llm_calls_estimate: -1 })
    ).toThrow(PrEvidenceError);
  });

  it("validateCostLedgerEntry throws PrEvidenceError on invalid input", () => {
    expect(() => validateCostLedgerEntry({})).toThrow(PrEvidenceError);
  });
});

describe("normalizePrEvidencePath", () => {
  it("returns repo-relative paths unchanged", () => {
    expect(normalizePrEvidencePath("apps/embed/src/index.ts")).toBe(
      "apps/embed/src/index.ts"
    );
  });

  it("strips a leading ./ prefix", () => {
    expect(normalizePrEvidencePath("./apps/embed/src/index.ts")).toBe(
      "apps/embed/src/index.ts"
    );
  });

  it("rejects non-string, empty, absolute, parent-traversal, and backslash paths", () => {
    expect(() => normalizePrEvidencePath(undefined)).toThrow(PrEvidenceError);
    expect(() => normalizePrEvidencePath("")).toThrow(PrEvidenceError);
    expect(() => normalizePrEvidencePath("./")).toThrow(PrEvidenceError);
    expect(() => normalizePrEvidencePath("/etc/passwd")).toThrow(
      PrEvidenceError
    );
    expect(() => normalizePrEvidencePath("../escape.ts")).toThrow(
      PrEvidenceError
    );
    expect(() => normalizePrEvidencePath("apps\\embed\\src.ts")).toThrow(
      PrEvidenceError
    );
  });
});

describe("test-only PR evidence diff path fixture", () => {
  it("keeps per-path fixture examples aligned with change-area inference", () => {
    for (const example of TEST_ONLY_DIFF_PATHS_FIXTURE.perPathExamples) {
      expect(inferPrEvidenceChangeAreasForPath(example.path), example.label).toEqual(
        example.expectedAreas
      );
    }
  });

  it("keeps exact segment-equality fixture examples for every path rule token", () => {
    const labels = new Set(
      TEST_ONLY_DIFF_PATHS_FIXTURE.perPathExamples.map((example) => example.label)
    );

    for (const [area, rule] of Object.entries(PR_EVIDENCE_PATH_RULES)) {
      for (const token of rule.tokens) {
        const label = `exact ${token} segment`;
        expect(labels, `${area} token ${token}`).toContain(label);
      }
    }
  });

  it("keeps aggregated current-diff fixture examples aligned with canonical area order", () => {
    for (const example of TEST_ONLY_DIFF_PATHS_FIXTURE.aggregatedExamples) {
      expect(inferPrEvidenceChangeAreas(example.paths), example.label).toEqual(
        example.expectedAreas
      );
    }
  });

  it("keeps non-matching fixture examples from requiring extra PR evidence", () => {
    for (const example of TEST_ONLY_DIFF_PATHS_FIXTURE.nonMatchingExamples) {
      expect(inferPrEvidenceChangeAreasForPath(example.path), example.label).toEqual(
        []
      );
    }
  });

  it("keeps invalid current-diff fixture paths rejected before evidence inference", () => {
    for (const example of TEST_ONLY_DIFF_PATHS_FIXTURE.invalidPathExamples) {
      expect(
        () => inferPrEvidenceChangeAreasForPath(example.path as string),
        example.label
      ).toThrow(PrEvidenceError);
    }
  });
});

describe("inferPrEvidenceChangeAreasForPath", () => {
  it("flags apps/embed/** as iframe", () => {
    expect(inferPrEvidenceChangeAreasForPath("apps/embed/src/runtime.ts")).toEqual([
      "iframe"
    ]);
    expect(inferPrEvidenceChangeAreasForPath("apps/embed/README.md")).toEqual([
      "iframe"
    ]);
  });

  it("flags embed-related docs and tests as iframe", () => {
    expect(
      inferPrEvidenceChangeAreasForPath("docs/security/embed-parent-surface.md")
    ).toEqual(["iframe"]);
    expect(
      inferPrEvidenceChangeAreasForPath("docs/security/parent-embed-bridge.md")
    ).toEqual(["iframe"]);
    expect(
      inferPrEvidenceChangeAreasForPath("tests/iframe/handshake.test.ts")
    ).toEqual(["iframe"]);
  });

  it("flags shared postMessage/origin contract files as iframe", () => {
    expect(
      inferPrEvidenceChangeAreasForPath("packages/shared/src/post-message.ts")
    ).toEqual(["iframe"]);
    expect(
      inferPrEvidenceChangeAreasForPath(
        "packages/shared/src/post-message.test.ts"
      )
    ).toEqual(["iframe"]);
    expect(
      inferPrEvidenceChangeAreasForPath("packages/shared/src/origin.ts")
    ).toEqual(["iframe"]);
    expect(
      inferPrEvidenceChangeAreasForPath("packages/shared/src/origin.test.ts")
    ).toEqual(["iframe"]);
  });

  it("flags packages/kb/** and ai-prefixed segments as ai-or-kb", () => {
    expect(
      inferPrEvidenceChangeAreasForPath("packages/kb/src/ingest.ts")
    ).toEqual(["ai-or-kb"]);
    expect(
      inferPrEvidenceChangeAreasForPath("apps/widget/src/ai/tool-schema.ts")
    ).toEqual(["ai-or-kb"]);
    expect(
      inferPrEvidenceChangeAreasForPath("docs/kb/approved-knowledge.md")
    ).toEqual(["ai-or-kb"]);
  });

  it("flags pipa-prefixed segments as pipa", () => {
    expect(
      inferPrEvidenceChangeAreasForPath("packages/pipa/src/consent.ts")
    ).toEqual(["pipa"]);
    expect(
      inferPrEvidenceChangeAreasForPath("docs/pipa/retention.md")
    ).toEqual(["pipa"]);
  });

  it("flags admin-prefixed segments as admin", () => {
    expect(inferPrEvidenceChangeAreasForPath("apps/admin/src/page.tsx")).toEqual(
      ["admin"]
    );
    expect(
      inferPrEvidenceChangeAreasForPath("docs/admin/rbac.md")
    ).toEqual(["admin"]);
  });

  it("returns no areas for unrelated scaffold paths", () => {
    expect(inferPrEvidenceChangeAreasForPath("CHANGELOG.md")).toEqual([]);
    expect(inferPrEvidenceChangeAreasForPath("package.json")).toEqual([]);
    expect(
      inferPrEvidenceChangeAreasForPath("packages/shared/src/choreographer.ts")
    ).toEqual([]);
    expect(
      inferPrEvidenceChangeAreasForPath("apps/widget/src/shell-view-model.ts")
    ).toEqual([]);
  });

  it("does not match unrelated tokens that merely contain area names", () => {
    expect(inferPrEvidenceChangeAreasForPath("apps/embedded-tool.ts")).toEqual(
      []
    );
    expect(inferPrEvidenceChangeAreasForPath("docs/aim.md")).toEqual([]);
    expect(inferPrEvidenceChangeAreasForPath("docs/kbd-shortcut.md")).toEqual(
      []
    );
    expect(inferPrEvidenceChangeAreasForPath("docs/administrate.md")).toEqual(
      []
    );
  });

  it("normalizes a leading ./ before matching", () => {
    expect(
      inferPrEvidenceChangeAreasForPath("./apps/embed/src/runtime.ts")
    ).toEqual(["iframe"]);
  });
});

describe("inferPrEvidenceChangeAreas", () => {
  it("aggregates change areas across a diff path list in canonical order", () => {
    expect(
      inferPrEvidenceChangeAreas([
        "docs/admin/rbac.md",
        "apps/embed/src/runtime.ts",
        "packages/kb/src/ingest.ts",
        "packages/pipa/src/consent.ts",
        "CHANGELOG.md"
      ])
    ).toEqual(["ai-or-kb", "iframe", "pipa", "admin"]);
  });

  it("returns an empty list when no paths match", () => {
    expect(inferPrEvidenceChangeAreas([])).toEqual([]);
    expect(
      inferPrEvidenceChangeAreas(["CHANGELOG.md", "package.json"])
    ).toEqual([]);
  });

  it("deduplicates repeated areas across multiple paths", () => {
    expect(
      inferPrEvidenceChangeAreas([
        "apps/embed/src/runtime.ts",
        "packages/shared/src/post-message.ts",
        "tests/iframe/handshake.test.ts"
      ])
    ).toEqual(["iframe"]);
  });

  it("propagates PrEvidenceError from invalid entries", () => {
    expect(() =>
      inferPrEvidenceChangeAreas(["apps/embed/src/runtime.ts", "/etc/passwd"])
    ).toThrow(PrEvidenceError);
  });

  it("never silently emits an unknown change area", () => {
    const result = inferPrEvidenceChangeAreas([
      "apps/embed/src/runtime.ts",
      "packages/kb/src/ingest.ts",
      "packages/pipa/src/consent.ts",
      "apps/admin/src/page.tsx"
    ]);

    for (const area of result) {
      expect(isPrEvidenceChangeArea(area)).toBe(true);
    }

    expect(Object.keys(PR_EVIDENCE_PATH_RULES).sort()).toEqual(
      [...PR_EVIDENCE_CHANGE_AREAS].sort()
    );
  });
});

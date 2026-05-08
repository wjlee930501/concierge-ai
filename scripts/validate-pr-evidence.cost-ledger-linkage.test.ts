import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  REQUIRED_COST_LEDGER_KEY_LABELS,
  extractSectionBody,
  findInlineCodeTokens
} from "./validate-pr-evidence.mjs";
import {
  COST_LEDGER_ENTRY_KEYS,
  RUNNING_TOTAL_WEEK_KEYS
} from "../packages/shared/src/pr-evidence";
import { TEST_ONLY_COST_LEDGER_FIXTURE } from "../tests/fixtures/cost-ledger/example-entries.fixture";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const prTemplatePath = path.join(
  repoRoot,
  ".github",
  "pull_request_template.md"
);
const alignmentDocPath = path.join(
  repoRoot,
  "docs",
  "alignment",
  "PR_EVIDENCE_AND_COST_LEDGER.md"
);

const COST_LEDGER_HEADING = "Cost Ledger";

// Drift detector: schema constants ↔ validator labels ↔ fixture example keys ↔
// PR template Cost Ledger inline-code labels ↔ alignment doc § 4.1. If any of
// the five sources gain or rename a key without updating the others, this test
// surfaces the gap before review-only verification.
describe("PR evidence Cost Ledger linkage", () => {
  it("validator REQUIRED_COST_LEDGER_KEY_LABELS equals schema top-level keys plus nested week_id", () => {
    const expected = new Set<string>([
      ...COST_LEDGER_ENTRY_KEYS,
      "week_id"
    ]);
    const actual = new Set(REQUIRED_COST_LEDGER_KEY_LABELS);
    expect(actual).toEqual(expected);
  });

  it("nested week_id is the only RunningTotalWeek key the validator surfaces as a required label", () => {
    const nestedOnly = RUNNING_TOTAL_WEEK_KEYS.filter(
      (key) => !(COST_LEDGER_ENTRY_KEYS as readonly string[]).includes(key)
    );
    expect(nestedOnly).toEqual(["week_id"]);
  });

  it("every fixture valid example top-level key appears as inline code in the PR template Cost Ledger section", async () => {
    const markdown = await readFile(prTemplatePath, "utf8");
    const body = extractSectionBody(markdown, COST_LEDGER_HEADING);
    const tokens = findInlineCodeTokens(body);

    for (const example of TEST_ONLY_COST_LEDGER_FIXTURE.validExamples) {
      for (const key of Object.keys(example.entry)) {
        expect(
          tokens.has(key),
          `PR template Cost Ledger section is missing inline-code label \`${key}\` from fixture example "${example.label}"`
        ).toBe(true);
      }
    }
  });

  it("nested running_total_week.week_id label appears in the PR template Cost Ledger section", async () => {
    const markdown = await readFile(prTemplatePath, "utf8");
    const body = extractSectionBody(markdown, COST_LEDGER_HEADING);
    const tokens = findInlineCodeTokens(body);
    expect(tokens.has("week_id")).toBe(true);
  });

  it("alignment doc § 4.1 lists every fixture-required label as inline code", async () => {
    const markdown = await readFile(alignmentDocPath, "utf8");
    const body = extractSectionBody(markdown, "4. PR Template과의 매핑");
    const fixtureLinkageHeading =
      "### 4.2 Cost Ledger fixture ↔ PR template ↔ validator drift detector";
    expect(
      body.includes(fixtureLinkageHeading),
      `docs/alignment/PR_EVIDENCE_AND_COST_LEDGER.md § 4 must contain the exact § 4.2 delimiter heading "${fixtureLinkageHeading}" so the § 4.1-only slice is well-defined`
    ).toBe(true);
    const segments = body.split(fixtureLinkageHeading);
    expect(
      segments.length,
      `docs/alignment/PR_EVIDENCE_AND_COST_LEDGER.md § 4 must contain the § 4.2 delimiter heading exactly once; found ${segments.length - 1} occurrence(s)`
    ).toBe(2);
    const beforeFixtureLinkage = segments[0] ?? "";
    expect(
      beforeFixtureLinkage.length,
      "docs/alignment/PR_EVIDENCE_AND_COST_LEDGER.md § 4.1 slice (before § 4.2 delimiter) must not be empty"
    ).toBeGreaterThan(0);
    const tokens = findInlineCodeTokens(beforeFixtureLinkage);

    for (const key of REQUIRED_COST_LEDGER_KEY_LABELS) {
      expect(
        tokens.has(key),
        `docs/alignment/PR_EVIDENCE_AND_COST_LEDGER.md § 4.1 is missing inline-code label \`${key}\``
      ).toBe(true);
    }
  });

  it("alignment doc points at the cost-ledger fixture path as a single-source mapping", async () => {
    const markdown = await readFile(alignmentDocPath, "utf8");
    expect(markdown).toContain("tests/fixtures/cost-ledger");
  });
});

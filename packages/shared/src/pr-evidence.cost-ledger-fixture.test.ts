import { describe, expect, it } from "vitest";
import {
  COST_LEDGER_ENTRY_KEYS,
  PrEvidenceError,
  RUNNING_TOTAL_WEEK_KEYS,
  createCostLedgerEntry,
  isCostLedgerEntry,
  isRunningTotalWeek,
  validateCostLedgerEntry
} from "./pr-evidence";
import { TEST_ONLY_COST_LEDGER_FIXTURE } from "../../../tests/fixtures/cost-ledger/example-entries.fixture";

describe("cost ledger fixture round-trip", () => {
  it("scopes the fixture to tests/fixtures/cost-ledger", () => {
    expect(TEST_ONLY_COST_LEDGER_FIXTURE.fixtureScope).toBe(
      "tests/fixtures/cost-ledger only"
    );
  });

  it("provides at least one valid and one invalid example", () => {
    expect(TEST_ONLY_COST_LEDGER_FIXTURE.validExamples.length).toBeGreaterThan(0);
    expect(
      TEST_ONLY_COST_LEDGER_FIXTURE.invalidExamples.length
    ).toBeGreaterThan(0);
  });

  it("every valid example matches the FINAL_ALIGNMENT five-field shape", () => {
    for (const example of TEST_ONLY_COST_LEDGER_FIXTURE.validExamples) {
      const keys = Object.keys(example.entry).sort();
      expect(keys).toEqual([...COST_LEDGER_ENTRY_KEYS].sort());
    }
  });

  it("every valid example passes isCostLedgerEntry and validateCostLedgerEntry", () => {
    for (const example of TEST_ONLY_COST_LEDGER_FIXTURE.validExamples) {
      expect(isCostLedgerEntry(example.entry)).toBe(true);
      expect(validateCostLedgerEntry(example.entry)).toEqual(example.entry);
    }
  });

  it("every valid example round-trips through createCostLedgerEntry", () => {
    for (const example of TEST_ONLY_COST_LEDGER_FIXTURE.validExamples) {
      const rebuilt = createCostLedgerEntry({
        pr_number: example.entry.pr_number,
        computer_use_minutes: example.entry.computer_use_minutes,
        claude_review_tokens_estimate:
          example.entry.claude_review_tokens_estimate,
        llm_calls_estimate: example.entry.llm_calls_estimate,
        running_total_week: example.entry.running_total_week
      });
      expect(rebuilt).toEqual(example.entry);
    }
  });

  it("every invalid example is rejected by both guard and validator", () => {
    for (const example of TEST_ONLY_COST_LEDGER_FIXTURE.invalidExamples) {
      expect(isCostLedgerEntry(example.entry)).toBe(false);
      expect(() => validateCostLedgerEntry(example.entry)).toThrow(
        PrEvidenceError
      );
    }
  });

  it("invalid example labels and reasons are non-empty for review traceability", () => {
    for (const example of TEST_ONLY_COST_LEDGER_FIXTURE.invalidExamples) {
      expect(example.label.length).toBeGreaterThan(0);
      expect(example.reason.length).toBeGreaterThan(0);
    }
  });

  it("every valid example's running_total_week matches the four-key shape", () => {
    for (const example of TEST_ONLY_COST_LEDGER_FIXTURE.validExamples) {
      const subKeys = Object.keys(example.entry.running_total_week).sort();
      expect(subKeys).toEqual([...RUNNING_TOTAL_WEEK_KEYS].sort());
      expect(isRunningTotalWeek(example.entry.running_total_week)).toBe(true);
    }
  });

  it("includes a cross-week running total example to exercise week_id beyond W1", () => {
    const weekIds = TEST_ONLY_COST_LEDGER_FIXTURE.validExamples.map(
      (example) => example.entry.running_total_week.week_id
    );
    expect(new Set(weekIds).size).toBeGreaterThan(1);
  });

  it("invalid examples cover the documented gap classes", () => {
    const reasons = TEST_ONLY_COST_LEDGER_FIXTURE.invalidExamples
      .map((example) => example.reason.toLowerCase())
      .join(" | ");
    expect(reasons).toContain("required");
    expect(reasons).toContain("infinity");
    expect(reasons).toContain("non-negative");
  });

  it("fixture top-level container and example arrays are frozen", () => {
    expect(Object.isFrozen(TEST_ONLY_COST_LEDGER_FIXTURE)).toBe(true);
    expect(Object.isFrozen(TEST_ONLY_COST_LEDGER_FIXTURE.validExamples)).toBe(
      true
    );
    expect(Object.isFrozen(TEST_ONLY_COST_LEDGER_FIXTURE.invalidExamples)).toBe(
      true
    );
  });
});

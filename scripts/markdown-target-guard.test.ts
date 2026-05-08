import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  TARGET_PATH_ECHO_MAX_LENGTH,
  assertPathStaysInsideWorkspace,
  assertSafeMarkdownTargetPath,
  sanitizeForReport
} from "./markdown-target-guard.mjs";

import * as evidenceModule from "./validate-pr-evidence.mjs";
import * as templateModule from "./validate-pr-template.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");

describe("markdown-target-guard sanitizeForReport", () => {
  it("replaces ASCII control characters and DEL with '?'", () => {
    expect(sanitizeForReport("a\nb\tc\rd\x00e\x7ff")).toBe("a?b?c?d?e?f");
  });

  it("clamps strings longer than the configured max with an ellipsis", () => {
    const long = "a".repeat(TARGET_PATH_ECHO_MAX_LENGTH + 50);
    const sanitized = sanitizeForReport(long);
    expect(sanitized.length).toBe(TARGET_PATH_ECHO_MAX_LENGTH + 1);
    expect(sanitized.endsWith("…")).toBe(true);
  });

  it("returns '<non-string>' for non-string inputs", () => {
    expect(sanitizeForReport(undefined as unknown as string)).toBe("<non-string>");
    expect(sanitizeForReport(null as unknown as string)).toBe("<non-string>");
    expect(sanitizeForReport(123 as unknown as string)).toBe("<non-string>");
  });
});

describe("markdown-target-guard assertSafeMarkdownTargetPath", () => {
  it("rejects empty / non-string target paths", () => {
    expect(() => assertSafeMarkdownTargetPath("")).toThrow(/non-empty string/);
    expect(() =>
      assertSafeMarkdownTargetPath(undefined as unknown as string)
    ).toThrow(/non-empty string/);
  });

  it("rejects targets that escape the workspace via parent traversal", () => {
    expect(() => assertSafeMarkdownTargetPath("../outside.md", repoRoot)).toThrow(
      /stay inside the repo workspace/
    );
  });

  it("rejects targets that resolve to an absolute path outside the workspace", () => {
    expect(() => assertSafeMarkdownTargetPath("/etc/passwd.md", repoRoot)).toThrow(
      /stay inside the repo workspace/
    );
  });

  it("rejects path segments starting with .env", () => {
    expect(() => assertSafeMarkdownTargetPath(".env.local", repoRoot)).toThrow(
      /\.env\*/
    );
    expect(() =>
      assertSafeMarkdownTargetPath(".env.fixture/body.md", repoRoot)
    ).toThrow(/\.env\*/);
  });

  it("rejects non-markdown extensions before any read", () => {
    expect(() => assertSafeMarkdownTargetPath("package.json", repoRoot)).toThrow(
      /must be a markdown file/
    );
    expect(() =>
      assertSafeMarkdownTargetPath("scripts/validate-pr-evidence.mjs", repoRoot)
    ).toThrow(/must be a markdown file/);
  });

  it("returns the resolved absolute path on a valid in-workspace .md target", () => {
    const resolved = assertSafeMarkdownTargetPath(
      ".github/pull_request_template.md",
      repoRoot
    );
    expect(path.isAbsolute(resolved)).toBe(true);
    expect(resolved.startsWith(repoRoot)).toBe(true);
    expect(resolved.endsWith(".md")).toBe(true);
  });
});

describe("markdown-target-guard assertPathStaysInsideWorkspace", () => {
  it("accepts a real path that is the workspace itself? no — empty relative is rejected", () => {
    expect(() => assertPathStaysInsideWorkspace(repoRoot, repoRoot)).toThrow(
      /stay inside the repo workspace/
    );
  });

  it("rejects a real path resolved outside the workspace (symlinked-dir escape)", () => {
    const outside = path.resolve(repoRoot, "..", "outside-real-target.md");
    expect(() => assertPathStaysInsideWorkspace(outside, repoRoot)).toThrow(
      /target real path must stay inside the repo workspace/
    );
  });

  it("rejects a real path whose realpath segments include .env*", () => {
    const envInside = path.join(repoRoot, ".env.fixture", "body.md");
    expect(() => assertPathStaysInsideWorkspace(envInside, repoRoot)).toThrow(
      /target real path must not reference \.env\*/
    );
  });

  it("accepts an in-workspace markdown real path that does not touch .env*", () => {
    const safe = path.join(repoRoot, ".github", "pull_request_template.md");
    expect(() => assertPathStaysInsideWorkspace(safe, repoRoot)).not.toThrow();
  });
});

describe("validate-pr-evidence.mjs and validate-pr-template.mjs share the guard", () => {
  it("both modules re-export the exact shared sanitizeForReport function", () => {
    expect(evidenceModule.sanitizeForReport).toBe(sanitizeForReport);
    expect(templateModule.sanitizeForReport).toBe(sanitizeForReport);
  });

  it("both modules re-export the exact shared assertSafeMarkdownTargetPath function", () => {
    expect(evidenceModule.assertSafeMarkdownTargetPath).toBe(
      assertSafeMarkdownTargetPath
    );
    expect(templateModule.assertSafeMarkdownTargetPath).toBe(
      assertSafeMarkdownTargetPath
    );
  });

  it("both modules re-export the exact shared assertPathStaysInsideWorkspace function", () => {
    expect(evidenceModule.assertPathStaysInsideWorkspace).toBe(
      assertPathStaysInsideWorkspace
    );
    expect(templateModule.assertPathStaysInsideWorkspace).toBe(
      assertPathStaysInsideWorkspace
    );
  });

  it("documents markdown-target-guard.mjs as the single owner for path safety and output sanitization", () => {
    const docs = readFileSync(
      path.join(repoRoot, "docs", "alignment", "PR_EVIDENCE_AND_COST_LEDGER.md"),
      "utf8"
    );

    expect(docs).toContain("Ownership note — markdown target guard");
    expect(docs).toContain("scripts/markdown-target-guard.mjs");
    expect(docs).toContain("단일 소유자(single owner)");
    expect(docs).toContain("path safety");
    expect(docs).toContain("output sanitize");
    for (const sharedFunctionName of [
      "assertSafeMarkdownTargetPath",
      "assertPathStaysInsideWorkspace",
      "sanitizeForReport"
    ]) {
      expect(docs).toContain(sharedFunctionName);
    }
    expect(docs).toContain("scripts/validate-pr-evidence.mjs");
    expect(docs).toContain("scripts/validate-pr-template.mjs");
  });

  it("places the Ownership note exactly once as an H4 before Local 실행 under §4.1", () => {
    const docs = readFileSync(
      path.join(repoRoot, "docs", "alignment", "PR_EVIDENCE_AND_COST_LEDGER.md"),
      "utf8"
    );
    const lines = docs.split("\n");

    const ownershipHeadingMatches = lines.filter((line) =>
      /^#{1,6}\s+Ownership note — markdown target guard\s*$/.test(line)
    );
    expect(ownershipHeadingMatches).toEqual([
      "#### Ownership note — markdown target guard"
    ]);

    const ownershipIndex = lines.findIndex((line) =>
      /^#{1,6}\s+Ownership note — markdown target guard\s*$/.test(line)
    );
    const localExecIndex = lines.findIndex((line) =>
      /^#{1,6}\s+Local 실행\s*$/.test(line)
    );
    const structuralValidatorIndex = lines.findIndex((line) =>
      /^###\s+4\.1\s+Structural validator\s*$/.test(line)
    );

    expect(structuralValidatorIndex).toBeGreaterThan(-1);
    expect(ownershipIndex).toBeGreaterThan(structuralValidatorIndex);
    expect(localExecIndex).toBeGreaterThan(ownershipIndex);
    expect(lines[localExecIndex]).toBe("#### Local 실행");
  });

  // Behaviour parity: each scenario the task specifies (control-char sanitization,
  // workspace escape, .env* segment rejection including realpath containment,
  // non-md rejection) is enforced by the same shared functions, so a single
  // assertion against those functions proves both validators behave identically.
  // Direct symlink rejection is enforced at the validator main() layer via
  // `lstat`; the existing `validate-pr-evidence.test.ts` and
  // `validate-pr-template.test.ts` CLI tests cover that integration path.
});

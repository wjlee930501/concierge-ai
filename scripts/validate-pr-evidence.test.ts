import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  REQUIRED_COST_LEDGER_KEY_LABELS,
  REQUIRED_PR_EVIDENCE_SECTIONS,
  extractSectionBody,
  findInlineCodeTokens,
  parseH2Headings,
  validatePrEvidenceMarkdown
} from "./validate-pr-evidence.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const scriptPath = path.join(repoRoot, "scripts", "validate-pr-evidence.mjs");
const realTemplatePath = path.join(
  repoRoot,
  ".github",
  "pull_request_template.md"
);

type RunResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
};

function runValidator(args: string[]): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: repoRoot,
      env: { ...process.env, NODE_ENV: "test" }
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      resolve({ exitCode, stdout, stderr });
    });
  });
}

describe("validate-pr-evidence CLI", () => {
  it("passes against the real .github/pull_request_template.md", async () => {
    const result = await runValidator([realTemplatePath]);
    expect(result.exitCode, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain("validate-pr-evidence: PASS");
    expect(result.stdout).toContain(realTemplatePath);
  });

  it("fails on a markdown file missing required sections and cost ledger keys", async () => {
    const fixtureDir = await mkdtemp(
      path.join(repoRoot, ".tmp-pr-evidence-")
    );
    const fixturePath = path.join(fixtureDir, "invalid_pr_template.md");
    const invalidMarkdown = [
      "## Scope",
      "",
      "- [ ] scaffolding-only",
      "",
      "## Changes",
      "",
      "- Added: nothing",
      "",
      "## Cost Ledger",
      "",
      "- `pr_number`: 1",
      ""
    ].join("\n");

    try {
      await writeFile(fixturePath, invalidMarkdown, "utf8");
      const result = await runValidator([fixturePath]);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("validate-pr-evidence: FAIL");
      expect(result.stdout).toContain("missing sections:");
      expect(result.stdout).toContain("PRD Mapping");
      expect(result.stdout).toContain("Tests");
      expect(result.stdout).toContain("Computer-Use Verification");
      expect(result.stdout).toContain("Secret Scan");
      expect(result.stdout).toContain("missing cost ledger keys:");
      expect(result.stdout).toContain("computer_use_minutes");
      expect(result.stdout).toContain("running_total_week");
      expect(result.stdout).toContain("week_id");
    } finally {
      await rm(fixtureDir, { force: true, recursive: true });
    }
  });

  it("exits with code 2 when the target file is missing", async () => {
    const result = await runValidator([
      path.join(repoRoot, "conciergeai-does-not-exist.md")
    ]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("validate-pr-evidence: cannot read");
  });

  it("rejects .env-like and non-markdown targets before reading", async () => {
    const envResult = await runValidator([".env.local"]);
    expect(envResult.exitCode).toBe(2);
    expect(envResult.stderr).toContain("validate-pr-evidence: unsafe target");
    expect(envResult.stderr).toContain(".env*");

    const nonMarkdownResult = await runValidator(["package.json"]);
    expect(nonMarkdownResult.exitCode).toBe(2);
    expect(nonMarkdownResult.stderr).toContain("target path must be a markdown file");
  });

  it("rejects workspace-local markdown symlinks before reading", async () => {
    const fixtureDir = await mkdtemp(
      path.join(repoRoot, ".tmp-pr-evidence-")
    );
    const symlinkPath = path.join(fixtureDir, "linked-template.md");

    try {
      await symlink(path.join(repoRoot, "package.json"), symlinkPath);
      const result = await runValidator([symlinkPath]);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("target path must not be a symlink");
    } finally {
      await rm(fixtureDir, { force: true, recursive: true });
    }
  });

  it("rejects paths that traverse through a symlinked directory outside the workspace", async () => {
    const fixtureDir = await mkdtemp(
      path.join(repoRoot, ".tmp-pr-evidence-")
    );
    const outsideDir = await mkdtemp(
      path.join(tmpdir(), "conciergeai-pr-evidence-outside-")
    );
    const outsideMarkdown = path.join(outsideDir, "outside-template.md");
    const symlinkedDir = path.join(fixtureDir, "linked-dir");

    try {
      await writeFile(outsideMarkdown, "## Scope\n", "utf8");
      await symlink(outsideDir, symlinkedDir);
      const result = await runValidator([path.join(symlinkedDir, "outside-template.md")]);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain(
        "target real path must stay inside the repo workspace"
      );
    } finally {
      await rm(fixtureDir, { force: true, recursive: true });
      await rm(outsideDir, { force: true, recursive: true });
    }
  });

  it("rejects paths that traverse through a symlinked directory into an in-workspace .env* directory", async () => {
    const fixtureDir = await mkdtemp(
      path.join(repoRoot, ".tmp-pr-evidence-")
    );
    const envLikeDir = path.join(fixtureDir, ".env.fixture");
    const symlinkedDir = path.join(fixtureDir, "safe-looking-dir");

    try {
      await mkdir(envLikeDir);
      await writeFile(path.join(envLikeDir, "body.md"), "## Scope\n", "utf8");
      await symlink(envLikeDir, symlinkedDir);
      const result = await runValidator([path.join(symlinkedDir, "body.md")]);

      expect(result.exitCode).toBe(2);
      expect(result.stderr).toContain("target real path must not reference .env*");
    } finally {
      await rm(fixtureDir, { force: true, recursive: true });
    }
  });

  it("fails when a required H2 heading appears more than once", async () => {
    const fixtureDir = await mkdtemp(
      path.join(repoRoot, ".tmp-pr-evidence-")
    );
    const fixturePath = path.join(fixtureDir, "duplicate_heading.md");
    const markdown = [
      "## Scope",
      "- [ ] scaffolding-only",
      "## PRD Mapping",
      "- ref",
      "## Changes",
      "- noop",
      "## Tests",
      "- unit",
      "## Tests",
      "- duplicated",
      "## Computer-Use Verification",
      "- no",
      "## Secret Scan",
      "- ok",
      "## Cost Ledger",
      "- `pr_number`: 1",
      "- `computer_use_minutes`: 0",
      "- `claude_review_tokens_estimate`: 0",
      "- `llm_calls_estimate`: 0",
      "- `running_total_week`:",
      "  - `week_id`: W1",
      ""
    ].join("\n");

    try {
      await writeFile(fixturePath, markdown, "utf8");
      const result = await runValidator([fixturePath]);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("validate-pr-evidence: FAIL");
      expect(result.stdout).toContain("duplicated sections: Tests");
      expect(result.stdout).not.toContain("missing sections:");
    } finally {
      await rm(fixtureDir, { force: true, recursive: true });
    }
  });

  it("does not count required headings or cost ledger keys that appear only inside fenced code blocks", async () => {
    const fixtureDir = await mkdtemp(
      path.join(repoRoot, ".tmp-pr-evidence-")
    );
    const fixturePath = path.join(fixtureDir, "fenced_only.md");
    const markdown = [
      "## Scope",
      "- [ ] scaffolding-only",
      "## PRD Mapping",
      "- ref",
      "## Changes",
      "- noop",
      "```markdown",
      "## Tests",
      "## Computer-Use Verification",
      "## Secret Scan",
      "## Cost Ledger",
      "- `pr_number`: 1",
      "- `computer_use_minutes`: 0",
      "- `claude_review_tokens_estimate`: 0",
      "- `llm_calls_estimate`: 0",
      "- `running_total_week`:",
      "  - `week_id`: W1",
      "```",
      ""
    ].join("\n");

    try {
      await writeFile(fixturePath, markdown, "utf8");
      const result = await runValidator([fixturePath]);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("validate-pr-evidence: FAIL");
      expect(result.stdout).toContain("missing sections:");
      expect(result.stdout).toContain("Tests");
      expect(result.stdout).toContain("Computer-Use Verification");
      expect(result.stdout).toContain("Secret Scan");
      expect(result.stdout).toContain("Cost Ledger");
      expect(result.stdout).toContain("missing cost ledger keys:");
      expect(result.stdout).toContain("pr_number");
      expect(result.stdout).toContain("week_id");
    } finally {
      await rm(fixtureDir, { force: true, recursive: true });
    }
  });

  it("ignores cost ledger key labels that appear only inside fenced code blocks within the section", async () => {
    const fixtureDir = await mkdtemp(
      path.join(repoRoot, ".tmp-pr-evidence-")
    );
    const fixturePath = path.join(fixtureDir, "fenced_keys.md");
    const markdown = [
      "## Scope",
      "- [ ] scaffolding-only",
      "## PRD Mapping",
      "- ref",
      "## Changes",
      "- noop",
      "## Tests",
      "- unit",
      "## Computer-Use Verification",
      "- no",
      "## Secret Scan",
      "- ok",
      "## Cost Ledger",
      "```yaml",
      "- `pr_number`: 1",
      "- `computer_use_minutes`: 0",
      "- `claude_review_tokens_estimate`: 0",
      "- `llm_calls_estimate`: 0",
      "- `running_total_week`:",
      "  - `week_id`: W1",
      "```",
      ""
    ].join("\n");

    try {
      await writeFile(fixturePath, markdown, "utf8");
      const result = await runValidator([fixturePath]);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("validate-pr-evidence: FAIL");
      expect(result.stdout).toContain("missing cost ledger keys:");
      for (const key of REQUIRED_COST_LEDGER_KEY_LABELS) {
        expect(result.stdout).toContain(key);
      }
    } finally {
      await rm(fixtureDir, { force: true, recursive: true });
    }
  });

  it("accepts CRLF line endings without altering structural detection", async () => {
    const fixtureDir = await mkdtemp(
      path.join(repoRoot, ".tmp-pr-evidence-")
    );
    const fixturePath = path.join(fixtureDir, "crlf_template.md");
    const markdown = [
      "## Scope",
      "- [ ] scaffolding-only",
      "## PRD Mapping",
      "- ref",
      "## Changes",
      "- noop",
      "## Tests",
      "- unit",
      "## Computer-Use Verification",
      "- no",
      "## Secret Scan",
      "- ok",
      "## Cost Ledger",
      "- `pr_number`: 1",
      "- `computer_use_minutes`: 0",
      "- `claude_review_tokens_estimate`: 0",
      "- `llm_calls_estimate`: 0",
      "- `running_total_week`:",
      "  - `week_id`: W1",
      ""
    ].join("\r\n");

    try {
      await writeFile(fixturePath, markdown, "utf8");
      const result = await runValidator([fixturePath]);

      expect(result.exitCode, result.stdout + result.stderr).toBe(0);
      expect(result.stdout).toContain("validate-pr-evidence: PASS");
    } finally {
      await rm(fixtureDir, { force: true, recursive: true });
    }
  });

  it("redacts markdown body and non-required inline tokens from failure output", async () => {
    const fixtureDir = await mkdtemp(
      path.join(repoRoot, ".tmp-pr-evidence-")
    );
    const fixturePath = path.join(fixtureDir, "malicious_body.md");
    const secretShapedToken = "secret-shaped-test-only-output-boundary-token";
    const bodyLine = "DO_NOT_ECHO_MARKDOWN_BODY_CONTENT";
    const markdown = [
      "## Scope",
      `- ${bodyLine}`,
      "## Changes",
      `- \`${secretShapedToken}\``,
      "## Cost Ledger",
      "- `pr_number`: 1",
      ""
    ].join("\n");

    try {
      await writeFile(fixturePath, markdown, "utf8");
      const result = await runValidator([fixturePath]);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("validate-pr-evidence: FAIL");
      expect(result.stdout).toContain("missing sections:");
      expect(result.stdout).toContain("missing cost ledger keys:");
      expect(result.stdout).not.toContain(bodyLine);
      expect(result.stdout).not.toContain(secretShapedToken);
      expect(result.stderr).toBe("");
    } finally {
      await rm(fixtureDir, { force: true, recursive: true });
    }
  });

  it("sanitizes control characters in CLI error output for missing files and unknown args", async () => {
    const missingResult = await runValidator(["docs/pr\nbody.md"]);
    expect(missingResult.exitCode).toBe(2);
    expect(missingResult.stderr).toContain("docs/pr?body.md");
    expect(missingResult.stderr).not.toContain("docs/pr\nbody.md");

    const unknownArgResult = await runValidator(["--bad\npath.md"]);
    expect(unknownArgResult.exitCode).toBe(2);
    expect(unknownArgResult.stderr).toContain("unknown argument: --bad?path.md");
    expect(unknownArgResult.stderr).not.toContain("--bad\npath.md");
  });
});

describe("validate-pr-evidence pure helpers", () => {
  it("parseH2Headings: skips fenced and indented heading-like lines", () => {
    const markdown = [
      "## Scope",
      "    ## Indented (code block)",
      "```",
      "## InsideFence",
      "```",
      "## Tests",
      "##NoSpace",
      "## Trailing  "
    ].join("\n");
    const headings = parseH2Headings(markdown);
    expect(headings).toEqual(["Scope", "Tests", "Trailing"]);
  });

  it("parseH2Headings: throws TypeError on non-string input", () => {
    expect(() => parseH2Headings(undefined as unknown as string)).toThrow(
      TypeError
    );
  });

  it("extractSectionBody: returns body up to the next H2 and ignores fenced H2 headings", () => {
    const markdown = [
      "## Scope",
      "- alpha",
      "```",
      "## NotASection",
      "```",
      "- beta",
      "## Tests",
      "- gamma"
    ].join("\n");
    const body = extractSectionBody(markdown, "Scope");
    expect(body).toContain("- alpha");
    expect(body).toContain("- beta");
    expect(body).toContain("## NotASection");
    expect(body).not.toContain("- gamma");
  });

  it("extractSectionBody: returns first occurrence body when a heading is duplicated", () => {
    const markdown = [
      "## Tests",
      "first",
      "## Tests",
      "second",
      "## Cost Ledger",
      "tail"
    ].join("\n");
    const body = extractSectionBody(markdown, "Tests");
    expect(body).toContain("first");
    expect(body).not.toContain("second");
    expect(body).not.toContain("tail");
  });

  it("findInlineCodeTokens: collects multiple tokens per line and skips fenced blocks", () => {
    const body = [
      "- `pr_number`: 1 and `running_total_week`:",
      "```",
      "- `should_not_count`: x",
      "```",
      "- `week_id`: W1"
    ].join("\n");
    const tokens = findInlineCodeTokens(body);
    expect(tokens.has("pr_number")).toBe(true);
    expect(tokens.has("running_total_week")).toBe(true);
    expect(tokens.has("week_id")).toBe(true);
    expect(tokens.has("should_not_count")).toBe(false);
  });

  it("findInlineCodeTokens: throws TypeError on non-string body", () => {
    expect(() => findInlineCodeTokens(null as unknown as string)).toThrow(
      TypeError
    );
  });

  it("validatePrEvidenceMarkdown: surfaces duplicates, missing sections, and missing keys together", () => {
    const markdown = [
      "## Scope",
      "## Scope",
      "## Changes",
      "## Tests",
      "## Computer-Use Verification",
      "## Secret Scan",
      "## Cost Ledger",
      "- `pr_number`: 1"
    ].join("\n");
    const result = validatePrEvidenceMarkdown(markdown);
    expect(result.ok).toBe(false);
    expect(result.duplicatedSections).toContain("Scope");
    expect(result.missingSections).toContain("PRD Mapping");
    expect(result.missingCostLedgerKeys).toContain("week_id");
    expect(result.missingCostLedgerKeys).toContain("running_total_week");
    expect(result.missingCostLedgerKeys).not.toContain("pr_number");
  });

  it("validatePrEvidenceMarkdown: returns ok=true when every required section and key is present exactly once", () => {
    const sections = REQUIRED_PR_EVIDENCE_SECTIONS.map(
      (heading) => `## ${heading}\n`
    ).join("");
    const ledgerLines = REQUIRED_COST_LEDGER_KEY_LABELS.map(
      (key) => `- \`${key}\`: ok`
    ).join("\n");
    const markdown = `${sections}${ledgerLines}\n`;
    const result = validatePrEvidenceMarkdown(markdown);
    expect(result.ok).toBe(true);
    expect(result.duplicatedSections).toEqual([]);
    expect(result.missingSections).toEqual([]);
    expect(result.missingCostLedgerKeys).toEqual([]);
  });

  it("validatePrEvidenceMarkdown: marks every cost ledger key missing when the Cost Ledger section is absent", () => {
    const markdown = [
      "## Scope",
      "## PRD Mapping",
      "## Changes",
      "## Tests",
      "## Computer-Use Verification",
      "## Secret Scan"
    ].join("\n");
    const result = validatePrEvidenceMarkdown(markdown);
    expect(result.ok).toBe(false);
    expect(result.missingSections).toEqual(["Cost Ledger"]);
    expect(result.missingCostLedgerKeys).toEqual([
      ...REQUIRED_COST_LEDGER_KEY_LABELS
    ]);
  });
});

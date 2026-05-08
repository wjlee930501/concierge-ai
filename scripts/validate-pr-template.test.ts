import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  REQUIRED_PR_TEMPLATE_SECTIONS,
  formatValidationReport,
  parseCliArgs,
  sanitizeForReport,
  validatePrTemplateMarkdown
} from "./validate-pr-template.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const scriptPath = path.join(repoRoot, "scripts", "validate-pr-template.mjs");
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

describe("validate-pr-template CLI", () => {
  it("passes against the real .github/pull_request_template.md", async () => {
    const result = await runValidator([realTemplatePath]);
    expect(result.exitCode, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain("validate-pr-template: PASS");
    expect(result.stdout).toContain(realTemplatePath);
  });

  it("rejects .env-like and non-markdown targets before reading", async () => {
    const envResult = await runValidator([".env.local"]);
    expect(envResult.exitCode).toBe(2);
    expect(envResult.stderr).toContain("validate-pr-template: unsafe target");
    expect(envResult.stderr).toContain(".env*");

    const nonMarkdownResult = await runValidator(["package.json"]);
    expect(nonMarkdownResult.exitCode).toBe(2);
    expect(nonMarkdownResult.stderr).toContain("target path must be a markdown file");
  });

  it("rejects workspace-local markdown symlinks before reading", async () => {
    const fixtureDir = await mkdtemp(
      path.join(repoRoot, ".tmp-pr-template-")
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
      path.join(repoRoot, ".tmp-pr-template-")
    );
    const outsideDir = await mkdtemp(
      path.join(tmpdir(), "conciergeai-pr-template-outside-")
    );
    const outsideMarkdown = path.join(outsideDir, "outside-template.md");
    const symlinkedDir = path.join(fixtureDir, "linked-dir");

    try {
      await writeFile(outsideMarkdown, "## Scope\n", "utf8");
      await symlink(outsideDir, symlinkedDir);
      const result = await runValidator([
        path.join(symlinkedDir, "outside-template.md")
      ]);

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
      path.join(repoRoot, ".tmp-pr-template-")
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

  it("does not echo markdown body or unknown headings on FAIL", async () => {
    const fixtureDir = await mkdtemp(
      path.join(repoRoot, ".tmp-pr-template-")
    );
    const fixturePath = path.join(fixtureDir, "malicious_body.md");
    const unknownHeading = "DO_NOT_ECHO_UNKNOWN_HEADING";
    const bodyLine = "DO_NOT_ECHO_MARKDOWN_BODY_CONTENT";
    const markdown = [
      "## Scope",
      `- ${bodyLine}`,
      `## ${unknownHeading}`,
      "- body"
    ].join("\n");

    try {
      await writeFile(fixturePath, markdown, "utf8");
      const result = await runValidator([fixturePath]);

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toContain("validate-pr-template: FAIL");
      expect(result.stdout).toContain("missing sections:");
      expect(result.stdout).not.toContain(bodyLine);
      expect(result.stdout).not.toContain(unknownHeading);
      expect(result.stderr).toBe("");
    } finally {
      await rm(fixtureDir, { force: true, recursive: true });
    }
  });
});

describe("validate-pr-template pure helpers", () => {
  it("sanitizeForReport replaces control chars and clamps length", () => {
    expect(sanitizeForReport("a\nb\tc")).toBe("a?b?c");
    expect(sanitizeForReport("x\x7fy")).toBe("x?y");
    const long = "a".repeat(300);
    const sanitized = sanitizeForReport(long, 10);
    expect(sanitized.length).toBeLessThanOrEqual(11);
    expect(sanitized.endsWith("…")).toBe(true);
    expect(sanitizeForReport(undefined as unknown as string)).toBe("<non-string>");
  });

  it("formatValidationReport sanitizes the target path on PASS", () => {
    const report = formatValidationReport(
      ".github/pr\nbody.md",
      validatePrTemplateMarkdown(
        REQUIRED_PR_TEMPLATE_SECTIONS.map((h) => `## ${h}\n`).join("")
      )
    );
    expect(report).toContain("validate-pr-template: PASS");
    expect(report).toContain(".github/pr?body.md");
    expect(report).not.toContain(".github/pr\nbody.md");
  });

  it("formatValidationReport sanitizes the target path on FAIL", () => {
    const report = formatValidationReport(
      ".github/pr\nbody.md",
      validatePrTemplateMarkdown("## Scope\n## Scope\n")
    );
    expect(report).toContain("validate-pr-template: FAIL");
    expect(report).toContain(".github/pr?body.md");
    expect(report).not.toContain(".github/pr\nbody.md");
    expect(report).toContain("duplicated sections: Scope");
    expect(report).toContain("missing sections:");
  });

  it("parseCliArgs sanitizes unknown short-option arguments in error messages", () => {
    expect(() => parseCliArgs(["--bad\npath"])).toThrow(
      /unknown argument: --bad\?path/
    );
  });

  it("validatePrTemplateMarkdown returns ok=true when every required section is present exactly once", () => {
    const markdown = REQUIRED_PR_TEMPLATE_SECTIONS.map((h) => `## ${h}\n`).join("");
    const result = validatePrTemplateMarkdown(markdown);
    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.duplicated).toEqual([]);
  });

  it("validatePrTemplateMarkdown surfaces duplicates and missing together without echoing unknown headings", () => {
    const markdown = [
      "## Scope",
      "## Scope",
      "## SECRET-LIKE-UNKNOWN-HEADING",
      "## Cost Ledger"
    ].join("\n");
    const result = validatePrTemplateMarkdown(markdown);
    expect(result.ok).toBe(false);
    expect(result.duplicated).toContain("Scope");
    expect(result.missing).toContain("PRD Mapping");
    expect(typeof result.unknownHeadingCount).toBe("number");
    expect(result.unknownHeadingCount).toBe(1);
    const formatted = formatValidationReport("x.md", result);
    expect(formatted).not.toContain("SECRET-LIKE-UNKNOWN-HEADING");
  });
});

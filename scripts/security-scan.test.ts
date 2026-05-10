import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_HISTORY_COMMITS,
  formatFindings,
  parseCliArgs,
  scanDiff,
  scanHistory,
  scanProject,
  scanTextForSecrets,
  SECRET_SCAN_RULES,
  SUPPORTED_MODES
} from "./security-scan.mjs";

const NUL = String.fromCharCode(0);

describe("safe secret scan scaffold", () => {
  it("reports rule ids and counts without exposing matched values", () => {
    const slackHost = ["hooks", "slack", "com"].join(".");
    const tokenName = "token";
    const dummyToken = "dummy-token-value-with-enough-length";
    const text = [
      `const webhookHost = '${slackHost}';`,
      `const ${tokenName} = '${dummyToken}';`
    ].join("\n");

    const findings = scanTextForSecrets(text);
    const report = formatFindings([
      {
        path: "tests/fixtures/security/dummy",
        ruleId: "generic_api_key_assignment",
        count: 1
      }
    ]);

    expect(findings.map((finding) => finding.ruleId)).toContain(
      "slack_webhook_host"
    );
    expect(findings.map((finding) => finding.ruleId)).toContain(
      "generic_api_key_assignment"
    );
    expect(report).toContain("value=[REDACTED]");
    expect(report).not.toContain(dummyToken);
  });

  it("keeps the Week 1 scanner rule set explicit and auditable", () => {
    expect(SECRET_SCAN_RULES.map((rule) => rule.id).sort()).toEqual([
      "generic_api_key_assignment",
      "github_pat_family",
      "jwt_like_token_family",
      "openai_api_key_family",
      "private_key_header",
      "slack_token_family",
      "slack_webhook_host",
      "supabase_service_role_marker",
      "webhook_signing_secret_family"
    ]);
  });

  it("detects the M1 token families while keeping values redacted", () => {
    const markers = [
      ["sk", "proj", "testonlymarkerwithenoughlength"].join("-"),
      ["xoxb", "testonlymarkerwithenoughlength"].join("-"),
      ["whsec", "testonlymarkerwithenoughlength"].join("_"),
      ["ghp", "testonlymarkerwithenoughlength"].join("_"),
      [
        "eyJtestonlyheaderpart",
        "testonlypayloadpart",
        "testonlysignaturepart"
      ].join(".")
    ];
    const text = markers.join("\n");

    const findings = scanTextForSecrets(text);
    const report = formatFindings(
      findings.map((finding) => ({
        path: "tests/fixtures/security/m1",
        ...finding
      }))
    );

    expect(findings.map((finding) => finding.ruleId).sort()).toEqual([
      "github_pat_family",
      "jwt_like_token_family",
      "openai_api_key_family",
      "slack_token_family",
      "webhook_signing_secret_family"
    ]);
    for (const marker of markers) {
      expect(report).not.toContain(marker);
    }
  });

  it("returns a PASS summary when there are no findings", () => {
    expect(formatFindings([])).toBe("secret-scan: PASS (0 findings)");
  });

  it("skips generated, vendor, and local-state directories during project scans", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "conciergeai-scan-"));
    const markerContent = makeDummySecretAssignment();
    const excludedFixturePaths = [
      "apps/widget/node_modules/vendor.js",
      "packages/shared/.git/config",
      "apps/widget/.next/cache.js",
      "scripts/dist/bundle.js",
      "tests/coverage/report.js",
      "docs/.omc/state.js",
      "packages/shared/.claude/worktrees/local.js"
    ];

    try {
      await writeFixtureFile(
        projectRoot,
        "apps/widget/src/allowed.ts",
        markerContent
      );
      await writeFixtureFile(
        projectRoot,
        "scripts/security/source-like.mjs",
        markerContent
      );
      await Promise.all(
        excludedFixturePaths.map((fixturePath) =>
          writeFixtureFile(projectRoot, fixturePath, markerContent)
        )
      );

      const findings = await scanProject({ cwd: projectRoot });

      expect(findings.map((finding) => finding.path).sort()).toEqual([
        "apps/widget/src/allowed.ts",
        "scripts/security/source-like.mjs"
      ]);
      expect(
        findings.every(
          (finding) => finding.ruleId === "generic_api_key_assignment"
        )
      ).toBe(true);
    } finally {
      await rm(projectRoot, { force: true, recursive: true });
    }
  });
});

describe("CLI argument parsing", () => {
  it("defaults to the source mode and the documented commit window", () => {
    expect(parseCliArgs([])).toEqual({
      mode: "source",
      commits: DEFAULT_HISTORY_COMMITS
    });
  });

  it("accepts every supported mode", () => {
    for (const mode of SUPPORTED_MODES) {
      expect(parseCliArgs(["--mode", mode]).mode).toBe(mode);
    }
  });

  it("rejects unsupported modes with a clear error", () => {
    expect(() => parseCliArgs(["--mode", "all"])).toThrow(/unsupported --mode/);
  });

  it("requires --commits to be a positive integer", () => {
    expect(() => parseCliArgs(["--commits", "0"])).toThrow(/positive integer/);
    expect(() => parseCliArgs(["--commits", "-3"])).toThrow(/positive integer/);
    expect(() => parseCliArgs(["--commits", "abc"])).toThrow(
      /positive integer/
    );
    expect(parseCliArgs(["--commits", "7"]).commits).toBe(7);
  });
});

describe("diff mode", () => {
  it("scans only changed and untracked source-like files, applying exclusions", async () => {
    const projectRoot = await mkdtemp(path.join(tmpdir(), "conciergeai-diff-"));
    const markerContent = makeDummySecretAssignment();
    const includedRelativePaths = [
      "apps/widget/src/staged.ts",
      "scripts/security/untracked.mjs"
    ];
    const excludedRelativePaths = [
      "apps/widget/node_modules/vendor.js",
      "package-lock.json",
      ".env.local",
      "local-only.txt"
    ];

    try {
      for (const relativePath of [
        ...includedRelativePaths,
        ...excludedRelativePaths
      ]) {
        await writeFixtureFile(projectRoot, relativePath, markerContent);
      }

      const allRelativePaths = [
        ...includedRelativePaths,
        ...excludedRelativePaths
      ];
      const fakePorcelain =
        allRelativePaths.map((relativePath) => `?? ${relativePath}`).join(NUL) +
        NUL;

      const findings = await scanDiff({
        cwd: projectRoot,
        runGit: async () => ({ ok: true, stdout: fakePorcelain })
      });

      expect(findings.map((finding) => finding.path).sort()).toEqual(
        includedRelativePaths.slice().sort()
      );
      expect(
        findings.every(
          (finding) => finding.ruleId === "generic_api_key_assignment"
        )
      ).toBe(true);
    } finally {
      await rm(projectRoot, { force: true, recursive: true });
    }
  });

  it("skips symlinked changed files so diff mode never follows links into local secrets", async () => {
    const projectRoot = await mkdtemp(
      path.join(tmpdir(), "conciergeai-diff-symlink-")
    );
    const markerContent = makeDummySecretAssignment();
    const symlinkPath = "apps/widget/src/link.ts";

    try {
      await writeFixtureFile(projectRoot, ".env.local", markerContent);
      await mkdir(path.dirname(path.join(projectRoot, symlinkPath)), {
        recursive: true
      });
      await symlink(
        path.join(projectRoot, ".env.local"),
        path.join(projectRoot, symlinkPath)
      );

      const fakePorcelain = `?? ${symlinkPath}${NUL}`;
      const findings = await scanDiff({
        cwd: projectRoot,
        runGit: async () => ({ ok: true, stdout: fakePorcelain })
      });

      expect(findings).toEqual([]);
    } finally {
      await rm(projectRoot, { force: true, recursive: true });
    }
  });

  it("passes cleanly when git is unavailable or there is nothing to scan", async () => {
    const projectRoot = await mkdtemp(
      path.join(tmpdir(), "conciergeai-diff-empty-")
    );
    try {
      const noGit = await scanDiff({
        cwd: projectRoot,
        runGit: async () => ({ ok: false, error: new Error("git not found") })
      });
      expect(noGit).toEqual([]);

      const empty = await scanDiff({
        cwd: projectRoot,
        runGit: async () => ({ ok: true, stdout: "" })
      });
      expect(empty).toEqual([]);
    } finally {
      await rm(projectRoot, { force: true, recursive: true });
    }
  });

  it("uses the new path on rename entries and skips the original token", async () => {
    const projectRoot = await mkdtemp(
      path.join(tmpdir(), "conciergeai-diff-rename-")
    );
    const markerContent = makeDummySecretAssignment();
    const newPath = "apps/widget/src/renamed.ts";
    const oldPath = "apps/widget/src/original.ts";

    try {
      await writeFixtureFile(projectRoot, newPath, markerContent);
      const fakePorcelain = `R  ${newPath}${NUL}${oldPath}${NUL}`;

      const findings = await scanDiff({
        cwd: projectRoot,
        runGit: async () => ({ ok: true, stdout: fakePorcelain })
      });

      expect(findings.map((finding) => finding.path)).toEqual([newPath]);
    } finally {
      await rm(projectRoot, { force: true, recursive: true });
    }
  });
});

describe("history mode", () => {
  it("scans added lines from synthetic git history without printing values", async () => {
    const dummyAssignment = makeDummySecretAssignment();
    const fakePatch = [
      "commit abc123",
      "Author: Test <test@example.com>",
      "Date:   Thu May 8 00:00:00 2026 +0900",
      "",
      "    history slice change",
      "",
      "diff --git a/apps/widget/src/secret.ts b/apps/widget/src/secret.ts",
      "index 0000000..1111111 100644",
      "--- a/apps/widget/src/secret.ts",
      "+++ b/apps/widget/src/secret.ts",
      "@@ -0,0 +1,1 @@",
      `+${dummyAssignment}`,
      "",
      "diff --git a/package-lock.json b/package-lock.json",
      "index 2222222..3333333 100644",
      "--- a/package-lock.json",
      "+++ b/package-lock.json",
      "@@ -0,0 +1,1 @@",
      `+${dummyAssignment}`
    ].join("\n");

    const findings = await scanHistory({
      cwd: "/tmp/does-not-need-to-exist",
      commits: 3,
      runGit: async () => ({ ok: true, stdout: fakePatch })
    });

    expect(findings.map((finding) => finding.path)).toEqual([
      "apps/widget/src/secret.ts"
    ]);
    expect(findings[0].ruleId).toBe("generic_api_key_assignment");
    expect(findings[0].count).toBeGreaterThan(0);
    const formatted = formatFindings(findings);
    expect(formatted).toContain("value=[REDACTED]");
    expect(formatted).not.toContain("dummy-secret-history-marker");
  });

  it("ignores excluded paths in patch headers", async () => {
    const dummyAssignment = makeDummySecretAssignment();
    const fakePatch = [
      "diff --git a/.git/config b/.git/config",
      "index 4444444..5555555 100644",
      "--- a/.git/config",
      "+++ b/.git/config",
      "@@ -0,0 +1,1 @@",
      `+${dummyAssignment}`,
      "",
      "diff --git a/apps/widget/node_modules/vendor.js b/apps/widget/node_modules/vendor.js",
      "index 6666666..7777777 100644",
      "--- a/apps/widget/node_modules/vendor.js",
      "+++ b/apps/widget/node_modules/vendor.js",
      "@@ -0,0 +1,1 @@",
      `+${dummyAssignment}`
    ].join("\n");

    const findings = await scanHistory({
      cwd: "/tmp/does-not-need-to-exist",
      commits: 3,
      runGit: async () => ({ ok: true, stdout: fakePatch })
    });

    expect(findings).toEqual([]);
  });

  it("passes cleanly when git is unavailable", async () => {
    const findings = await scanHistory({
      cwd: "/tmp/does-not-need-to-exist",
      commits: 3,
      runGit: async () => ({ ok: false, error: new Error("git missing") })
    });
    expect(findings).toEqual([]);
  });
});

async function writeFixtureFile(
  projectRoot: string,
  relativePath: string,
  content: string
) {
  const fixturePath = path.join(projectRoot, relativePath);
  await mkdir(path.dirname(fixturePath), { recursive: true });
  await writeFile(fixturePath, content, { flag: "w" });
}

function makeDummySecretAssignment() {
  const keyName = ["api", "key"].join("_");
  const dummyValue = "test-only-marker-with-enough-length";
  return `const ${keyName} = '${dummyValue}';`;
}

#!/usr/bin/env node
import { execFile } from "node:child_process";
import { lstat, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const DEFAULT_SCAN_ROOTS = [
  "apps",
  "packages",
  "scripts",
  "docs",
  "tests"
];

// Week 1 M1 scaffold introduces three modes that all reuse the same redacted
// path/rule/count reporting contract. Matched secret values are never printed.
//
// - source  (default): walk DEFAULT_SCAN_ROOTS like the M0 scanner.
// - diff             : scan tracked-but-modified, staged, and untracked
//                      source-like files in the current working tree. If git
//                      is unavailable or there is nothing to scan it passes
//                      cleanly with zero findings.
// - history          : scan recent git history patch text with the same rules
//                      and redaction. Output stays at path/rule/count and
//                      never includes matched secret values.

const NUL = String.fromCharCode(0);

const DEFAULT_EXCLUDED_PARTS = new Set([
  ".git",
  ".omc",
  ".next",
  ".turbo",
  ".vite",
  "coverage",
  "dist",
  "build",
  "node_modules"
]);

const DEFAULT_EXCLUDED_PART_SEQUENCES = [[".claude", "worktrees"]];

const DEFAULT_EXCLUDED_FILENAMES = new Set([
  ".DS_Store",
  "package-lock.json",
  "npm-shrinkwrap.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "tsconfig.tsbuildinfo"
]);

const DEFAULT_EXCLUDED_FILE_PREFIXES = [".env"];
const DEFAULT_INCLUDED_DIFF_ROOTS = [
  "apps",
  "packages",
  "scripts",
  "docs",
  "tests",
  ".github"
];
const DEFAULT_INCLUDED_DIFF_ROOT_FILES = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "CHANGELOG.md",
  "REVIEW.md",
  "package.json",
  "tsconfig.base.json",
  "tsconfig.json"
]);

const DEFAULT_EXCLUDED_PATH_SUFFIXES = [
  "tests/fixtures/security/dummy-secret-markers.fixture.txt"
];

export const SUPPORTED_MODES = Object.freeze(["source", "diff", "history"]);
export const DEFAULT_HISTORY_COMMITS = 10;

export const SECRET_SCAN_RULES = Object.freeze([
  {
    id: "slack_webhook_host",
    pattern: /hooks\.slack\.com/giu
  },
  {
    id: "generic_api_key_assignment",
    pattern:
      /\b(?:api[_-]?key|secret|token|webhook)\b\s*[:=]\s*["'][A-Za-z0-9_./+=-]{20,}["']/giu
  },
  {
    id: "private_key_header",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/gu
  },
  {
    id: "supabase_service_role_marker",
    pattern:
      /\bSUPABASE_SERVICE_ROLE_KEY\b\s*[:=]\s*["'][A-Za-z0-9_./+=-]{20,}["']/giu
  },
  {
    id: "openai_api_key_family",
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/gu
  },
  {
    id: "slack_token_family",
    pattern: /\bxox[A-Za-z0-9]-[A-Za-z0-9-]{20,}/giu
  },
  {
    id: "webhook_signing_secret_family",
    pattern: /\bwhsec_[A-Za-z0-9]{20,}/gu
  },
  {
    id: "github_pat_family",
    pattern: /\bgh[pous]_[A-Za-z0-9_]{20,}/gu
  },
  {
    id: "jwt_like_token_family",
    pattern:
      /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/gu
  }
]);

export function scanTextForSecrets(text, rules = SECRET_SCAN_RULES) {
  return rules.flatMap((rule) => {
    const matches = text.match(rule.pattern);
    if (matches === null) {
      return [];
    }

    return [
      {
        ruleId: rule.id,
        count: matches.length
      }
    ];
  });
}

export async function scanProject(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const roots = options.roots ?? DEFAULT_SCAN_ROOTS;
  const findings = [];

  for (const root of roots) {
    const absoluteRoot = path.join(cwd, root);
    if (!(await pathExists(absoluteRoot))) {
      continue;
    }

    for await (const filePath of walkFiles(absoluteRoot, cwd)) {
      if (shouldSkipPath(filePath, cwd)) {
        continue;
      }

      const content = await readFile(filePath, "utf8");
      const relativePath = toPosixPath(path.relative(cwd, filePath));
      for (const finding of scanTextForSecrets(content)) {
        findings.push({
          path: relativePath,
          ruleId: finding.ruleId,
          count: finding.count
        });
      }
    }
  }

  return findings;
}

export async function scanDiff(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const runner = options.runGit ?? defaultGitRunner;
  const findings = [];

  const changed = await collectDiffPaths(cwd, runner);
  for (const relativePath of changed) {
    if (
      shouldSkipRelativePath(relativePath) ||
      !isIncludedDiffPath(relativePath)
    ) {
      continue;
    }

    const absolutePath = path.join(cwd, relativePath);
    if (!(await pathExists(absolutePath))) {
      continue;
    }

    const fileStat = await lstat(absolutePath);
    if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
      continue;
    }

    const content = await readFile(absolutePath, "utf8");
    const posixPath = toPosixPath(relativePath);
    for (const finding of scanTextForSecrets(content)) {
      findings.push({
        path: posixPath,
        ruleId: finding.ruleId,
        count: finding.count
      });
    }
  }

  return findings;
}

export async function scanHistory(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const commits = Math.max(
    1,
    Number(options.commits ?? DEFAULT_HISTORY_COMMITS)
  );
  const runner = options.runGit ?? defaultGitRunner;

  const patchText = await collectHistoryPatch(cwd, commits, runner);
  if (patchText === null) {
    return [];
  }

  const perFileMatches = new Map();
  for (const segment of splitPatchByFile(patchText)) {
    if (segment.path === null || shouldSkipRelativePath(segment.path)) {
      continue;
    }

    const additions = segment.additions;
    if (additions.length === 0) {
      continue;
    }

    const text = additions.join("\n");
    for (const finding of scanTextForSecrets(text)) {
      const key = segment.path + "::" + finding.ruleId;
      const current = perFileMatches.get(key) ?? {
        path: segment.path,
        ruleId: finding.ruleId,
        count: 0
      };
      current.count += finding.count;
      perFileMatches.set(key, current);
    }
  }

  return Array.from(perFileMatches.values());
}

export function formatFindings(findings) {
  if (findings.length === 0) {
    return "secret-scan: PASS (0 findings)";
  }

  const lines = findings.map(
    (finding) =>
      `secret-scan: ${finding.path} ${finding.ruleId} count=${finding.count} value=[REDACTED]`
  );
  return [
    `secret-scan: FAIL (${findings.length} file/rule findings)`,
    ...lines
  ].join("\n");
}

export function parseCliArgs(argv) {
  const result = { mode: "source", commits: DEFAULT_HISTORY_COMMITS };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--mode") {
      const value = argv[index + 1];
      if (!SUPPORTED_MODES.includes(value)) {
        throw new Error(
          `unsupported --mode value: ${String(value)} (expected one of ${SUPPORTED_MODES.join(", ")})`
        );
      }
      result.mode = value;
      index += 1;
      continue;
    }
    if (arg === "--commits") {
      const value = Number(argv[index + 1]);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(
          `--commits must be a positive integer, got: ${String(argv[index + 1])}`
        );
      }
      result.commits = Math.floor(value);
      index += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }
  }
  return result;
}

async function* walkFiles(directory, cwd) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (shouldSkipPath(absolutePath, cwd)) {
      continue;
    }

    if (entry.isDirectory()) {
      yield* walkFiles(absolutePath, cwd);
      continue;
    }

    if (entry.isFile()) {
      yield absolutePath;
    }
  }
}

function shouldSkipPath(filePath, cwd = process.cwd()) {
  const relative = toPosixPath(path.relative(cwd, filePath));
  return shouldSkipRelativePath(relative);
}

function shouldSkipRelativePath(relative) {
  if (relative === "" || relative.startsWith("..")) {
    return true;
  }

  const parts = relative.split("/");

  if (parts.some((part) => DEFAULT_EXCLUDED_PARTS.has(part))) {
    return true;
  }

  if (
    DEFAULT_EXCLUDED_PART_SEQUENCES.some((sequence) =>
      hasPartSequence(parts, sequence)
    )
  ) {
    return true;
  }

  const fileName = parts[parts.length - 1];
  if (DEFAULT_EXCLUDED_FILENAMES.has(fileName)) {
    return true;
  }

  if (
    DEFAULT_EXCLUDED_FILE_PREFIXES.some((prefix) => fileName.startsWith(prefix))
  ) {
    return true;
  }

  return DEFAULT_EXCLUDED_PATH_SUFFIXES.some((suffix) =>
    relative.endsWith(suffix)
  );
}

function isIncludedDiffPath(relative) {
  const parts = relative.split("/");
  if (parts.length === 1) {
    return DEFAULT_INCLUDED_DIFF_ROOT_FILES.has(relative);
  }
  return DEFAULT_INCLUDED_DIFF_ROOTS.includes(parts[0]);
}

function hasPartSequence(parts, sequence) {
  return parts.some((_, index) =>
    sequence.every(
      (part, sequenceIndex) => parts[index + sequenceIndex] === part
    )
  );
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

async function defaultGitRunner(args, cwd) {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      maxBuffer: 64 * 1024 * 1024
    });
    return { ok: true, stdout };
  } catch (error) {
    return { ok: false, error };
  }
}

async function collectDiffPaths(cwd, runner) {
  const result = await runner(
    ["status", "--porcelain=v1", "--untracked-files=all", "-z"],
    cwd
  );
  if (!result.ok) {
    return [];
  }

  const stdout = result.stdout.toString();
  if (stdout.length === 0) {
    return [];
  }

  const tokens = stdout.split(NUL).filter((token) => token.length > 0);
  const paths = new Set();

  let cursor = 0;
  while (cursor < tokens.length) {
    const entry = tokens[cursor];
    cursor += 1;

    if (entry.length < 4) {
      continue;
    }

    const xy = entry.slice(0, 2);
    const rest = entry.slice(3);

    if (xy[0] === "R" || xy[0] === "C" || xy[1] === "R" || xy[1] === "C") {
      // rename/copy: the next NUL token is the original path; we keep the new path.
      cursor += 1;
      paths.add(rest);
      continue;
    }

    paths.add(rest);
  }

  return Array.from(paths);
}

async function collectHistoryPatch(cwd, commits, runner) {
  const result = await runner(
    [
      "log",
      "-n",
      String(commits),
      "--no-color",
      "-m",
      "--unified=0",
      "--patch"
    ],
    cwd
  );
  if (!result.ok) {
    return null;
  }
  return result.stdout.toString();
}

function splitPatchByFile(patchText) {
  const lines = patchText.split("\n");
  const segments = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      if (current !== null) {
        segments.push(current);
      }
      current = { path: extractDiffPath(line), additions: [] };
      continue;
    }

    if (current === null) {
      continue;
    }

    if (line.startsWith("+++ ")) {
      const candidate = parseFileHeader(line);
      if (candidate !== null) {
        current.path = candidate;
      }
      continue;
    }

    if (
      line.startsWith("--- ") ||
      line.startsWith("@@") ||
      line.startsWith("index ")
    ) {
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      current.additions.push(line.slice(1));
    }
  }

  if (current !== null) {
    segments.push(current);
  }

  return segments;
}

function extractDiffPath(line) {
  const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
  if (match === null) {
    return null;
  }
  return match[2];
}

function parseFileHeader(line) {
  const value = line.slice(4).trim();
  if (value === "/dev/null") {
    return null;
  }
  if (value.startsWith("b/")) {
    return value.slice(2);
  }
  return value;
}

function printHelp() {
  const text = [
    "Usage: node scripts/security-scan.mjs [--mode source|diff|history] [--commits N]",
    "",
    "Modes:",
    "  source   (default) Walk source-like roots (apps, packages, scripts, docs, tests).",
    "  diff     Scan files changed in the current working tree, including untracked",
    "           source-like files. Passes cleanly when git is unavailable or empty.",
    "  history  Scan added lines from the most recent N commits with redacted",
    "           path/rule/count output. Defaults to N=10.",
    "",
    "Output never includes matched secret values."
  ].join("\n");
  console.log(text);
}

async function main() {
  let parsed;
  try {
    parsed = parseCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(
      `secret-scan: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 2;
    return;
  }

  if (parsed.help === true) {
    printHelp();
    return;
  }

  let findings;
  if (parsed.mode === "diff") {
    findings = await scanDiff();
  } else if (parsed.mode === "history") {
    findings = await scanHistory({ commits: parsed.commits });
  } else {
    findings = await scanProject();
  }

  console.log(formatFindings(findings));
  if (findings.length > 0) {
    process.exitCode = 1;
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFilePath) {
  await main();
}

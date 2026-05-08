#!/usr/bin/env node
import { lstat, readFile, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  assertPathStaysInsideWorkspace,
  assertSafeMarkdownTargetPath,
  sanitizeForReport
} from "./markdown-target-guard.mjs";

// Week 1 scaffolding-only validator. Checks that a markdown PR body or PR
// template file contains every required H2 section header from
// FINAL_ALIGNMENT § 5. It does NOT inspect:
// - user-facing Korean copy or production scenario content
// - cost ledger numeric values, scope checkbox state, or PR number values
// - any environment, secret, or external API surface
//
// Output boundary: the validator echoes only the target path (sanitized) and
// the names of required sections. Markdown body content, unknown headings,
// and read-error reasons are sanitized before being printed so a path or file
// carrying control characters / newlines cannot distort log output. Path
// safety helpers (`assertSafeMarkdownTargetPath`,
// `assertPathStaysInsideWorkspace`) and the report sanitizer
// (`sanitizeForReport`) are shared with `validate-pr-evidence.mjs` via
// `markdown-target-guard.mjs` so both validators reject identical inputs
// with identical wording: the target must be a markdown file that resolves
// inside the repo workspace, must not be a symlink, and must not pass
// through `.env*` segments.

const DEFAULT_PR_TEMPLATE_PATH = ".github/pull_request_template.md";

export { sanitizeForReport, assertSafeMarkdownTargetPath, assertPathStaysInsideWorkspace };

export const REQUIRED_PR_TEMPLATE_SECTIONS = Object.freeze([
  "Scope",
  "PRD Mapping",
  "Changes",
  "Required Extra Evidence",
  "Tests",
  "Computer-Use Verification",
  "Secret Scan",
  "Cost Ledger"
]);

export function parsePrTemplateH2Headings(markdown) {
  if (typeof markdown !== "string") {
    throw new TypeError("validate-pr-template: markdown input must be a string");
  }

  const lines = markdown.split(/\r?\n/);
  const headings = [];
  let inFence = false;

  for (const line of lines) {
    if (/^\s{0,3}```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }

    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match !== null && typeof match[1] === "string" && match[1].length > 0) {
      headings.push(match[1]);
    }
  }

  return headings;
}

export function validatePrTemplateMarkdown(markdown, options = {}) {
  const required = options.requiredSections ?? REQUIRED_PR_TEMPLATE_SECTIONS;
  const headings = parsePrTemplateH2Headings(markdown);

  const counts = new Map();
  for (const heading of headings) {
    counts.set(heading, (counts.get(heading) ?? 0) + 1);
  }

  const present = [];
  const missing = [];
  const duplicated = [];

  for (const section of required) {
    const count = counts.get(section) ?? 0;
    if (count === 0) {
      missing.push(section);
      continue;
    }
    present.push(section);
    if (count > 1) {
      duplicated.push(section);
    }
  }

  const requiredSet = new Set(required);
  let unknownHeadingCount = 0;
  const seenUnknown = new Set();
  for (const heading of headings) {
    if (requiredSet.has(heading)) {
      continue;
    }
    if (seenUnknown.has(heading)) {
      continue;
    }
    seenUnknown.add(heading);
    unknownHeadingCount += 1;
  }

  return {
    ok: missing.length === 0 && duplicated.length === 0,
    present,
    missing,
    duplicated,
    unknownHeadingCount
  };
}

export function formatValidationReport(targetPath, result) {
  const reportTargetPath = sanitizeForReport(targetPath);
  if (result.ok) {
    return [
      `validate-pr-template: PASS (${reportTargetPath})`,
      `  required sections present: ${result.present.length}/${REQUIRED_PR_TEMPLATE_SECTIONS.length}`
    ].join("\n");
  }

  const lines = [`validate-pr-template: FAIL (${reportTargetPath})`];
  if (result.missing.length > 0) {
    lines.push(`  missing sections: ${result.missing.join(", ")}`);
  }
  if (result.duplicated.length > 0) {
    lines.push(`  duplicated sections: ${result.duplicated.join(", ")}`);
  }
  return lines.join("\n");
}

export function parseCliArgs(argv) {
  const result = { file: DEFAULT_PR_TEMPLATE_PATH };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }
    if (arg === "--file") {
      const value = argv[index + 1];
      if (typeof value !== "string" || value.length === 0) {
        throw new Error("--file requires a path argument");
      }
      result.file = value;
      index += 1;
      continue;
    }
    if (typeof arg === "string" && !arg.startsWith("-")) {
      result.file = arg;
      continue;
    }
    throw new Error(`unknown argument: ${sanitizeForReport(String(arg))}`);
  }
  return result;
}

function printHelp() {
  const text = [
    "Usage: node scripts/validate-pr-template.mjs [path]",
    "",
    "Validates that a markdown PR body/template contains every required H2",
    "section header from FINAL_ALIGNMENT § 5. Defaults to",
    `${DEFAULT_PR_TEMPLATE_PATH}. Structural check only — does not read user`,
    "copy, secrets, env, or external APIs. Target path must stay inside the",
    "workspace, avoid .env* path segments, and use the .md extension."
  ].join("\n");
  console.log(text);
}

async function main() {
  let parsed;
  try {
    parsed = parseCliArgs(process.argv.slice(2));
  } catch (error) {
    console.error(
      `validate-pr-template: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 2;
    return;
  }

  if (parsed.help === true) {
    printHelp();
    return;
  }

  const targetPath = parsed.file;
  let safeTargetPath;
  try {
    safeTargetPath = assertSafeMarkdownTargetPath(targetPath);
  } catch (error) {
    const reason = sanitizeForReport(error instanceof Error ? error.message : String(error));
    console.error(
      `validate-pr-template: unsafe target ${sanitizeForReport(targetPath)}: ${reason}`
    );
    process.exitCode = 2;
    return;
  }

  let markdown;
  try {
    const targetStat = await lstat(safeTargetPath);
    if (targetStat.isSymbolicLink()) {
      throw new Error("target path must not be a symlink");
    }
    const [realTargetPath, realWorkspacePath] = await Promise.all([
      realpath(safeTargetPath),
      realpath(process.cwd())
    ]);
    assertPathStaysInsideWorkspace(realTargetPath, realWorkspacePath);
    markdown = await readFile(realTargetPath, "utf8");
  } catch (error) {
    const reason = sanitizeForReport(error instanceof Error ? error.message : String(error));
    console.error(
      `validate-pr-template: cannot read ${sanitizeForReport(targetPath)}: ${reason}`
    );
    process.exitCode = 2;
    return;
  }

  const result = validatePrTemplateMarkdown(markdown);
  console.log(formatValidationReport(targetPath, result));
  if (!result.ok) {
    process.exitCode = 1;
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFilePath) {
  await main();
}

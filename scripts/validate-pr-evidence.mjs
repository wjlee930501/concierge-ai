#!/usr/bin/env node
import { lstat, readFile, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  assertPathStaysInsideWorkspace,
  assertSafeMarkdownTargetPath,
  sanitizeForReport
} from "./markdown-target-guard.mjs";

// Week 1 scaffolding-only validator for the PR evidence template.
// Verifies that the markdown contains every required H2 section heading and
// every required Cost Ledger key label (as inline `code` tokens within the
// Cost Ledger section). It does NOT inspect:
// - user-facing Korean copy or production scenario content
// - cost ledger numeric values, scope checkbox state, or PR number values
// - any environment, secret, or external API surface
//
// Output boundary: the validator echoes only the target path, required
// section names, and required Cost Ledger key labels. It never echoes
// markdown body content, inline-code tokens that are not in the required
// label list, or the contents of a target rejected by the safety checks.
// The echoed target path is run through `sanitizeForReport` (shared with
// `validate-pr-template.mjs` via `markdown-target-guard.mjs`) so a path
// carrying control characters cannot distort log output. Path safety
// helpers (`assertSafeMarkdownTargetPath`, `assertPathStaysInsideWorkspace`)
// are also imported from the shared guard module so both validators reject
// identical inputs with identical wording.

const DEFAULT_PR_TEMPLATE_PATH = ".github/pull_request_template.md";

export { sanitizeForReport, assertSafeMarkdownTargetPath, assertPathStaysInsideWorkspace };

export const REQUIRED_PR_EVIDENCE_SECTIONS = Object.freeze([
  "Scope",
  "PRD Mapping",
  "Changes",
  "Tests",
  "Computer-Use Verification",
  "Secret Scan",
  "Cost Ledger"
]);

export const REQUIRED_COST_LEDGER_KEY_LABELS = Object.freeze([
  "pr_number",
  "computer_use_minutes",
  "claude_review_tokens_estimate",
  "llm_calls_estimate",
  "running_total_week",
  "week_id"
]);

const COST_LEDGER_HEADING = "Cost Ledger";

export const REQUIRED_PR_EVIDENCE_FIELD_LABELS = Object.freeze([
  Object.freeze({
    section: "PRD Mapping",
    labels: Object.freeze([
      "PRD section / scenario ID:",
      "FINAL_ALIGNMENT checklist items:"
    ])
  }),
  Object.freeze({
    section: "Tests",
    labels: Object.freeze(["Unit:", "Integration:", "E2E:", "Commands run:"])
  }),
  Object.freeze({
    section: "Computer-Use Verification",
    labels: Object.freeze([
      "Required: yes / no",
      "Reason:",
      "Scenario ID / viewport / steps, if required:",
      "Staging browser evidence placeholder:"
    ])
  })
]);

function splitLinesPreservingFences(markdown) {
  const lines = markdown.split(/\r?\n/);
  return lines;
}

export function parseH2Headings(markdown) {
  if (typeof markdown !== "string") {
    throw new TypeError("validate-pr-evidence: markdown input must be a string");
  }

  const lines = splitLinesPreservingFences(markdown);
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

export function extractSectionBody(markdown, headingTitle) {
  if (typeof markdown !== "string") {
    throw new TypeError("validate-pr-evidence: markdown input must be a string");
  }
  if (typeof headingTitle !== "string" || headingTitle.length === 0) {
    throw new TypeError("validate-pr-evidence: headingTitle must be a non-empty string");
  }

  const lines = splitLinesPreservingFences(markdown);
  const collected = [];
  let inFence = false;
  let inside = false;

  for (const line of lines) {
    if (/^\s{0,3}```/.test(line)) {
      inFence = !inFence;
      if (inside) {
        collected.push(line);
      }
      continue;
    }

    if (!inFence) {
      const match = line.match(/^##\s+(.+?)\s*$/);
      if (match !== null) {
        if (inside) {
          break;
        }
        if (match[1] === headingTitle) {
          inside = true;
          continue;
        }
      }
    }

    if (inside) {
      collected.push(line);
    }
  }

  return collected.join("\n");
}

export function findInlineCodeTokens(body) {
  if (typeof body !== "string") {
    throw new TypeError("validate-pr-evidence: body must be a string");
  }
  const tokens = new Set();
  const lines = body.split(/\r?\n/);
  let inFence = false;
  for (const line of lines) {
    if (/^\s{0,3}```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    const pattern = /`([^`\n]+)`/g;
    let match;
    while ((match = pattern.exec(line)) !== null) {
      tokens.add(match[1]);
    }
  }
  return tokens;
}

export function validatePrEvidenceMarkdown(markdown, options = {}) {
  const requiredSections =
    options.requiredSections ?? REQUIRED_PR_EVIDENCE_SECTIONS;
  const requiredCostLedgerKeys =
    options.requiredCostLedgerKeys ?? REQUIRED_COST_LEDGER_KEY_LABELS;

  const headings = parseH2Headings(markdown);
  const counts = new Map();
  for (const heading of headings) {
    counts.set(heading, (counts.get(heading) ?? 0) + 1);
  }

  const presentSections = [];
  const missingSections = [];
  const duplicatedSections = [];

  for (const section of requiredSections) {
    const count = counts.get(section) ?? 0;
    if (count === 0) {
      missingSections.push(section);
      continue;
    }
    presentSections.push(section);
    if (count > 1) {
      duplicatedSections.push(section);
    }
  }

  let missingCostLedgerKeys = [];
  let costLedgerSectionPresent = (counts.get(COST_LEDGER_HEADING) ?? 0) > 0;
  const missingFieldLabels = [];

  if (costLedgerSectionPresent) {
    const body = extractSectionBody(markdown, COST_LEDGER_HEADING);
    const tokens = findInlineCodeTokens(body);
    for (const key of requiredCostLedgerKeys) {
      if (!tokens.has(key)) {
        missingCostLedgerKeys.push(key);
      }
    }
  } else {
    missingCostLedgerKeys = [...requiredCostLedgerKeys];
  }

  for (const requirement of REQUIRED_PR_EVIDENCE_FIELD_LABELS) {
    if ((counts.get(requirement.section) ?? 0) === 0) {
      for (const label of requirement.labels) {
        missingFieldLabels.push(`${requirement.section} > ${label}`);
      }
      continue;
    }

    const body = extractSectionBody(markdown, requirement.section);
    for (const label of requirement.labels) {
      if (!body.includes(label)) {
        missingFieldLabels.push(`${requirement.section} > ${label}`);
      }
    }
  }

  const ok =
    missingSections.length === 0 &&
    duplicatedSections.length === 0 &&
    missingCostLedgerKeys.length === 0 &&
    missingFieldLabels.length === 0;

  return {
    ok,
    presentSections,
    missingSections,
    duplicatedSections,
    missingCostLedgerKeys,
    missingFieldLabels
  };
}

export function formatReport(targetPath, result) {
  const reportTargetPath = sanitizeForReport(targetPath);
  if (result.ok) {
    return [
      `validate-pr-evidence: PASS (${reportTargetPath})`,
      `  required sections present: ${result.presentSections.length}/${REQUIRED_PR_EVIDENCE_SECTIONS.length}`,
      `  required cost ledger labels present: ${REQUIRED_COST_LEDGER_KEY_LABELS.length}/${REQUIRED_COST_LEDGER_KEY_LABELS.length}`,
      "  cost ledger labels include 5 top-level fields plus nested running_total_week.week_id"
    ].join("\n");
  }

  const lines = [`validate-pr-evidence: FAIL (${reportTargetPath})`];
  if (result.missingSections.length > 0) {
    lines.push(`  missing sections: ${result.missingSections.join(", ")}`);
  }
  if (result.duplicatedSections.length > 0) {
    lines.push(`  duplicated sections: ${result.duplicatedSections.join(", ")}`);
  }
  if (result.missingCostLedgerKeys.length > 0) {
    lines.push(
      `  missing cost ledger keys: ${result.missingCostLedgerKeys.join(", ")}`
    );
  }
  if (result.missingFieldLabels.length > 0) {
    lines.push(
      `  missing required field labels: ${result.missingFieldLabels.join(", ")}`
    );
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
    "Usage: node scripts/validate-pr-evidence.mjs [path]",
    "",
    "Validates that a markdown PR body/template contains every required H2",
    "section heading and every required Cost Ledger label. Defaults to",
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
      `validate-pr-evidence: ${error instanceof Error ? error.message : String(error)}`
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
      `validate-pr-evidence: unsafe target ${sanitizeForReport(targetPath)}: ${reason}`
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
      `validate-pr-evidence: cannot read ${sanitizeForReport(targetPath)}: ${reason}`
    );
    process.exitCode = 2;
    return;
  }

  const result = validatePrEvidenceMarkdown(markdown);
  console.log(formatReport(targetPath, result));
  if (!result.ok) {
    process.exitCode = 1;
  }
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFilePath) {
  await main();
}

#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TIER1_EXPRESSIONS = ["neutral", "smile", "surprise", "thinking"];
const REQUIRED_ACTION_TYPES = [
  "scroll_to",
  "highlight",
  "move",
  "expression_change",
  "wait"
];

export async function collectDesignPolishEvidence(input = {}) {
  const repoRoot = input.repoRoot ?? path.resolve(fileURLToPath(import.meta.url), "..", "..");
  const scenarioPath = path.join(
    repoRoot,
    "tests",
    "fixtures",
    "scenarios",
    "placeholder_v0.json"
  );
  const checklistPath = path.join(
    repoRoot,
    "docs",
    "host-integration",
    "DESIGN_POLISH_STAGING_CHECKLIST.md"
  );
  const assetDir = path.join(repoRoot, "apps", "widget", "assets", "avatar");
  const scenario = JSON.parse(await readFile(scenarioPath, "utf8"));
  const beats = collectBeats(scenario);
  const actionTypes = Array.from(
    new Set(beats.map((beat) => beat.action?.type).filter(Boolean))
  ).sort();

  return {
    scenarioPath,
    checklistPath,
    tier1Assets: TIER1_EXPRESSIONS.map((expression) => ({
      expression,
      webp: path.join(assetDir, `concierge-${expression}-256.webp`),
      avif: path.join(assetDir, `concierge-${expression}-256.avif`)
    })).filter((asset) => existsSync(asset.webp) && existsSync(asset.avif)),
    totalBeatCount: beats.length,
    actionTypes,
    stagingChecklistItems: await countChecklistItems(checklistPath)
  };
}

export function validateDesignPolishEvidence(evidence) {
  const failures = [];

  if (evidence.tier1Assets.length !== TIER1_EXPRESSIONS.length) {
    failures.push("Tier 1 expression WebP/AVIF assets are incomplete");
  }

  if (evidence.totalBeatCount < 25) {
    failures.push("Placeholder scenario must expose at least 25 micro-beats");
  }

  for (const actionType of REQUIRED_ACTION_TYPES) {
    if (!evidence.actionTypes.includes(actionType)) {
      failures.push(`Missing micro-beat action type: ${actionType}`);
    }
  }

  if (evidence.stagingChecklistItems < 10) {
    failures.push("Staging validation checklist must include at least 10 checks");
  }

  return failures;
}

function collectBeats(scenario) {
  const beats = [];
  for (const chapter of scenario.chapters ?? []) {
    for (const section of chapter.sections ?? []) {
      beats.push(...(section.beats ?? []));
    }
  }
  return beats;
}

async function countChecklistItems(checklistPath) {
  if (!existsSync(checklistPath)) return 0;
  const markdown = await readFile(checklistPath, "utf8");
  return markdown
    .split("\n")
    .filter((line) => /^- \[[ xX]\]/u.test(line.trim())).length;
}

async function main() {
  const repoRoot = process.cwd();
  const evidence = await collectDesignPolishEvidence({ repoRoot });
  const failures = validateDesignPolishEvidence(evidence);

  if (failures.length > 0) {
    console.error("design-polish-contract: FAIL");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("design-polish-contract: PASS");
  console.log(
    JSON.stringify(
      {
        tier1_assets: evidence.tier1Assets.length,
        total_beats: evidence.totalBeatCount,
        action_types: evidence.actionTypes,
        staging_checklist_items: evidence.stagingChecklistItems
      },
      null,
      2
    )
  );
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === currentFile) {
  await main();
}

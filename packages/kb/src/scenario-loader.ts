import {
  parseScenario,
  safeParseScenario,
  type Scenario
} from "@conciergeai/shared";
import { assertNoBannedVocab, findBannedVocabHits } from "./banned-vocab";

export type LoadScenarioResult =
  | { readonly ok: true; readonly scenario: Scenario }
  | { readonly ok: false; readonly errors: readonly string[] };

const PRODUCTION_PATH_PATTERN = /^packages\/kb\/scenarios\//;

export function loadScenarioFromJson(
  raw: unknown,
  options: {
    readonly sourcePath: string;
    readonly allowProduction?: boolean;
  }
): LoadScenarioResult {
  const errors: string[] = [];
  const isProductionPath = PRODUCTION_PATH_PATTERN.test(options.sourcePath);
  const allowProduction = options.allowProduction === true;

  const parsed = safeParseScenario(raw);
  if (!parsed.ok) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`
      )
    };
  }
  const scenario = parsed.value;

  if (isProductionPath && !allowProduction) {
    if (scenario.isPlaceholder !== false) {
      errors.push(
        `Scenario at production path ${options.sourcePath} must have isPlaceholder=false; received ${scenario.isPlaceholder}.`
      );
    }
  }

  if (!isProductionPath && scenario.isPlaceholder !== true) {
    errors.push(
      `Scenario at non-production path ${options.sourcePath} must have isPlaceholder=true (FINAL_ALIGNMENT §3).`
    );
  }

  for (const text of collectScenarioCopy(scenario)) {
    const hits = findBannedVocabHits(text);
    if (hits.length > 0) {
      errors.push(
        `Banned vocabulary in ${options.sourcePath}: ${hits.map((hit) => hit.pattern).join(", ")}`
      );
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, scenario };
}

export function loadScenarioStrict(
  raw: unknown,
  options: { readonly sourcePath: string; readonly allowProduction?: boolean }
): Scenario {
  const result = loadScenarioFromJson(raw, options);
  if (!result.ok) {
    throw new Error(
      `Failed to load scenario at ${options.sourcePath}:\n${result.errors.join("\n")}`
    );
  }
  return result.scenario;
}

export function ensureScenarioPlaceholderClean(scenario: Scenario): void {
  for (const text of collectScenarioCopy(scenario)) {
    assertNoBannedVocab(text, `scenario ${scenario.id}`);
  }
}

export function expectsPlaceholder(scenario: Scenario): boolean {
  return scenario.isPlaceholder === true;
}

function* collectScenarioCopy(scenario: Scenario): Iterable<string> {
  yield scenario.heroBubble.message;
  for (const chip of scenario.heroBubble.quickChips) {
    yield chip.label;
  }
  for (const step of scenario.steps) {
    yield step.popover.label;
    yield step.popover.title;
    yield step.popover.body;
    for (const choice of step.choices) {
      yield choice.label;
    }
  }
  yield scenario.leadForm.title;
  yield scenario.leadForm.subtitle;
  yield scenario.leadForm.thanksMessage;
  yield scenario.leadForm.retentionDescription;
  for (const field of scenario.leadForm.fields) {
    yield field.label;
    if (field.placeholder !== undefined) {
      yield field.placeholder;
    }
  }
  for (const consent of scenario.leadForm.pipaConsents) {
    yield consent.label;
  }
  if (scenario.placeholderNotice !== undefined) {
    yield scenario.placeholderNotice;
  }
}

export const SCENARIO_PRODUCTION_PATH_PREFIX = "packages/kb/scenarios/";

import { safeParseScenario, type Scenario } from "@conciergeai/shared";

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

export function expectsPlaceholder(scenario: Scenario): boolean {
  return scenario.isPlaceholder === true;
}

export const SCENARIO_PRODUCTION_PATH_PREFIX = "packages/kb/scenarios/";

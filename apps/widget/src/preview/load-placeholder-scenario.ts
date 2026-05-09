import { loadScenarioStrict } from "@conciergeai/kb";
import type { Scenario } from "@conciergeai/shared";
import placeholderJson from "../../../../tests/fixtures/scenarios/placeholder_v0.json";

export function loadPlaceholderScenario(): Scenario {
  return loadScenarioStrict(placeholderJson, {
    sourcePath: "tests/fixtures/scenarios/placeholder_v0.json"
  });
}

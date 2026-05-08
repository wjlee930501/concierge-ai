import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const ciWorkflowPath = path.join(repoRoot, ".github", "workflows", "ci.yml");

describe("CI gate wires PR evidence validator", () => {
  it("ci.yml runs `npm run pr:evidence:validate` as a verify step", async () => {
    const yaml = await readFile(ciWorkflowPath, "utf8");
    expect(yaml).toContain("npm run pr:evidence:validate");
  });

  it("validator step runs after build and before the source secret scan step", async () => {
    const yaml = await readFile(ciWorkflowPath, "utf8");
    const buildIndex = yaml.indexOf("run: npm run build");
    const validatorIndex = yaml.indexOf("run: npm run pr:evidence:validate");
    const sourceScanIndex = yaml.indexOf("run: npm run security:scan\n");
    expect(buildIndex).toBeGreaterThanOrEqual(0);
    expect(validatorIndex).toBeGreaterThan(buildIndex);
    expect(sourceScanIndex).toBeGreaterThan(validatorIndex);
  });
});

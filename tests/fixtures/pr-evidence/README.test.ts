import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  PR_EVIDENCE_CHANGE_AREAS,
  PR_EVIDENCE_PATH_RULES,
  inferPrEvidenceChangeAreasForPath
} from "../../../packages/shared/src/pr-evidence";
import { TEST_ONLY_DIFF_PATHS_FIXTURE } from "./diff-paths.fixture";

type ChangeArea = (typeof PR_EVIDENCE_CHANGE_AREAS)[number];

const here = path.dirname(fileURLToPath(import.meta.url));
const readmePath = path.join(here, "README.md");
const alignmentPath = path.resolve(
  here,
  "../../../docs/alignment/PR_EVIDENCE_AND_COST_LEDGER.md"
);

const FIXTURE_EXPORT_NAMES = [
  "perPathExamples",
  "aggregatedExamples",
  "nonMatchingExamples",
  "invalidPathExamples"
] as const;

const SHARED_BOUNDARY_TOKENS = [
  "PR 본문",
  "production scenario",
  ".env*",
  "외부 API"
] as const;

const SECTION_21_HEADER = "### 2.1 Current-diff path helper";
const TEST_ONLY_SUBSECTION_HEADER = "#### Test-only current-diff fixture";
const README_SUMMARY_HEADER = "| 변경 범위 키 |";

async function readReadme(): Promise<string> {
  return readFile(readmePath, "utf8");
}

async function readAlignment(): Promise<string> {
  return readFile(alignmentPath, "utf8");
}

function sliceSection21(align: string): string {
  const start = align.indexOf(SECTION_21_HEADER);
  expect(start, `"${SECTION_21_HEADER}" header missing`).toBeGreaterThanOrEqual(0);
  const end = align.indexOf("\n## ", start + 1);
  return end === -1 ? align.slice(start) : align.slice(start, end);
}

function sliceTestOnlySubsection(section21: string): string {
  const subStart = section21.indexOf(TEST_ONLY_SUBSECTION_HEADER);
  expect(subStart, `"${TEST_ONLY_SUBSECTION_HEADER}" subsection missing`).toBeGreaterThanOrEqual(0);
  return section21.slice(subStart);
}

function sliceSection21Table(section21: string): string {
  const subStart = section21.indexOf(TEST_ONLY_SUBSECTION_HEADER);
  return subStart === -1 ? section21 : section21.slice(0, subStart);
}

function sliceReadmeSummary(readme: string): string {
  const summaryStart = readme.indexOf(README_SUMMARY_HEADER);
  expect(summaryStart, "README summary table missing").toBeGreaterThanOrEqual(0);
  return readme.slice(summaryStart);
}

function parseTableRowCells(row: string): string[] {
  return row
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function findRowCellsByPredicate(
  tableSource: string,
  predicate: (cells: string[]) => boolean
): string[] | undefined {
  for (const line of tableSource.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = parseTableRowCells(line);
    if (predicate(cells)) return cells;
  }
  return undefined;
}

function getSection21PatternCell(table: string, area: ChangeArea): string {
  const target = `\`${area}\``;
  const cells = findRowCellsByPredicate(
    table,
    (c) => c.length >= 2 && c[1] === target
  );
  if (!cells) {
    throw new Error(`§2.1 area row missing for ${area}`);
  }
  return cells[0];
}

function getReadmeSummaryPatternCell(summary: string, area: ChangeArea): string {
  const target = `\`${area}\``;
  const cells = findRowCellsByPredicate(
    summary,
    (c) => c.length >= 2 && c[0] === target
  );
  expect(cells, `README summary row missing for ${area}`).toBeDefined();
  return cells![1];
}

function expectBaseTokenForms(
  cell: string,
  area: ChangeArea,
  source: string
): void {
  const rule = PR_EVIDENCE_PATH_RULES[area];
  for (const token of rule.tokens) {
    expect(cell, `${source} ${area}: \`${token}\``).toContain(`\`${token}\``);
    expect(cell, `${source} ${area}: \`${token}-*\``).toContain(`\`${token}-*\``);
    expect(cell, `${source} ${area}: \`${token}.*\``).toContain(`\`${token}.*\``);
  }
}

function expectHyphenWrappedTokenForm(
  cell: string,
  area: ChangeArea,
  source: string
): void {
  const rule = PR_EVIDENCE_PATH_RULES[area];
  for (const token of rule.tokens) {
    const hyphenWrapped = `\`*-${token}-*\``;
    if (rule.allowHyphenWrappedToken) {
      expect(cell, `${source} ${area} should mention ${hyphenWrapped}`).toContain(
        hyphenWrapped
      );
    } else {
      expect(
        cell,
        `${source} ${area} must not mention ${hyphenWrapped}`
      ).not.toContain(hyphenWrapped);
    }
  }
}

function exactSegmentLabel(token: string): string {
  return `exact ${token} segment`;
}

function buildRuleTokenIndex(): ReadonlyMap<string, ReadonlyArray<ChangeArea>> {
  const index = new Map<string, Array<ChangeArea>>();
  for (const area of PR_EVIDENCE_CHANGE_AREAS) {
    for (const token of PR_EVIDENCE_PATH_RULES[area].tokens) {
      const bucket = index.get(token) ?? [];
      bucket.push(area);
      index.set(token, bucket);
    }
  }
  return index;
}

function findExactSegmentExample(token: string) {
  return TEST_ONLY_DIFF_PATHS_FIXTURE.perPathExamples.find(
    (entry) => entry.label === exactSegmentLabel(token)
  );
}

function formatAreaList(areas: ReadonlyArray<ChangeArea>): string {
  return [...areas].sort().join(", ");
}

function buildExpectedTokenSet(): ReadonlySet<string> {
  const expectedTokens = new Set<string>();
  for (const area of PR_EVIDENCE_CHANGE_AREAS) {
    for (const token of PR_EVIDENCE_PATH_RULES[area].tokens) {
      expectedTokens.add(token);
    }
  }
  return expectedTokens;
}

function expectExactSegmentExampleMirrorsRule(
  token: string,
  expectedAreas: ReadonlyArray<ChangeArea>
): void {
  const example = findExactSegmentExample(token);
  const expectedAreasSorted = [...expectedAreas].sort();
  const fixtureLabel = exactSegmentLabel(token);
  const fixtureEntryName = `perPathExamples["${fixtureLabel}"]`;
  const expectedPathShape = `${token}/<placeholder>`;

  expect(
    example,
    `tests/fixtures/pr-evidence/diff-paths.fixture.ts is missing ${fixtureEntryName} for rule token "${token}" → areas [${formatAreaList(expectedAreas)}]. Add an entry with path shape "${expectedPathShape}" and rationale tokens "exact" + "segment".`
  ).toBeDefined();
  expect(
    example!.path.startsWith(`${token}/`),
    `tests/fixtures/pr-evidence/diff-paths.fixture.ts ${fixtureEntryName} must use path shape "${expectedPathShape}" so the fixture exercises segment equality for rule token "${token}". The assertion intentionally does not echo the fixture path.`
  ).toBe(true);
  expect(
    [...example!.expectedAreas].sort(),
    `tests/fixtures/pr-evidence/diff-paths.fixture.ts ${fixtureEntryName}.expectedAreas drift from PR_EVIDENCE_PATH_RULES for rule token "${token}" → [${formatAreaList(expectedAreas)}]. Update packages/shared/src/pr-evidence.ts or this fixture entry.`
  ).toEqual(expectedAreasSorted);
  const helperResult = inferPrEvidenceChangeAreasForPath(example!.path);
  expect(
    [...helperResult].sort(),
    `inferPrEvidenceChangeAreasForPath(<fixture path for ${fixtureEntryName}>) disagrees with fixture expectedAreas for rule token "${token}". Helper logic and fixture diverged; the assertion intentionally does not echo the fixture path.`
  ).toEqual([...example!.expectedAreas].sort());
  expect(
    example!.rationale.includes("exact"),
    `tests/fixtures/pr-evidence/diff-paths.fixture.ts ${fixtureEntryName}.rationale must contain "exact" so README "exact segment equality" and §2.1 "segment 동등" trace back to the fixture. The assertion intentionally does not echo rationale text.`
  ).toBe(true);
  expect(
    example!.rationale.includes("segment"),
    `tests/fixtures/pr-evidence/diff-paths.fixture.ts ${fixtureEntryName}.rationale must contain "segment" so the exact-segment-mirror chain stays explicit. The assertion intentionally does not echo rationale text.`
  ).toBe(true);
}

describe("PR evidence diff path fixture README", () => {
  it("documents the test-only boundary and direct consumer", async () => {
    const readme = await readReadme();

    expect(readme).toContain("test-only fixture");
    expect(readme).toContain(TEST_ONLY_DIFF_PATHS_FIXTURE.fixtureScope);
    expect(readme).toContain("packages/shared/src/pr-evidence.test.ts");
    expect(readme).toContain("docs/alignment/PR_EVIDENCE_AND_COST_LEDGER.md");
  });

  it("documents every fixture export group by name", async () => {
    const readme = await readReadme();

    for (const exportName of FIXTURE_EXPORT_NAMES) {
      expect(readme).toContain(exportName);
    }
  });

  it("keeps all change-area labels visible in the fixture README", async () => {
    const readme = await readReadme();

    for (const area of PR_EVIDENCE_CHANGE_AREAS) {
      expect(readme, area).toContain(area);
    }
  });
});

describe("drift between fixture, README, and alignment doc §2.1", () => {
  it("alignment doc §2.1 test-only subsection lists fixture path, consumer, and every fixture export", async () => {
    const align = await readAlignment();
    const section = sliceSection21(align);
    const subsection = sliceTestOnlySubsection(section);

    expect(subsection).toContain("tests/fixtures/pr-evidence/diff-paths.fixture.ts");
    expect(subsection).toContain("packages/shared/src/pr-evidence.test.ts");
    expect(subsection).toContain(
      TEST_ONLY_DIFF_PATHS_FIXTURE.fixtureScope.split(" ")[0]
    );

    for (const exportName of FIXTURE_EXPORT_NAMES) {
      expect(subsection, exportName).toContain(exportName);
    }

    for (const token of SHARED_BOUNDARY_TOKENS) {
      expect(subsection, token).toContain(token);
    }

    for (const area of PR_EVIDENCE_CHANGE_AREAS) {
      expect(section, area).toContain(`\`${area}\``);
    }
  });

  it("README and alignment doc share the same boundary claim tokens for the test-only fixture", async () => {
    const readme = await readReadme();
    const align = await readAlignment();

    for (const token of SHARED_BOUNDARY_TOKENS) {
      expect(readme, `README ${token}`).toContain(token);
      expect(align, `alignment ${token}`).toContain(token);
    }
  });

  it("fixture exports the exact set of example groups that README and alignment doc enumerate", () => {
    const fixtureKeys = Object.keys(TEST_ONLY_DIFF_PATHS_FIXTURE)
      .filter((key) => key !== "fixtureScope")
      .sort();
    expect(fixtureKeys).toEqual([...FIXTURE_EXPORT_NAMES].sort());
  });
});

describe("§2.1 path rule table is the exact projection of PR_EVIDENCE_PATH_RULES", () => {
  async function readSection21Table(): Promise<string> {
    return sliceSection21Table(sliceSection21(await readAlignment()));
  }

  it("each area row enumerates segment equality plus `${token}-*` and `${token}.*` for every rule token", async () => {
    const table = await readSection21Table();

    for (const area of PR_EVIDENCE_CHANGE_AREAS) {
      expectBaseTokenForms(getSection21PatternCell(table, area), area, "§2.1");
    }
  });

  it("hyphen-wrapped `*-${token}-*` glob appears iff allowHyphenWrappedToken is set", async () => {
    const table = await readSection21Table();

    for (const area of PR_EVIDENCE_CHANGE_AREAS) {
      expectHyphenWrappedTokenForm(
        getSection21PatternCell(table, area),
        area,
        "§2.1"
      );
    }
  });

  it("every explicit path appears in the matching §2.1 row text", async () => {
    const table = await readSection21Table();

    for (const area of PR_EVIDENCE_CHANGE_AREAS) {
      const rule = PR_EVIDENCE_PATH_RULES[area];
      const cell = getSection21PatternCell(table, area);
      for (const explicitPath of rule.explicitPaths) {
        expect(
          cell,
          `explicit path ${explicitPath} for ${area} must be referenced in the §2.1 table row`
        ).toContain(explicitPath);
      }
    }
  });

  it("README summary table mirrors §2.1 token-form coverage per area", async () => {
    const summary = sliceReadmeSummary(await readReadme());

    for (const area of PR_EVIDENCE_CHANGE_AREAS) {
      const cell = getReadmeSummaryPatternCell(summary, area);
      expectBaseTokenForms(cell, area, "README summary");
      expectHyphenWrappedTokenForm(cell, area, "README summary");
    }
  });
});

describe("exact segment equality coverage mirrors fixture, README, and §2.1", () => {
  it("fixture has an `exact ${token} segment` per-path example for every rule token", () => {
    for (const [token, expectedAreas] of buildRuleTokenIndex()) {
      expectExactSegmentExampleMirrorsRule(token, expectedAreas);
    }
  });

  it("the set of `exact ${token} segment` labels equals the union of rule tokens", () => {
    const expectedTokens = buildExpectedTokenSet();
    const fixtureTokens = new Set<string>();
    for (const entry of TEST_ONLY_DIFF_PATHS_FIXTURE.perPathExamples) {
      const match = /^exact (.+) segment$/u.exec(entry.label);
      if (match) {
        fixtureTokens.add(match[1]);
      }
    }
    const missingInFixture = [...expectedTokens]
      .filter((t) => !fixtureTokens.has(t))
      .sort();
    const extraInFixture = [...fixtureTokens]
      .filter((t) => !expectedTokens.has(t))
      .sort();
    expect(
      [...fixtureTokens].sort(),
      `tests/fixtures/pr-evidence/diff-paths.fixture.ts perPathExamples "exact <token> segment" labels drift from PR_EVIDENCE_PATH_RULES tokens. Missing in fixture: [${missingInFixture.join(", ")}]. Extra in fixture (no matching rule token): [${extraInFixture.join(", ")}]. Reconcile by editing packages/shared/src/pr-evidence.ts (PR_EVIDENCE_PATH_RULES) or this fixture.`
    ).toEqual([...expectedTokens].sort());
  });

  it("README pins the `exact segment equality` phrase used by the fixture rationale", async () => {
    const readme = await readReadme();
    expect(
      readme,
      'tests/fixtures/pr-evidence/README.md must contain the literal phrase "exact segment equality" so the README mirrors diff-paths.fixture.ts perPathExamples rationales (which are required to mention "exact" and "segment"). Add the phrase under the "예시 종류" section.'
    ).toContain("exact segment equality");
  });

  it("alignment doc §2.1 pins the `segment 동등` phrase that mirrors exact segment equality", async () => {
    const section = sliceSection21(await readAlignment());
    expect(
      section,
      'docs/alignment/PR_EVIDENCE_AND_COST_LEDGER.md § 2.1 must contain the Korean phrase "segment 동등" that mirrors README "exact segment equality" and fixture rationale "exact ... segment". Add it inside the "### 2.1 Current-diff path helper" section.'
    ).toContain("segment 동등");
  });

  it("README and §2.1 both expose the bare `${token}` segment form for every rule token", async () => {
    const readme = await readReadme();
    const section = sliceSection21(await readAlignment());

    for (const [token, areas] of buildRuleTokenIndex()) {
      const areaList = [...areas].sort().join(", ");
      expect(
        readme,
        `tests/fixtures/pr-evidence/README.md must include the bare segment form \`${token}\` (inline-code) so README → fixture mirror stays exact for rule token "${token}" (areas: [${areaList}]).`
      ).toContain(`\`${token}\``);
      expect(
        section,
        `docs/alignment/PR_EVIDENCE_AND_COST_LEDGER.md § 2.1 must include the bare segment form \`${token}\` (inline-code) inside "### 2.1 Current-diff path helper" so §2.1 → fixture mirror stays exact for rule token "${token}" (areas: [${areaList}]).`
      ).toContain(`\`${token}\``);
    }
  });
});

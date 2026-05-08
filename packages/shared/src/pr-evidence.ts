export const PR_EVIDENCE_SCOPES = [
  "scaffolding-only",
  "AI",
  "KB",
  "PIPA",
  "Admin",
  "polish"
] as const;

export type PrEvidenceScope = (typeof PR_EVIDENCE_SCOPES)[number];

export const PR_EVIDENCE_CHANGE_AREAS = [
  "ai-or-kb",
  "iframe",
  "pipa",
  "admin"
] as const;

export type PrEvidenceChangeArea = (typeof PR_EVIDENCE_CHANGE_AREAS)[number];

export const COST_LEDGER_ENTRY_KEYS = [
  "pr_number",
  "computer_use_minutes",
  "claude_review_tokens_estimate",
  "llm_calls_estimate",
  "running_total_week"
] as const;

export type CostLedgerEntryKey = (typeof COST_LEDGER_ENTRY_KEYS)[number];

export const RUNNING_TOTAL_WEEK_KEYS = [
  "week_id",
  "computer_use_minutes",
  "claude_review_tokens_estimate",
  "llm_calls_estimate"
] as const;

export type RunningTotalWeekKey = (typeof RUNNING_TOTAL_WEEK_KEYS)[number];

export type RunningTotalWeek = {
  readonly week_id: string;
  readonly computer_use_minutes: number;
  readonly claude_review_tokens_estimate: number;
  readonly llm_calls_estimate: number;
};

export type CostLedgerEntry = {
  readonly pr_number: number | null;
  readonly computer_use_minutes: number;
  readonly claude_review_tokens_estimate: number;
  readonly llm_calls_estimate: number;
  readonly running_total_week: RunningTotalWeek;
};

export class PrEvidenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrEvidenceError";
  }
}

const WEEK_ID_PATTERN = /^W[1-9][0-9]*$/u;

export function isPrEvidenceScope(value: unknown): value is PrEvidenceScope {
  return (
    typeof value === "string" &&
    (PR_EVIDENCE_SCOPES as readonly string[]).includes(value)
  );
}

export function isPrEvidenceChangeArea(
  value: unknown
): value is PrEvidenceChangeArea {
  return (
    typeof value === "string" &&
    (PR_EVIDENCE_CHANGE_AREAS as readonly string[]).includes(value)
  );
}

export function requiredExtraEvidenceFor(
  scope: PrEvidenceScope
): readonly PrEvidenceChangeArea[] {
  switch (scope) {
    case "AI":
    case "KB":
      return ["ai-or-kb"];
    case "PIPA":
      return ["pipa"];
    case "Admin":
      return ["admin"];
    case "scaffolding-only":
    case "polish":
      return [];
  }
}

type PrEvidencePathRule = {
  readonly tokens: readonly string[];
  readonly explicitPaths: readonly string[];
  readonly allowHyphenWrappedToken?: boolean;
};

export const PR_EVIDENCE_PATH_RULES: Readonly<
  Record<PrEvidenceChangeArea, PrEvidencePathRule>
> = {
  iframe: {
    tokens: ["embed", "iframe"],
    allowHyphenWrappedToken: true,
    explicitPaths: [
      "packages/shared/src/post-message.ts",
      "packages/shared/src/post-message.test.ts",
      "packages/shared/src/origin.ts",
      "packages/shared/src/origin.test.ts"
    ]
  },
  "ai-or-kb": {
    tokens: ["ai", "kb"],
    explicitPaths: []
  },
  pipa: {
    tokens: ["pipa"],
    explicitPaths: []
  },
  admin: {
    tokens: ["admin"],
    explicitPaths: []
  }
};

export function normalizePrEvidencePath(path: unknown): string {
  if (typeof path !== "string") {
    throw new PrEvidenceError("Path must be a string");
  }

  if (path.length === 0) {
    throw new PrEvidenceError("Path must not be empty");
  }

  if (path.includes("\\")) {
    throw new PrEvidenceError("Path must use POSIX separators");
  }

  if (path.startsWith("/")) {
    throw new PrEvidenceError("Path must be repo-relative");
  }

  const stripped = path.startsWith("./") ? path.slice(2) : path;

  if (stripped.length === 0) {
    throw new PrEvidenceError("Path must not be empty");
  }

  const segments = stripped.split("/");

  if (segments.some((segment) => segment === "..")) {
    throw new PrEvidenceError("Path must not traverse outside the repo");
  }

  return stripped;
}

export function inferPrEvidenceChangeAreasForPath(
  path: string
): readonly PrEvidenceChangeArea[] {
  const normalized = normalizePrEvidencePath(path);
  const segments = normalized
    .split("/")
    .filter((segment) => segment.length > 0);

  const matched: PrEvidenceChangeArea[] = [];

  for (const area of PR_EVIDENCE_CHANGE_AREAS) {
    const rule = PR_EVIDENCE_PATH_RULES[area];
    const explicitMatch = rule.explicitPaths.includes(normalized);
    const tokenMatch = segments.some((segment) =>
      rule.tokens.some((token) => matchesPathToken(segment, token, rule))
    );

    if (explicitMatch || tokenMatch) {
      matched.push(area);
    }
  }

  return matched;
}

function matchesPathToken(
  segment: string,
  token: string,
  rule: PrEvidencePathRule
): boolean {
  return (
    segment === token ||
    segment.startsWith(`${token}-`) ||
    segment.startsWith(`${token}.`) ||
    Boolean(rule.allowHyphenWrappedToken && segment.includes(`-${token}-`))
  );
}

export function inferPrEvidenceChangeAreas(
  paths: readonly string[]
): readonly PrEvidenceChangeArea[] {
  const matched = new Set<PrEvidenceChangeArea>();

  for (const path of paths) {
    for (const area of inferPrEvidenceChangeAreasForPath(path)) {
      matched.add(area);
    }
  }

  return PR_EVIDENCE_CHANGE_AREAS.filter((area) => matched.has(area));
}

export function isRunningTotalWeek(value: unknown): value is RunningTotalWeek {
  if (!hasExactKeys(value, RUNNING_TOTAL_WEEK_KEYS)) {
    return false;
  }

  return (
    isWeekId(value.week_id) &&
    isNonNegativeFiniteNumber(value.computer_use_minutes) &&
    isNonNegativeInteger(value.claude_review_tokens_estimate) &&
    isNonNegativeInteger(value.llm_calls_estimate)
  );
}

export function isCostLedgerEntry(value: unknown): value is CostLedgerEntry {
  if (!hasExactKeys(value, COST_LEDGER_ENTRY_KEYS)) {
    return false;
  }

  return (
    isPrNumberOrNull(value.pr_number) &&
    isNonNegativeFiniteNumber(value.computer_use_minutes) &&
    isNonNegativeInteger(value.claude_review_tokens_estimate) &&
    isNonNegativeInteger(value.llm_calls_estimate) &&
    isRunningTotalWeek(value.running_total_week)
  );
}

export function validateCostLedgerEntry(value: unknown): CostLedgerEntry {
  if (!isCostLedgerEntry(value)) {
    throw new PrEvidenceError("Invalid cost ledger entry");
  }

  return value;
}

export function createCostLedgerEntry(input: {
  readonly pr_number: number | null;
  readonly computer_use_minutes: number;
  readonly claude_review_tokens_estimate: number;
  readonly llm_calls_estimate: number;
  readonly running_total_week: RunningTotalWeek;
}): CostLedgerEntry {
  const entry: CostLedgerEntry = {
    pr_number: input.pr_number,
    computer_use_minutes: input.computer_use_minutes,
    claude_review_tokens_estimate: input.claude_review_tokens_estimate,
    llm_calls_estimate: input.llm_calls_estimate,
    running_total_week: input.running_total_week
  };

  return validateCostLedgerEntry(entry);
}

function hasExactKeys<TKey extends string>(
  value: unknown,
  keys: readonly TKey[]
): value is Record<TKey, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  const valueKeys = Object.keys(value);

  return (
    valueKeys.length === keys.length &&
    keys.every((key) => Object.prototype.hasOwnProperty.call(value, key))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWeekId(value: unknown): value is string {
  return typeof value === "string" && WEEK_ID_PATTERN.test(value);
}

function isPrNumberOrNull(value: unknown): value is number | null {
  if (value === null) {
    return true;
  }

  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1
  );
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

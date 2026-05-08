import type { PrEvidenceChangeArea } from "../../../packages/shared/src/pr-evidence";

type PerPathExample = {
  readonly label: string;
  readonly path: string;
  readonly expectedAreas: readonly PrEvidenceChangeArea[];
  readonly rationale: string;
};

type AggregatedExample = {
  readonly label: string;
  readonly paths: readonly string[];
  readonly expectedAreas: readonly PrEvidenceChangeArea[];
  readonly rationale: string;
};

type NonMatchingExample = {
  readonly label: string;
  readonly path: string;
  readonly rationale: string;
};

type InvalidPathExample = {
  readonly label: string;
  readonly path: unknown;
  readonly reason: string;
};

const perPathExamples: readonly PerPathExample[] = Object.freeze([
  Object.freeze({
    label: "exact embed segment",
    path: "embed/README.md",
    expectedAreas: Object.freeze(["iframe"] as const),
    rationale: "exact embed segment equality maps to iframe area"
  }),
  Object.freeze({
    label: "apps/embed runtime file",
    path: "apps/embed/src/runtime.ts",
    expectedAreas: Object.freeze(["iframe"] as const),
    rationale: "embed segment maps to iframe area"
  }),
  Object.freeze({
    label: "exact iframe segment",
    path: "iframe/README.md",
    expectedAreas: Object.freeze(["iframe"] as const),
    rationale: "exact iframe segment equality maps to iframe area"
  }),
  Object.freeze({
    label: "tests/iframe handshake test",
    path: "tests/iframe/handshake.test.ts",
    expectedAreas: Object.freeze(["iframe"] as const),
    rationale: "iframe segment maps to iframe area"
  }),
  Object.freeze({
    label: "shared post-message contract source",
    path: "packages/shared/src/post-message.ts",
    expectedAreas: Object.freeze(["iframe"] as const),
    rationale: "explicit path entry for postMessage contract"
  }),
  Object.freeze({
    label: "shared post-message contract test",
    path: "packages/shared/src/post-message.test.ts",
    expectedAreas: Object.freeze(["iframe"] as const),
    rationale: "explicit path entry for postMessage contract test"
  }),
  Object.freeze({
    label: "shared origin contract source",
    path: "packages/shared/src/origin.ts",
    expectedAreas: Object.freeze(["iframe"] as const),
    rationale: "explicit path entry for origin allowlist"
  }),
  Object.freeze({
    label: "shared origin contract test",
    path: "packages/shared/src/origin.test.ts",
    expectedAreas: Object.freeze(["iframe"] as const),
    rationale: "explicit path entry for origin allowlist test"
  }),
  Object.freeze({
    label: "leading ./ prefix on embed path",
    path: "./apps/embed/src/runtime.ts",
    expectedAreas: Object.freeze(["iframe"] as const),
    rationale: "leading ./ is normalized before token matching"
  }),
  Object.freeze({
    label: "hyphen-wrapped embed token",
    path: "packages/shared/src/parent-embed-bridge.ts",
    expectedAreas: Object.freeze(["iframe"] as const),
    rationale: "iframe rule allows -embed- inside a segment"
  }),
  Object.freeze({
    label: "embed token with dot suffix",
    path: "packages/shared/src/embed.contract.ts",
    expectedAreas: Object.freeze(["iframe"] as const),
    rationale: "token followed by dot still matches"
  }),
  Object.freeze({
    label: "exact kb segment",
    path: "kb/README.md",
    expectedAreas: Object.freeze(["ai-or-kb"] as const),
    rationale: "exact kb segment equality maps to ai-or-kb area"
  }),
  Object.freeze({
    label: "kb package source",
    path: "packages/kb/src/ingest.ts",
    expectedAreas: Object.freeze(["ai-or-kb"] as const),
    rationale: "kb segment maps to ai-or-kb area"
  }),
  Object.freeze({
    label: "exact ai segment",
    path: "ai/README.md",
    expectedAreas: Object.freeze(["ai-or-kb"] as const),
    rationale: "exact ai segment equality maps to ai-or-kb area"
  }),
  Object.freeze({
    label: "ai folder under widget app",
    path: "apps/widget/src/ai/tool-schema.ts",
    expectedAreas: Object.freeze(["ai-or-kb"] as const),
    rationale: "ai segment maps to ai-or-kb area"
  }),
  Object.freeze({
    label: "ai-prefixed segment",
    path: "packages/shared/src/ai-tool-schema.ts",
    expectedAreas: Object.freeze(["ai-or-kb"] as const),
    rationale: "ai- prefix matches"
  }),
  Object.freeze({
    label: "exact pipa segment",
    path: "pipa/README.md",
    expectedAreas: Object.freeze(["pipa"] as const),
    rationale: "exact pipa segment equality maps to pipa area"
  }),
  Object.freeze({
    label: "pipa package source",
    path: "packages/pipa/src/consent.ts",
    expectedAreas: Object.freeze(["pipa"] as const),
    rationale: "pipa segment maps to pipa area"
  }),
  Object.freeze({
    label: "exact admin segment",
    path: "admin/README.md",
    expectedAreas: Object.freeze(["admin"] as const),
    rationale: "exact admin segment equality maps to admin area"
  }),
  Object.freeze({
    label: "admin app page",
    path: "apps/admin/src/page.tsx",
    expectedAreas: Object.freeze(["admin"] as const),
    rationale: "admin segment maps to admin area"
  })
]);

const aggregatedExamples: readonly AggregatedExample[] = Object.freeze([
  Object.freeze({
    label: "diff touching all four areas",
    paths: Object.freeze([
      "docs/admin/rbac.md",
      "apps/embed/src/runtime.ts",
      "packages/kb/src/ingest.ts",
      "packages/pipa/src/consent.ts",
      "CHANGELOG.md"
    ] as const),
    expectedAreas: Object.freeze([
      "ai-or-kb",
      "iframe",
      "pipa",
      "admin"
    ] as const),
    rationale:
      "aggregation returns canonical PR_EVIDENCE_CHANGE_AREAS order regardless of input order"
  }),
  Object.freeze({
    label: "iframe-only multi-path diff",
    paths: Object.freeze([
      "apps/embed/src/runtime.ts",
      "packages/shared/src/post-message.ts",
      "packages/shared/src/origin.ts",
      "tests/iframe/handshake.test.ts"
    ] as const),
    expectedAreas: Object.freeze(["iframe"] as const),
    rationale: "duplicate area inputs collapse to a single canonical entry"
  }),
  Object.freeze({
    label: "scaffolding-only diff with no area paths",
    paths: Object.freeze(["CHANGELOG.md", "package.json"] as const),
    expectedAreas: Object.freeze([] as const),
    rationale:
      "scaffolding-only PRs do not require iframe/AI-KB/PIPA/Admin extra evidence"
  }),
  Object.freeze({
    label: "empty diff",
    paths: Object.freeze([] as const),
    expectedAreas: Object.freeze([] as const),
    rationale: "no inputs yield no inferred areas"
  })
]);

const nonMatchingExamples: readonly NonMatchingExample[] = Object.freeze([
  Object.freeze({
    label: "embedded-* must not match embed",
    path: "apps/embedded-tool.ts",
    rationale: "iframe rule forbids substring-only matches like 'embedded-'"
  }),
  Object.freeze({
    label: "aim.md must not match ai",
    path: "docs/aim.md",
    rationale: "ai-or-kb rule forbids substring-only matches like 'aim'"
  }),
  Object.freeze({
    label: "kbd-shortcut.md must not match kb",
    path: "docs/kbd-shortcut.md",
    rationale: "ai-or-kb rule forbids substring-only matches like 'kbd-'"
  }),
  Object.freeze({
    label: "administrate.md must not match admin",
    path: "docs/administrate.md",
    rationale: "admin rule forbids substring-only matches like 'administrate'"
  }),
  Object.freeze({
    label: "shared choreographer is unrelated to iframe",
    path: "packages/shared/src/choreographer.ts",
    rationale:
      "choreographer is a UI helper without postMessage/origin coupling"
  }),
  Object.freeze({
    label: "widget shell view-model is unrelated to all areas",
    path: "apps/widget/src/shell-view-model.ts",
    rationale: "widget shell scaffold has no AI/KB/PIPA/Admin/iframe coupling"
  })
]);

const invalidPathExamples: readonly InvalidPathExample[] = Object.freeze([
  Object.freeze({
    label: "absolute path is rejected",
    path: "/etc/passwd",
    reason: "path must be repo-relative"
  }),
  Object.freeze({
    label: "parent traversal segment is rejected",
    path: "../escape.ts",
    reason: "path must not traverse outside the repo"
  }),
  Object.freeze({
    label: "backslash path is rejected",
    path: "apps\\embed\\src.ts",
    reason: "path must use POSIX separators"
  }),
  Object.freeze({
    label: "empty string is rejected",
    path: "",
    reason: "path must not be empty"
  }),
  Object.freeze({
    label: "lone ./ is rejected",
    path: "./",
    reason: "path must not be empty after stripping ./ prefix"
  }),
  Object.freeze({
    label: "non-string input is rejected",
    path: 42,
    reason: "path must be a string"
  })
]);

export const TEST_ONLY_DIFF_PATHS_FIXTURE = Object.freeze({
  fixtureScope: "tests/fixtures/pr-evidence only",
  perPathExamples,
  aggregatedExamples,
  nonMatchingExamples,
  invalidPathExamples
});

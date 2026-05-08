# Scenario Namespace Separation

Production scenario content and test-only fixtures must be physically separated
in the repository. This document codifies the boundary.

## Principle

Source data that has not been approved by the final decision maker (Woojin) must
never appear in production code paths. Temporary or synthetic data used for
scaffold testing lives exclusively in the `tests/fixtures/` tree and is never
imported by `apps/` or `packages/` runtime code.

## Directory contract

| Path | Purpose | May contain production content |
|---|---|---|
| `packages/kb/` | Approved Knowledge markdown and ingestion | Yes, after Week 2 blocker approval |
| `apps/widget/` | Widget runtime | Yes, after source data per scenario |
| `apps/embed/` | Embed injection runtime | No user-facing content |
| `apps/admin/` | Admin UI and API | Yes, after Week 4 blocker approval |
| `tests/fixtures/scenarios/` | Synthetic test-only scenario stubs | **No** |
| `tests/fixtures/widget/` | Structural shell test fixtures | **No** |
| `tests/fixtures/security/` | Secret scan test markers | **No** |
| `tests/fixtures/pr-evidence/` | PR evidence diff path fixtures | **No** |
| `tests/fixtures/cost-ledger/` | Cost ledger example fixtures | **No** |

## Rules

1. **No promotion without approval.** A test fixture must not be copied or
   symlinked into a production path (`apps/`, `packages/kb/`) without explicit
   source data approval.

2. **No final copy in fixtures.** Test fixtures must not contain user-facing
   final Korean copy, real scenario step content, Quick Chip wording, AI answer
   bodies, or PIPA consent text. Use obviously synthetic placeholder labels
   prefixed with `test-` or `fixture-`.

3. **Scenario IDs are namespaced.** Production scenarios use IDs like
   `ortho_revisit_v1`. Test-only fixtures use IDs prefixed with `test_` (e.g.,
   `test_ortho_stub_v0`). Any code that loads scenarios by ID must reject
   `test_*` IDs in non-test environments.

4. **Import boundary.** Runtime source files (`apps/**/src/`, `packages/**/src/`)
   must not import from `tests/fixtures/`. This is enforced by the TypeScript
   project `include`/`exclude` configuration and can be verified by grep.

5. **KB content gate.** `packages/kb/src/` starts empty. KB markdown documents
   are added only after the Approved Knowledge origin, ingestion sanitization
   policy, and 3-layer gate design are approved (Week 2 blocker).

## References

- FINAL_ALIGNMENT Section 3 (Minimal Week 1 Start Contract)
- FINAL_ALIGNMENT Section 4 (blocker vs non-blocking)
- `tests/fixtures/scenarios/README.md`

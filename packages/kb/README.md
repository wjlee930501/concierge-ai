# KB (Knowledge Base) Scaffold

This package is a Week 1 placeholder boundary for KB markdown sources and
ingestion (PRD Section 2, FINAL_ALIGNMENT Week 2).

## Scope

- Week 1: package boundary only. No markdown content, no ingestion pipeline.
- Week 2: Approved Knowledge 3-layer gate, KB ingestion sanitization, retrieval
  contract.

## What does NOT belong here yet

- Actual KB markdown documents or approved knowledge content.
- Ingestion or sanitization pipeline code.
- AI tool schemas or prompt injection defence logic.
- Production scenario content or final copy.

All of the above require Week 2 blocker source data (AI tool 7 schemas,
safety_response 5 enum, Approved Knowledge origin) before implementation.

## Fixture separation

Test-only KB fixtures live in `tests/fixtures/` and must never be promoted to
this package without explicit source data approval. See
`docs/architecture/SCENARIO_NAMESPACE_SEPARATION.md`.

## Scope

`PR_EVIDENCE_SCOPES`(@conciergeai/shared) 단일 출처. 정확히 1개를 선택한다.

- [ ] scaffolding-only
- [ ] AI
- [ ] KB
- [ ] PIPA
- [ ] Admin
- [ ] polish

## PRD Mapping

- PRD section / scenario ID:
- FINAL_ALIGNMENT checklist items:

## Changes

- Added:
- Changed:
- Removed:
- User-facing Korean text diff:

## Required Extra Evidence

scope 또는 변경 범위에 따라 추가 증빙을 첨부한다 (`requiredExtraEvidenceFor`/FINAL_ALIGNMENT § 5 참조).

- [ ] ai-or-kb (tool zod schema diff, system prompt diff, KB ingestion path, safety_response enum diff)
- [ ] iframe (postMessage schema diff, origin allowlist diff, sandbox/CSP 변경)
- [ ] pipa (동의 항목/문구/보관 기간 diff, Slack/DB payload diff)
- [ ] admin (auth/RBAC/CSRF/API 권한/integration test 증빙)

## Tests

- Unit:
- Integration:
- E2E:
- Commands run:

## Computer-Use Verification

- Required: yes / no
- Reason:
- Scenario ID / viewport / steps, if required:

## Secret Scan

- Command:
- Result:

## Cost Ledger

`CostLedgerEntry`(@conciergeai/shared) shape. PR 번호가 아직 없으면 `pr_number: null`로 두고 merge 직전 갱신한다.

- `pr_number`: <integer ≥ 1 or `null`>
- `computer_use_minutes`: <number ≥ 0>
- `claude_review_tokens_estimate`: <integer ≥ 0>
- `llm_calls_estimate`: <integer ≥ 0>
- `running_total_week`:
  - `week_id`: <`W1` | `W2` | …>
  - `computer_use_minutes`: <number ≥ 0>
  - `claude_review_tokens_estimate`: <integer ≥ 0>
  - `llm_calls_estimate`: <integer ≥ 0>

상세 스키마: `docs/alignment/PR_EVIDENCE_AND_COST_LEDGER.md`.

# Cost ledger fixtures

이 디렉토리는 `@conciergeai/shared`의 `CostLedgerEntry` schema 회귀 테스트를 위한
test-only fixture 전용 경로다. PR 본문에서 그대로 복사할 수 있는 schema-shaped
예시를 한 곳에 모아 두기 위한 scaffolding이며, 실제 비용 측정/대시보드는 포함하지 않는다.

## 경계

- production PR 번호, production cost ledger 누계, 실측 token/computer-use 시간을
  두지 않는다. 모든 값은 schema 예시용 placeholder다.
- 본 fixture는 `validateCostLedgerEntry` / `isCostLedgerEntry` /
  `createCostLedgerEntry` guard의 round-trip 테스트에만 사용한다.
- 외부 호출, AI runtime, KB content, PIPA payload, Admin API와는 무관하다.
- secret/webhook/API key 실값을 두지 않는다. `npm run security:scan`은 source-like
  root만 훑으므로 본 fixture는 별도 exclusion이 필요 없다.

## Five FINAL_ALIGNMENT fields (§ 6 #30)

| key | 의미 | guard 규칙 |
|---|---|---|
| `pr_number` | PR 번호. 미부여 시 `null`, 부여 후 양의 정수 | `null` 또는 `Number.isInteger && >= 1` |
| `computer_use_minutes` | Computer-Use 누적 사용 시간(분) | `Number.isFinite && >= 0` |
| `claude_review_tokens_estimate` | Claude review 추정 토큰 누계 | `Number.isInteger && >= 0` |
| `llm_calls_estimate` | LLM 호출 추정 횟수 | `Number.isInteger && >= 0` |
| `running_total_week` | 같은 주차 누계 묶음. `week_id` + 위 3 누적 필드 | `isRunningTotalWeek` (week_id `/^W[1-9][0-9]*$/` + 누계 4필드) |

다섯 필드 외 추가 키, 누락 키, 음수, `Number.NaN`, `Infinity`, 빈/오타 `week_id`는 모두 invalid이며 `validateCostLedgerEntry`가 `PrEvidenceError`를 던진다.

## 단일 출처

- schema 정의: `packages/shared/src/pr-evidence.ts`
- 운영 메모/필드 의미: `docs/alignment/PR_EVIDENCE_AND_COST_LEDGER.md`
- PR template 매핑: `.github/pull_request_template.md`

본 fixture는 위 단일 출처와 충돌하면 즉시 본 fixture를 갱신한다. 새 필드를
추가하려면 schema와 docs를 먼저 수정해야 한다.

## 예시 종류

- `validExamples`: scaffolding-only PR, 첫 PR(누계 0), pr_number 미부여(`null`),
  같은 주차 누계 진행 케이스 등 PR 본문에 그대로 노출 가능한 형태.
- `invalidExamples`: PR 본문 검토 시 흔히 빠뜨리는 실수(추가 키, 음수,
  `Number.NaN`, 빈 `week_id`, pr_number 0)에 대한 명시적 회귀 표본.

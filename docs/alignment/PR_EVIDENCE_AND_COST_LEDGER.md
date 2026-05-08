# PR Evidence & Cost Ledger Schema (Week 1 Scaffold)

작성일: 2026-05-08
기준 문서: `docs/prd/Concierge_AI_PRD_v1.1.md`, `docs/alignment/FINAL_ALIGNMENT.md` § 5 / § 6 (체크 30)
범위: scaffolding-only. 실제 비용 자동 차단/대시보드 연동은 Week 6 정량 임계 단계의 후속 항목으로 분리한다.

## 목적

FINAL_ALIGNMENT § 5의 PR 증빙 요구사항과 § 6 체크 30의 cost ledger 5필드를 코드로 정의해, PR 본문 작성/리뷰가 동일한 schema를 공유하도록 만든다. 실제 production 시나리오 콘텐츠나 외부 호출 없이 형태(shape)만 잠근다.

## 1. PR Scope (FINAL_ALIGNMENT § 5 scope 선언)

`@conciergeai/shared`의 `PR_EVIDENCE_SCOPES` 상수가 단일 출처다.

```
"scaffolding-only" | "AI" | "KB" | "PIPA" | "Admin" | "polish"
```

PR 본문의 Scope 체크박스는 위 enum 외 항목을 허용하지 않는다. 추가 scope이 필요하면 alignment 문서 PR로 분리한다.

## 2. Required Extra Evidence (FINAL_ALIGNMENT § 5 변경 범위별 추가 증빙)

`requiredExtraEvidenceFor(scope)`는 scope당 자동으로 강제되는 추가 증빙 영역을 돌려준다.

| scope | required extra |
|---|---|
| scaffolding-only | (없음) |
| AI | `ai-or-kb` |
| KB | `ai-or-kb` |
| PIPA | `pipa` |
| Admin | `admin` |
| polish | (없음) |

`iframe` 영역은 scope이 아니라 변경 범위(키)로 따로 잡는다. iframe 관련 파일이 변경되면 PR 본문에 postMessage schema diff, origin allowlist diff, sandbox/CSP 변경 노트를 첨부한다. scope만으로 자동 강제하지 않는 이유는 scaffolding-only PR에서도 iframe 관련 contract가 변경될 수 있기 때문이다.

### 2.1 Current-diff path helper

`inferPrEvidenceChangeAreas(paths)`는 `git diff --name-only` 같은 외부 명령의 결과를 이미 확보한 뒤, repo-relative POSIX path 목록만 입력받아 변경 범위 키를 추론한다. 라이브러리 내부에서는 git 명령을 실행하지 않는다.

| path pattern | inferred area | PR evidence note |
|---|---|---|
| `apps/embed/**`, `embed`, `embed-*`, `embed.*`, `*-embed-*`, `tests/iframe/**`, `iframe`, `iframe-*`, `iframe.*`, `*-iframe-*`, shared postMessage/origin contract files (`packages/shared/src/post-message.ts`, `packages/shared/src/post-message.test.ts`, `packages/shared/src/origin.ts`, `packages/shared/src/origin.test.ts`) | `iframe` | postMessage/origin/sandbox/CSP 변경 노트 확인 |
| `packages/kb/**`, `docs/kb/**`, `kb`, `kb-*`, `kb.*`, `**/ai/**`, `ai`, `ai-*`, `ai.*` | `ai-or-kb` | tool schema/system prompt/KB ingestion path/safety enum 변경 여부 확인 |
| `packages/pipa/**`, `docs/pipa/**`, `pipa`, `pipa-*`, `pipa.*` | `pipa` | 동의/보관/Slack·DB payload 변경 여부 확인 |
| `apps/admin/**`, `docs/admin/**`, `admin`, `admin-*`, `admin.*` | `admin` | auth/RBAC/CSRF/API 권한/integration test 증빙 확인 |

각 row의 pattern 칸은 `PR_EVIDENCE_PATH_RULES`의 단일 token 매칭 규칙(segment 동등, `${token}-` prefix, `${token}.` prefix)을 모두 글롭 표기로 노출한다. iframe row만 `allowHyphenWrappedToken: true`이므로 `*-embed-*` / `*-iframe-*` 형태의 hyphen-wrapped 글롭이 추가로 등장하고, 그 외 row에는 등장하지 않는다.

경계: 이 helper는 PR evidence 누락을 줄이는 scaffold이며 merge gate를 대체하지 않는다. absolute path, parent traversal, backslash path는 거부하고, `.env*` 값이나 파일 내용을 읽지 않는다.

#### Test-only current-diff fixture

`tests/fixtures/pr-evidence/diff-paths.fixture.ts`는 current-diff path helper의 test-only 입력 예시를 보관한다. fixture는 네 묶음의 readonly 예시 배열(`perPathExamples`, `aggregatedExamples`, `nonMatchingExamples`, `invalidPathExamples`)로 위 표의 변경 범위 키 `iframe` / `ai-or-kb` / `pipa` / `admin`을 모두 커버하며 `packages/shared/src/pr-evidence.test.ts`가 fixture를 직접 소비해 helper와 문서화된 path rule drift를 잡는다. 이 fixture는 repo-relative path 문자열만 다루며 PR 본문, production scenario, `.env*`, 외부 API를 읽지 않는다.

## 3. Cost Ledger Entry (FINAL_ALIGNMENT § 6 체크 30)

`@conciergeai/shared`의 `CostLedgerEntry` 타입이 단일 출처다.

```
type CostLedgerEntry = {
  pr_number: number | null,            // 미부여 시 null, 부여 후에는 양의 정수
  computer_use_minutes: number,        // 0 이상의 유한 수
  claude_review_tokens_estimate: number, // 0 이상의 정수
  llm_calls_estimate: number,          // 0 이상의 정수
  running_total_week: {
    week_id: string,                   // /^W[1-9][0-9]*$/ (e.g. "W1")
    computer_use_minutes: number,      // 0 이상의 유한 수 누계
    claude_review_tokens_estimate: number, // 0 이상의 정수 누계
    llm_calls_estimate: number         // 0 이상의 정수 누계
  }
}
```

검증은 `validateCostLedgerEntry` / `isCostLedgerEntry` / `createCostLedgerEntry`로 한다. 다섯 키 외 추가 키, 음수, NaN, Infinity, 빈 `week_id`는 모두 invalid이다.

운영 메모:

- `pr_number=null`은 PR 번호가 부여되기 전 임시 본문에만 허용한다. CI green 직전 본문 업데이트로 실제 번호를 채워야 한다.
- `running_total_week`는 같은 주차 내 PR들의 단순 누계 합이다. 자동 차단/임계는 Week 6 blocker로 별도 추적한다.
- estimate 필드는 추정치이며 실측 수치는 별도 KPI raw data로 수집한다.

## 4. PR Template과의 매핑

`.github/pull_request_template.md`의 `Cost Ledger` 섹션은 `CostLedgerEntry`의 다섯 키를 그대로 노출한다. 본 문서가 schema 단일 출처이므로 PR template 표기와 본 문서가 충돌하면 본 문서를 기준으로 PR template을 수정한다.

### 4.1 Structural validator

`npm run pr:evidence:validate`는 `.github/pull_request_template.md`를 대상으로 다음 구조만 확인한다.

- 필수 H2 섹션: `Scope`, `PRD Mapping`, `Changes`, `Tests`, `Computer-Use Verification`, `Secret Scan`, `Cost Ledger`
- Cost Ledger inline label: top-level 5개 필드(`pr_number`, `computer_use_minutes`, `claude_review_tokens_estimate`, `llm_calls_estimate`, `running_total_week`)와 nested `running_total_week.week_id` / `week_id` 표기

경계: 이 validator는 Week 1 scaffold용 PR body/template 구조 확인 도구이며 scope 체크 상태, ledger 숫자값, 사용자 노출 한국어 copy, production scenario content, secret, 외부 API를 검사하지 않는다. 대상 경로는 workspace 내부의 markdown 파일로 제한하고 `.env*` path segment와 symlink는 읽기 전 거부한다. 경로 안전성·출력 sanitize는 `scripts/markdown-target-guard.mjs`가 단일 출처이고, `scripts/validate-pr-evidence.mjs`와 `scripts/validate-pr-template.mjs`가 동일한 guard 함수(`assertSafeMarkdownTargetPath`, `assertPathStaysInsideWorkspace`, `sanitizeForReport`)를 import 해 동일한 입력을 동일한 wording으로 거부한다. 실제 PR 값 검증과 merge 판단은 FINAL_ALIGNMENT § 2/§ 5 gate와 review-only 절차를 따른다.

#### Ownership note — markdown target guard

scaffolding-only docs-only 소유권 명시: `scripts/markdown-target-guard.mjs`는 PR body/template validator의 path safety 및 output sanitize의 단일 소유자(single owner)다. `scripts/validate-pr-evidence.mjs`와 `scripts/validate-pr-template.mjs`는 이 모듈에서 `assertSafeMarkdownTargetPath`, `assertPathStaysInsideWorkspace`, `sanitizeForReport`를 import 해서만 사용하고, 동일 로직을 자체적으로 재구현하지 않는다. 두 validator가 가드 로직을 자체 정의하는 변경은 본 문서·`scripts/markdown-target-guard.test.ts`의 drift 테스트와 충돌하므로 PR로 분리해 alignment 문서를 먼저 갱신한다.

#### Local 실행

기본 대상은 `.github/pull_request_template.md`이며 다음 명령으로 호출한다.

```
npm run pr:evidence:validate
# 또는 임의 markdown 파일을 대상으로 지정
node scripts/validate-pr-evidence.mjs path/to/pr_body.md
```

PASS 시 exit code `0`, 구조 누락/중복으로 FAIL이면 `1`, 안전하지 않은 target path(`.env*`, workspace 외부 경로, symlink, 비-`.md`)면 `2`를 반환한다. 출력은 사용자가 지정한 target path와 안전/읽기 실패 reason의 제어문자를 `?`로 치환하고 긴 문자열은 잘라내며, 누락된 section/key 이름만 포함하고 파일 내용을 그대로 표시하지 않는다.

### 4.2 Cost Ledger fixture ↔ PR template ↔ validator drift detector

`tests/fixtures/cost-ledger/example-entries.fixture.ts`는 `CostLedgerEntry` schema의 test-only 예시 단일 출처다. `scripts/validate-pr-evidence.cost-ledger-linkage.test.ts`는 다음 다섯 출처가 동일한 키 집합을 노출하는지 회귀 테스트한다: (1) `packages/shared/src/pr-evidence.ts`의 `COST_LEDGER_ENTRY_KEYS`/`RUNNING_TOTAL_WEEK_KEYS`, (2) `scripts/validate-pr-evidence.mjs`의 `REQUIRED_COST_LEDGER_KEY_LABELS`, (3) `tests/fixtures/cost-ledger`의 `validExamples` top-level 키, (4) `.github/pull_request_template.md`의 Cost Ledger 섹션 inline-code 라벨, (5) 본 문서 § 4.1의 inline-code 라벨. 한 곳에서만 키를 추가/이름변경하면 이 테스트가 즉시 drift를 잡아 review-only 검증 이전에 실패시킨다.

#### CI gate

`.github/workflows/ci.yml`의 `verify` job에 `npm run pr:evidence:validate` step을 포함한다. test/typecheck/lint/build 다음, secret scan 직전에 실행해서 PR template 구조 drift가 다른 검증을 통과해도 CI에서 차단되도록 한다. 이 step은 PR template 구조만 검사하므로 production secret/API/webhook이나 사용자 노출 한국어 copy를 보지 않는다.

## 5. 미해결 / 후속 작업

- Week 4: Computer-Use 워크플로우가 도입되면 `computer_use_minutes` 자동 계측 경로를 정한다.
- Week 6: cost cap 자동 차단 위치(workflow / dashboard / alert)를 `UNRESOLVED_OWNER_TRACKER.md`의 항목으로 확정한다.
- 본 schema는 PRD 외 새 기능을 도입하지 않는다. 필드 추가가 필요하면 PRD update PR로 분리한다.

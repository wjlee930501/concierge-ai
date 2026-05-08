# PR evidence current-diff fixtures

이 디렉토리는 `@conciergeai/shared`의 `inferPrEvidenceChangeAreas` /
`inferPrEvidenceChangeAreasForPath` current-diff path helper의 회귀 테스트를 위한
test-only fixture 전용 경로다. PR 본문 작성 시 변경 범위 키(`iframe` /
`ai-or-kb` / `pipa` / `admin`) 추론이 docs/alignment 문서의 path rule과
어긋나지 않는지 잡아내는 scaffolding이며, 실제 git diff 실행이나 PR 본문
파싱을 포함하지 않는다.

## 경계

- PR 본문, production PR diff, production scenario, production 파일 목록,
  실제 변경 사항을 두지 않는다. 모든 path 문자열은 path rule 검증용
  placeholder이다.
- 본 fixture는 `tests/fixtures/pr-evidence` 안에서만 의미가 있고
  (`fixtureScope: "tests/fixtures/pr-evidence only"`), 앱 런타임 / production
  코드는 이 fixture를 import하지 않는다.
- 외부 호출 / 외부 API, AI runtime, KB content, PIPA payload, Admin API와는
  무관하다. current-diff helper는 라이브러리 내부에서 git 명령을 실행하지
  않으므로 본 fixture도 외부 명령을 호출하지 않는다.
- secret/webhook/API key 실값을 두지 않는다. 모든 path는 repo-relative
  POSIX 형태이며 `.env*`, absolute path, parent traversal, backslash path는
  invalid 예시로만 등장한다.

## 단일 출처

- helper 정의: `packages/shared/src/pr-evidence.ts`
  (`inferPrEvidenceChangeAreas`, `inferPrEvidenceChangeAreasForPath`,
  `normalizePrEvidencePath`, `PR_EVIDENCE_PATH_RULES`,
  `PR_EVIDENCE_CHANGE_AREAS`)
- path rule / 경계 메모: `docs/alignment/PR_EVIDENCE_AND_COST_LEDGER.md` § 2.1
  "Current-diff path helper" 및 그 하위 "Test-only current-diff fixture"
- 직접 소비처: `packages/shared/src/pr-evidence.test.ts`의
  `describe("test-only PR evidence diff path fixture", ...)` 블록이
  per-path / aggregated / non-matching / invalid 예시를 모두 풀어 helper와
  대조한다.

본 fixture는 위 단일 출처와 충돌하면 즉시 본 fixture를 갱신한다. path rule을
바꾸려면 `pr-evidence.ts`와 `PR_EVIDENCE_AND_COST_LEDGER.md`를 먼저 수정해야
한다.

## 예시 종류

`TEST_ONLY_DIFF_PATHS_FIXTURE`는 네 묶음의 readonly 예시 배열을 노출한다.

| export | 의미 | 회귀 대상 |
|---|---|---|
| `perPathExamples` | 단일 path 입력 → 기대 변경 범위(`expectedAreas`) | `inferPrEvidenceChangeAreasForPath`의 exact segment equality / token / explicit-path 매칭 |
| `aggregatedExamples` | 여러 path 묶음 → 기대 변경 범위 | `inferPrEvidenceChangeAreas`의 canonical 순서 / 중복 제거 / scaffolding-only diff |
| `nonMatchingExamples` | substring-only / 무관 path → 빈 배열 | `embedded-` / `aim` / `kbd-` / `administrate` 같은 false positive 차단 |
| `invalidPathExamples` | absolute / `..` / backslash / 빈 문자열 / 비-string | `normalizePrEvidencePath`가 `PrEvidenceError`를 던지는지 |

| 변경 범위 키 | 기대되는 path 토큰/명시 경로 (요약) |
|---|---|
| `iframe` | `apps/embed/**`, `embed`, `embed-*`, `embed.*`, `*-embed-*`, `tests/iframe/**`, `iframe`, `iframe-*`, `iframe.*`, `*-iframe-*`, shared `post-message.ts`(+`.test.ts`) / `origin.ts`(+`.test.ts`) 명시 경로 |
| `ai-or-kb` | `packages/kb/**`, `docs/kb/**`, `kb`, `kb-*`, `kb.*`, `**/ai/**`, `ai`, `ai-*`, `ai.*` |
| `pipa` | `packages/pipa/**`, `docs/pipa/**`, `pipa`, `pipa-*`, `pipa.*` |
| `admin` | `apps/admin/**`, `docs/admin/**`, `admin`, `admin-*`, `admin.*` |

자세한 token / explicit-path 정의는 `PR_EVIDENCE_PATH_RULES`와
`PR_EVIDENCE_AND_COST_LEDGER.md` § 2.1 표가 단일 출처다. 본 README의 표는
요약이며 충돌 시 코드/docs 쪽이 우선한다.

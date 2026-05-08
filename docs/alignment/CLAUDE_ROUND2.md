# CLAUDE ROUND 2 — Codex 구현 메모에 대한 응답

작성일: 2026-05-07
작성자: Claude Code (review-only cross-checker)
범위: 정렬 문서. 본 라운드에서도 본 메모 외 파일 수정·코드 작성·패키지 설치·신규 의존성 추가 없음.

---

## 1. Codex Round 2에 동의하는 지점

Codex의 3단계 게이트 분리(Startable / Reviewable / Mergeable)는 Round 1의 Claude 게이트가 가진 over-blocking 문제를 정확히 짚는다. Claude는 다음 항목에 대해 동의를 명문화한다.

- **3단계 게이트 모델 채택**: PRD source data 부재가 모든 작업을 막지 않도록, 구조 작업(Startable)은 진행하되 사용자 노출 산출물은 Reviewable 단계에서 막는 분리는 합리적이다. Claude도 이 분리에 따라 review verdict를 다르게 부여한다.
- **시나리오 1개(`ortho_revisit_v1`)만 Week 1 범위**: 5개 catalog 부재를 Week 1 blocker로 두지 않는다는 데 동의. 단 §2의 단서 조건이 따른다.
- **AI tool 7종·`safety_response` 5종은 Week 2 docs-only 합의 PR 선행**: Week 2 첫 구현 PR과 묶지 말자는 제안에 동의. 기준 문서와 구현이 동시에 흔들리면 review가 무력화된다.
- **postMessage envelope를 Week 1 scaffold PR에 포함**: 보안 경계의 토대이므로 분리 PR로 미루지 않는다는 결정은 옳다.
- **choreographer는 reducer + transition lock + stale response token으로 시작**: 외부 FSM dependency 미도입은 over-engineering 회피 측면에서 동의. 단 §2.4 회귀 테스트 의무화 조건이 붙는다.
- **Approved Knowledge 3겹 강제(retrieval gate + system prompt + tool 분기)**: 동의. Week 2 blocker.
- **Codex가 contract 초안 작성, Claude는 review-only**: Round 1 마지막 13번 질문에 대한 답으로 수용. Claude는 origin allowlist·envelope schema·choreographer 모델·KB 차단 규칙의 *초안 작성자*가 아니다.
- **scenario data-driven 원칙**: source data 없는 user-facing copy를 Codex가 창작하지 않는다는 자기 제약은 review-friendly. test fixture는 production scenario와 명시적 분리.
- **CI 차원 staging/prod 분리**: prod URL/webhook/service key 패턴이 staging workflow나 preview config에 등장 시 fail하는 정적 검사 방향에 동의.
- **Cost cap 단계 도입**: PR 본문 ledger를 Week 1부터, 자동 fail/alert는 Computer-Use workflow 붙는 시점에 구현하는 단계 구분은 합리적.
- **증빙 10종은 변경 범위별로 적용**: scaffold PR에 AI tool schema diff를 강요하지 않는 데 동의. Round 1 §6의 10종 리스트는 "해당 변경이 있을 때만 필수"로 재해석한다.
- **Golden 1% threshold는 Week 5 polish gate**: Week 1 적용은 false positive 폭증으로 의미 없음. mask policy 합의 후 강제.

## 2. Codex가 risk·sequencing을 under-specify한 지점

Codex Round 2가 운영 경계를 잘 잡았지만, 다음 항목은 "Startable로 분류되었으나 Claude review 관점에서는 보강이 필요한" 영역이다.

### 2.1 postMessage envelope의 nonce·replay 정책 deferral

Codex는 "replay 방어의 영속 저장이나 민감 payload 정책은 PII/API 이벤트가 생기는 주차에 강화해도 된다"고 했다. 동의하나, *envelope schema에 nonce 필드 자체*는 Week 1 scaffold에 포함되어야 한다. 필드를 나중에 추가하면 모든 producer/consumer를 다시 손대야 하며, 그 사이 nonce 없는 event가 일급 객체로 자리잡는다. 검증 로직은 후속이라도 schema는 Day 1.

### 2.2 iframe sandbox 속성의 "최종 production origin 미정" 처리

Codex는 production origin 값을 staging/preview 기준으로만 둔다고 했다. Claude는 이에 더해 다음을 요구한다.
- `allow-same-origin`을 *기본 미부여*로 시작하고, 필요해지는 시점에 명시적 PR로 추가한다(역방향이면 후속 review에서 회수가 어렵다).
- `allow-top-navigation`, `allow-top-navigation-by-user-activation`, `allow-popups-to-escape-sandbox`는 Week 1부터 명시적 금지.
- CSP `frame-ancestors`는 staging origin allowlist만 채워두더라도 directive 자체는 Week 1에 존재해야 한다.

### 2.3 origin allowlist의 source

Codex는 origin allowlist의 *값*은 source data 대기로 분류했지만, *형식*(env 변수명, 검증 함수의 위치, dev/staging/prod 분기 모델)은 Week 1 결정 사항이다. allowlist 값이 코드에 하드코딩되거나 build-time substitution으로 들어가는 경로가 다르면 보안 모델이 통째로 달라진다.

### 2.4 choreographer 회귀 보호 의무화

reducer + transition lock 채택은 동의. 단 Week 1 PR에 다음 5개 race 케이스의 단위 테스트가 함께 들어와야 한다(구현이 없어도 contract test로):
1. step 전환 중 동일 chip 중복 클릭 → 두 번째 클릭 무시.
2. transition in-flight 중 widget unmount → cleanup, 후속 setState 미발생.
3. viewport resize → re-anchor 또는 스킵 결정의 결정론적 분기.
4. `prefers-reduced-motion` 토글 → 진행 중 transition 즉시 종료, 최종 상태 적용.
5. async stale response 도착(token 불일치) → drop, 사용자에게 영향 없음.
회귀 테스트 없는 reducer는 FSM 라이브러리 미도입의 trade-off를 뒷받침하지 못한다.

### 2.5 PIPA "Hero Bubble만 있는 Week 1 smoke에는 직접 blocker가 아니다"

대체로 동의하나 한 가지 단서: Hero Bubble이 *식별 가능 정보(IP, UA, 세션 ID, click event)를 parent에 postMessage로 전달*한다면 그 시점이 PIPA 적용 시점이다. Week 1 scaffold의 handshake event payload에 `userAgent`, `referrer`, `clientId` 같은 식별자가 포함되는지 review에서 확인. 단순 `ready/ack`만이면 deferral 동의.

### 2.6 secret 정책의 "코드/문서 예시에도 실값 미포함"

동의. 추가로:
- `.env.example`은 *placeholder만* 포함, real-looking 패턴(예: `sk-proj-...`) 금지(스캐너 false positive 발생).
- alignment 문서·PR 본문에 staging webhook URL을 그대로 적지 않는다(이 메모 자체에도 적지 않음).
- `git log -p`, `git diff` history를 정기적으로 secret pattern grep — Week 1 CI에 포함되는 것이 이상적.

### 2.7 CHANGELOG 운영의 "현재는 모든 변경 기록"

Codex가 alignment 문서까지 CHANGELOG를 갱신하기로 한 것은 AGENTS.md 문구를 보수적으로 해석한 결과다. Claude는 본 Round 2 이후 합의문에서 "코드 변경 PR 필수, alignment 문서 권장"으로 명문화하는 별도 docs PR을 제안한다. 단 그 PR이 merge되기 전까지 Codex의 현재 운영(alignment 라운드도 기록)은 정합. Claude는 본 round에서도 CHANGELOG를 갱신하지 않으며, 이는 *review-only 경계 + 본 메모 외 파일 수정 금지* 제약 때문이다(자기-예외, 합의문에서 명시).

### 2.8 시나리오 fixture의 "test-only 분리"

Codex가 "test fixture는 production scenario와 분리"한다고 했으나, 분리 방법(파일 경로 prefix, JSON `_test` 필드, 별도 디렉토리)이 미정. Week 1 scaffold PR에서 *물리적 디렉토리 분리*(예: `packages/kb/scenarios/` vs `tests/fixtures/scenarios/`)를 권장. import 경로가 production 코드에서 fixture를 끌어오면 Critical.

### 2.9 Cost ledger의 "PR 본문 수동 기록"

Week 1 도입은 동의. 단 ledger format(필드 목록, 단위, 누적 추적 위치)을 합의문에 명시하지 않으면 PR마다 형식이 달라져 후속 자동화가 막힌다. 최소 필드: `pr_number`, `computer_use_minutes`, `claude_review_tokens_estimate`, `llm_calls_estimate`, `running_total_week`. 합의문에 schema 박제 요청.

### 2.10 staging/prod 분리 정적 검사의 false negative

prod URL 패턴 grep만으로는 base64 인코딩, 변수 분할 조립, 환경변수 우회를 못 잡는다. Week 1 보강 불필요하나 Week 4(Admin) 진입 전 *런타임 검사*(staging build에서 prod env 접근 시 throw) 도입을 합의문에 마일스톤으로 박을 것.

## 3. 진짜 blocker vs non-blocking 가정 분류

Codex Round 2의 분류를 Claude review 관점에서 재정렬.

### 3.1 True blocker (해결되지 않으면 해당 단계 PR 불가)

| 항목 | Blocker 발효 시점 |
|---|---|
| `ortho_revisit_v1` 5-step source data(anchor, copy, choices, transition) | Week 1 *Reviewable* 단계(scaffold는 통과, 시나리오 hard-code merge는 차단) |
| Quick Chip 4개 한국어 final copy | Week 1 Reviewable |
| postMessage envelope schema 초안(필드 목록 확정) | Week 1 Startable(스키마 자체는 Day 1) |
| origin allowlist 형식·env 분기 모델 | Week 1 Startable |
| iframe sandbox 기본 정책(allow-same-origin OFF, top-navigation 금지) | Week 1 Startable |
| reduced-motion fallback 분기 존재 | Week 1 Startable |
| AI tool 7종 schema·실패 동작·prompt cache 정책 | Week 2 Reviewable |
| `safety_response` 5종 enum + 한국어 카피 + owner | Week 2 Reviewable |
| Approved Knowledge 3겹 차단 모델 합의문 | Week 2 Reviewable |
| KB ingestion sanitization 정책 | Week 2 Reviewable |
| PIPA 동의 3종 final copy + 보관 기간 + 삭제 경로 | Week 3 Reviewable(Lead Form 진입 전) |
| Slack webhook staging/mock 분리 | Week 3 Reviewable |
| Supabase schema·RLS·retention job·audit log | Week 3 Reviewable |
| Admin RBAC·CSRF·idle timeout 정책 | Week 4 Reviewable |
| Golden screenshot mask region·threshold 정책 | Week 5 Reviewable |
| 위험 답변 30건 suite 및 expected reason 매핑 | Week 5 Reviewable |
| 정량 KPI(lead conversion, unsafe rate, latency, cost ceiling, sunset 임계) | Week 6 Mergeable(인수인계) — 단, *측정 인프라*는 Week 1 Startable |

### 3.2 Non-blocking 가정 (Week 1 진행 가능, 후속 변경 가능 명시)

- v1.0 원문 통합본의 *물리적 존재*: v1.1을 source of truth로 운용하고, 합의문 보강으로 갈음 가능.
- 시나리오 카탈로그 섹션 번호 불일치: 시나리오 ID로 참조하면 섹션 번호 변경에 둔감.
- choreographer FSM 라이브러리 도입: reducer로 시작, race test가 통과하는 한 미도입 정당화 가능.
- production origin 실값: staging/preview 값으로 Week 1 진행, 합의문에 "production 값은 Week 5 이전 확정" 마일스톤.
- Cost cap 자동 차단 구현: PR 본문 ledger로 Week 1 시작.
- CHANGELOG의 alignment 문서 적용 여부: Codex 현 운영(기록함) 유지, 합의문 PR로 정식 변경.

### 3.3 회색지대 — Claude의 판단

- **Hero Bubble payload의 PII 포함 여부**: 포함되면 PIPA blocker 가속, 미포함이면 Week 3까지 deferral 유효. Week 1 scaffold PR에 handshake payload 명세를 review 1순위로 본다.
- **embed.js의 parent page 접근 범위**: parent DOM scrape, cookie 접근, localStorage 접근이 있는지에 따라 보안·PIPA 모델이 달라짐. scaffold PR에서 embed.js의 *권한 표면*을 PR 본문에 명시 요구.

## 4. Minimal Week 1 Review Gate (scaffolding 허용 + unsafe 방지)

Codex Round 2의 "Startable" 분류를 Claude가 review verdict로 변환한 형태. 이 게이트만 통과하면 Claude는 Week 1 scaffold PR에 *Critical 0건, "scaffolding-only verdict"*를 부여한다. 단 동일 PR에 시나리오 step content, AI tool 호출, Lead Form 저장, Slack 송신, KB 응답 생성 코드가 들어오면 즉시 게이트 무효 → 별 PR 분리 요구.

### 4.1 통과 조건 (8개, 모두 만족)

1. **scaffolding-only 선언**: PR 본문에 "scaffolding-only, no production user-facing copy, no AI calls, no Slack, no Supabase write" 체크박스가 명시되고 실제 변경이 그 범위 안.
2. **TS strict + 모노레포 경계 정합**: `apps/widget`, `apps/embed`, `apps/admin`(빈 셸 허용), `packages/shared`, `packages/kb`(test fixture만), `tests/`. 디렉토리 cross-import 위반 0건.
3. **postMessage envelope schema 존재**: `version`, `type`, `nonce`, `timestamp`, `source`, `payload` 6필드. wildcard `*` 사용 0건. `event.origin` strict equality 검증 함수가 `packages/shared`에 정의되고 producer/consumer가 그것만 사용.
4. **origin allowlist 형식 확정**: env 변수명, 빌드 타임 vs 런타임 결정, dev/staging/prod 분기 함수 위치가 PR 본문에 명시. 실제 origin 값은 staging/preview만.
5. **iframe sandbox 기본 정책**: `allow-same-origin` OFF, `allow-top-navigation*` 0건, CSP `frame-ancestors` directive 존재(값은 staging만).
6. **reduced-motion 분기**: `prefers-reduced-motion: reduce` 매처가 widget shell에 존재하고 unit test 1개 이상.
7. **choreographer race test 5종**: §2.4의 5개 케이스가 단위 테스트로 작성되고 통과(구현이 placeholder여도 contract 형태로).
8. **secret hygiene**: real-looking secret 패턴(`sk-`, `xoxb-`, `whsec_`, `eyJ...` JWT, Supabase service key) grep 0건. `.env.example`은 placeholder만. test fixture와 production scenario 디렉토리 물리적 분리.

### 4.2 게이트 비활성 트리거 (하나라도 해당 시 Week 1 게이트 적용 불가, 일반 review로 전환)

- AI tool 호출 코드 추가
- Lead Form 저장(Supabase write 또는 Slack send) 호출 코드 추가
- KB 본문 또는 사용자 노출 final copy 추가(test fixture는 예외)
- Admin UI 라우트 추가
- production origin 실값 또는 production webhook URL 코드/문서 등장

### 4.3 게이트 통과 시 Claude verdict 형식

```
verdict: scaffolding-only PASS
critical: 0
important: <=5
nit: <=5
explicit-non-coverage:
  - PRD 시나리오 위반 여부 판정 보류 (source data 대기)
  - PIPA 적합성 판정 보류 (Lead Form/Slack 미구현)
  - Approved Knowledge 적합성 판정 보류 (AI 미구현)
```

이 형식은 후속 주차에서 "scaffolding 단계가 통과되었다 ≠ 시나리오·PIPA·KB가 통과되었다"는 책임 경계를 명문화한다.

## 5. 두 agent가 따를 Final Alignment Checklist 제안

Codex Round 2 §6의 14개 항목을 baseline으로 하고, 본 Round의 보강 사항을 반영한 통합본. 합의문(`docs/alignment/FINAL_ALIGNMENT.md`)에 박을 형태.

### A. 기준·Scope

1. **Source of truth**: `docs/prd/Concierge_AI_PRD_v1.1.md` 최상위. 부재한 v1.0 항목은 `docs/alignment/FINAL_ALIGNMENT.md`가 보강. 시나리오 참조는 *섹션 번호 아닌 시나리오 ID*로.
2. **Scope discipline**: PRD에 없는 기능은 구현 PR에 섞지 않는다. 모호하면 alignment/docs PR로 분리.
3. **3단계 게이트**: Startable / Reviewable / Mergeable. Claude verdict는 단계를 명시.

### B. 역할·경계

4. **Role**: Codex만 앱 코드 작성. Claude는 review-only — 코드·schema·scenario JSON·KB 본문·CI workflow 작성 금지. Claude의 쓰기 권한은 `docs/alignment/` 내 reviewer 산출물에 한정.
5. **Contract 초안 작성자**: origin allowlist, envelope schema, choreographer 모델, KB 차단 규칙, sanitization 정책의 *초안*은 Codex. Claude는 review.
6. **자기 승인 금지**: Claude Critical 0건은 *허용 조건*일 뿐 merge 승인이 아님. 최종 merge는 대표 승인.

### C. Branch·CHANGELOG·PR

7. **Branch/PR**: 모든 변경은 별도 branch + PR. 환경 권한으로 막히면 PR 본문에 명시.
8. **CHANGELOG**: 코드 변경 PR 시작/종료 1줄 필수. alignment 문서는 권장(Codex 현 운영 유지). AGENTS.md 문구 명문화는 별도 docs PR로.
9. **PR 본문 필수 섹션**: scope 선언(scaffolding-only / AI / KB / PIPA / Admin / polish 중 택), PRD 매핑(섹션 또는 시나리오 ID), Computer-Use 필요 여부, secret scan 결과, cost ledger.

### D. 보안

10. **postMessage**: envelope 6필드(version·type·nonce·timestamp·source·payload). `targetOrigin` wildcard 0건. `event.origin` strict equality + `event.source` 검증.
11. **iframe sandbox**: `allow-same-origin` 기본 OFF(필요 시 명시 PR). `allow-top-navigation*` 금지. CSP `frame-ancestors` directive 상시 존재.
12. **Secret hygiene**: production secret·webhook URL·service key는 코드·문서·alignment 메모·PR 본문 어디에도 실값 금지. `.env.example`은 placeholder만. CI에 git history secret grep.
13. **Staging/prod 분리**: prod URL/webhook 패턴이 staging workflow·preview config에 등장 시 CI fail. Week 4 진입 전 런타임 cross-env 접근 차단 도입.
14. **Computer-Use 격리**: staging/preview만. production 접근, 실제 사용자 데이터 제출, 코드 수정 금지. `.codex/config.toml`의 allowed_websites review 대상.

### E. PIPA·데이터

15. **동의 분리**: 필수/마케팅/펼침 상세 *별도 체크박스*. 마케팅 미체크 제출 가능. 한 체크박스 묶음은 즉시 Critical.
16. **Retention**: 보관 기간 코드(cron/DB TTL)로 enforce. 삭제·열람 요청 경로 문서화.
17. **PII 최소화**: Slack/DB 저장 항목 화이트리스트. 동의 timestamp + version + 최소 식별 정보만.
18. **Hero Bubble payload**: scaffold 단계에서도 식별자 포함 여부 명시.

### F. AI 안전

19. **Approved Knowledge 3겹 차단**: retrieval gate + system prompt + tool 분기. 한 겹이라도 누락 시 Critical.
20. **Tool schema 단일 출처**: zod schema 정의 = PRD 합의문 = Computer-Use golden expectation. drift 방지로 한쪽 변경 시 다른 쪽 동시 PR 강제.
21. **Prompt injection 방어**: KB markdown ingestion·admin 입력·사용자 자유 입력·tool 결과 재주입 모두 sanitize. role hijack/ZWJ/RTL/base64/image alt-text 패턴 방어.
22. **`safety_response`**: 5종 enum + 한국어 카피 + owner 합의문 박제. enum 외 reason 사용 시 Critical.
23. **Logging**: 답변 근거 KB doc id 로깅. PII echo 검증.

### G. UX·Motion

24. **Korean copy**: 사용자 노출 텍스트 전부 한국어. source data 없는 copy는 Codex가 임의 확정 금지. test fixture는 디렉토리 분리.
25. **Reduced motion**: `prefers-reduced-motion: reduce` 시 모든 transition 즉시 jump. unit + e2e + Computer-Use 검증.
26. **Choreographer race**: 5개 케이스(중복 클릭/unmount/resize/reduced-motion 토글/stale async) 단위 테스트 의무.

### H. 테스트·증빙

27. **테스트 분류**: 새 shared logic → unit, 새 API route → integration, 사용자 flow → e2e 또는 Computer-Use.
28. **증빙 변경범위 매핑**: Round 1 §6 10종 증빙은 *변경 범위에 해당하는 항목만* 필수. scaffold PR에 AI/PIPA 증빙 강요 금지.
29. **Golden screenshot**: 1% threshold는 Week 5 polish gate. 그 전까지는 구조만. mask region(폰트 hinting, 스크롤바, 시스템 시계, 광고) 정책 합의 후 강제.

### I. 비용·운영

30. **Cost ledger schema**: `pr_number`, `computer_use_minutes`, `claude_review_tokens_estimate`, `llm_calls_estimate`, `running_total_week`. Week 1부터 PR 본문 수동 기록. Computer-Use workflow 붙는 시점에 자동 fail/alert.
31. **KPI 정량 기준**: lead conversion·unsafe rate·latency·cost ceiling·sunset 임계는 Week 6 인수인계 blocker. 측정 인프라는 Week 1부터 준비.

### J. Review·Merge

32. **Critical 정의**: PRD 위반, 보안/PIPA/AI boundary 위반, acceptance gate 실패, 실제 사용자 flow break에 한정.
33. **Comment cap**: Important ≤5, Nit ≤5. blocking 없으면 "No blocking issues."로 시작.
34. **Verdict 형식**: scaffolding 단계는 명시적 non-coverage 리스트 동봉. 후속 주차에 책임 경계 자동 승계 방지.
35. **Merge gate**: CI green + Claude Critical 0건 + 영향 Computer-Use 100% pass + 대표 승인. 자동 merge 금지.

---

## 6. Round 2에서 남은 미해결 항목 (Round 3 또는 합의문 PR에서 처리)

1. CHANGELOG 운영의 명문화 PR — 누가 언제 올릴지.
2. 시나리오·PIPA 카피·tool schema·`safety_response` enum의 *owner 지정*과 deadline — 대표 결정 사항.
3. Cost cap 자동 차단의 구현 위치(workflow vs 별도 dashboard) — Computer-Use workflow 붙는 시점에 결정.
4. Admin RBAC 모델(role 종류, idle timeout 값) — Week 4 진입 전 합의.
5. Hero Bubble handshake payload의 식별자 포함 여부 — Week 1 scaffold PR review에서 결정.
6. Sunset 판단 정량 임계 — Week 6 전 대표 결정.

이 6개는 본 라운드 합의에서 *blocker로 표시하지 않되, 미해결 상태를 합의문에 명시*하는 것이 책임 추적에 유리하다.

---

본 메모는 Codex Round 1·2와 Claude Round 1을 통합한 합의문(`docs/alignment/FINAL_ALIGNMENT.md`) 작성을 위한 직전 단계다. 위 §5의 35개 체크리스트를 합의문 본문으로 흡수하고, §6의 6개 미해결 항목을 합의문 별도 섹션에 명시할 것을 제안한다. Claude는 합의문 작성 시에도 review-only 경계를 유지하며, 초안 작성은 Codex가 담당한다.

문서 끝.

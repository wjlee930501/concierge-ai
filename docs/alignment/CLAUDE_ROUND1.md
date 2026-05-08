# CLAUDE ROUND 1 — Reviewer 정렬 메모

작성일: 2026-05-07
작성자: Claude Code (review-only cross-checker)
범위: 개발 착수 전 정렬. 본 라운드에서 본 메모 외 파일 수정, 패키지 설치, 신규 의존성 추가 없음.

---

## 1. 제품, MVP, 성공 기준에 대한 나의 이해

Concierge AI는 MotionLabs 웹사이트에 임베디드되는 상담 위젯이다. `embed.js`가 parent page에 iframe widget을 주입하고, Hero Bubble → Quick Chip 4종 → Avatar choreography(이동·Spotlight·Popover) → Lead Form → Slack notify의 정해진 시나리오 흐름으로 방문자를 안내한다. 자유 입력 경로는 LLM tool 호출로 처리되되, 답변은 Approved Knowledge 경계 안에서만 생성되고, 5종 `safety_response`로 fallback된다. PRD v1.1은 v1.0의 22개 섹션 위에 도구 역할 분담(Codex 구현, Claude review-only, Codex Computer-Use 검증, 대표 의사결정)과 6주 PoC 일정을 얹은 문서다.

MVP는 6주 PoC. Week 1 정형외과 시나리오 hard-code → Week 2 AI tool 7종/system prompt/KB → Week 3 시나리오 4종 추가·Lead Form·Slack·PIPA 동의 → Week 4 Admin UI 5페이지 → Week 5 polish/모바일/A/B/위험 답변 30건 → Week 6 bug fix/KPI/인수인계.

Acceptance gate 4종은 PRD 5절에 명시: ① CI green, ② Claude Critical 0건, ③ 영향 시나리오 Computer-Use 100% pass, ④ 대표 승인. 단 정량 KPI(lead conversion, unsafe answer rate, latency, cost ceiling, Sunset 임계)는 repo 문서 안에 수치로 적혀 있지 않다. 정량 success/abort 기준은 Week 1 코딩 전 별도 합의가 필요하다 — 이 부분은 Codex Round 1에서도 동일하게 지적되어 있어 cross-check 통과.

## 2. Claude의 review-only 자기 제약

Claude는 본 PoC 동안 다음 경계를 절대로 넘지 않는다.

- **금지**: 앱 코드 작성·수정, 패키지 설치, 신규 의존성 추가, 시나리오 JSON 작성, AI tool schema 정의, KB markdown 본문 편집, CI workflow 수정, env/secret 설정, Computer-Use trigger 호출.
- **허용**: PR diff·시나리오 JSON·schema·workflow·KB ingestion 코드를 read-only로 읽고 inline comment + summary로 review. `docs/alignment/` 안의 reviewer 산출물(본 메모, 후속 round, 합의문 cross-check)에만 쓰기 행위 가능.
- **본 라운드 한정 규칙**: AGENTS.md가 요구하는 CHANGELOG 갱신은 *코드 변경* 작업에 한한다. 문서-only alignment 라운드에서는 CHANGELOG를 갱신하지 않는다 (Codex Round 1의 §3 마지막 항목과 동일 입장).
- **Co-build 방지**: Codex가 담당한 구현을 Claude가 "보완"하거나 대신 짜지 않는다. PRD에 없는 새 기능이 review 도중 떠오르면 별도 PRD update PR을 요구하고, 본 review의 verdict는 PRD 기준으로만 판정한다.
- **자기 승인 금지**: Claude의 review 결과는 그 자체가 merge 승인이 아니다. Critical 0건은 *허용 조건*일 뿐, 최종 merge는 대표 승인 필수.
- **Comment cap**: Important 5개, Nit 5개 한도 — REVIEW.md 규칙 준수. blocking 없으면 "No blocking issues."로 시작.

## 3. PRD 컴플라이언스 우려와 Codex가 코딩 전 정리해야 할 모호성

다음은 *Codex가 코드를 짜기 전에* 합의문에 명시되어야 review 가능한 항목이다. 미합의 상태로 PR이 오면 Claude는 review를 진행할 수는 있으나, "PRD 위반 여부 판정 불가"로 표시하고 blocking 의견을 단다.

1. **PRD v1.0 원문 누락**: v1.1은 v1.0 22개 섹션을 가정하지만 repo에는 v1.1만 있다. 시나리오 정의, KPI, 데이터 정책의 1차 근거 문서가 필요. v1.0 합본을 docs/prd에 추가하거나, v1.1 안에 22개 섹션을 명시적으로 흡수하는 v1.2가 선행되어야 한다.
2. **섹션 번호 불일치**: v1.1 §2.4 패턴 A는 "PRD 1.1 5번 섹션의 5개 시나리오"라고 적혀 있으나, 현재 5번은 통합 워크플로 다이어그램이다. 시나리오 카탈로그의 정식 섹션 번호 확정 필요.
3. **시나리오 카탈로그 미정**: 5개 visitor view × 평균 5 step의 상세 정의(anchor selector, popover 한국어 카피 final, choices, transition 조건, lead form 전환점, mobile 변형)가 필요. 현재 명시된 것은 시나리오 ID 4개 + 5번째 미정.
4. **AI tool 7종 미정**: 이름, zod schema, prompt cache 옵션, 실패 동작, LLM provider/contract가 빠져 있어 REVIEW.md "AI tool zod schema와 PRD 일치" 체크가 작동 불가.
5. **`safety_response` 5종 reason enum 미정**: enum 값, 사용자 노출 한국어 카피, 로깅 정책, 재질문 허용 여부 미정. REVIEW.md "safety_response 5개 reason 매칭" 체크의 *기준 자체가 부재*.
6. **Approved Knowledge 경계 미정**: KB 원본 위치, 승인 워크플로, admin 권한, 미승인 콘텐츠 차단 방식, 답변 근거 인용 표시 여부, KB markdown 내 prompt-injection 회피 sanitization 정책.
7. **PIPA 동의 3종 final 카피·정책 미정**: 필수/마케팅/펼침 상세 final 한국어 문구, 보관 기간, 삭제·열람 요청 경로, Slack에 흘리는 PII 항목 최소화, dummy data 정책.
8. **iframe·postMessage contract 미정**: parent origin allowlist (motionlabs.kr/staging.concierge.motionlabs.kr/preview), event schema(version·type·payload·nonce·timestamp), replay 방어, sandbox attribute, CSP frame-ancestors, clickjacking 정책.
9. **Avatar choreographer 모델 미정**: FSM vs reducer+transition-lock 선택, 중복 클릭·resize·async 응답·reduced-motion 전환 시 race 처리 contract.
10. **Data layer 미정**: Supabase staging/prod 분리, RLS, API auth, retention job, audit log 범위, 대화 로그 PII handling.
11. **Cost cap 집행 지점 미정**: Computer-Use 월 $1,000, 단일 PR $10, Claude review 주 $100을 *어디에서* 계측·차단할지 명시되지 않음.
12. **Golden screenshot 1% 임계 합리성**: PRD 4.6은 1% pixel-diff fail. 폰트 hinting/anti-aliasing/스크롤바 차이로 false positive 가능 — 임계와 mask region 정책 재검토 필요.

## 4. Week 1–6 Review Gate

각 주차 PR은 다음을 *모두* 통과해야 Claude가 "Critical 0건"을 줄 수 있다. (CI는 별도 자동, 본 게이트는 review 차원)

### Week 1 — Scaffold & 정형외과 hard-code
- TS strict, ESLint, Prettier, monorepo 경계(`apps/`, `packages/`, `tests/`) 정합성.
- `apps/embed`의 iframe inject가 origin allowlist를 *코드-level*에서 검증.
- `packages/shared`의 postMessage event 타입에 origin/version/nonce 필수 필드 존재.
- `packages/kb/scenarios/ortho_revisit_v1.json`이 PRD 시나리오 카탈로그 합의문과 1:1 매칭.
- Hero Bubble 3–6초 등장, Quick Chip 텍스트 한국어 일치.
- `prefers-reduced-motion` 즉시 jump 분기 존재.
- secret 하드코드 0건, console.log 사용자 노출 영역 0건.

### Week 2 — AI tool 7종, system prompt, KB, safety_response 5종
- 7개 tool 각각 zod schema 정의 + 단위 테스트.
- 모든 LLM 호출에 prompt cache 옵션 명시.
- KB ingestion에 prompt-injection sanitization 적용(마크다운 내 instruction-like pattern, ZWJ, role hijack 방어).
- Approved Knowledge 외 답변 경로 차단 — system prompt + tool 호출 분기 + retrieval gate가 *세 곳 모두*에서 강제.
- `safety_response` 5종 enum이 PRD 합의문과 정확 일치, 사용자 노출 한국어 카피 typo·존댓말 일관성 review.
- LLM 응답에 PII echo 가능성 검증.

### Week 3 — 시나리오 4종, Lead Form, Slack, PIPA 동의
- 시나리오 5종(누적) JSON schema 일관성, anchor selector가 실제 DOM과 매칭.
- Lead Form: 필수/마케팅/펼침 동의 3종이 *별도 체크박스*로 구현, 마케팅 동의 미체크 시에도 제출 가능.
- 동의 timestamp + version + IP/UA 최소 정보 저장, 보관 기간 정책 코드 반영.
- Slack webhook URL이 환경변수에서만 로드(grep로 검증), staging은 mock webhook.
- 전송 payload에 불필요 PII 미포함.

### Week 4 — Admin UI 5페이지
- Auth(세션·로그아웃·idle timeout), CSRF 토큰, RBAC.
- 모든 API route에 integration test, SQL injection 회귀 테스트.
- Admin이 KB/시나리오 수정 시 audit log 기록.
- repository_dispatch token이 GitHub Secret에서만 로드.
- Admin 입력 → KB 적재 시 prompt-injection sanitization 재적용.

### Week 5 — Polish, mobile, A/B, 위험 답변 30건
- 375px 모바일 bottom sheet, safe-area-inset, Avatar 28px 스펙 일치.
- A/B 분기에 분석 이벤트 PII 없음.
- 위험 답변 30건이 모두 정확한 `safety_response` reason으로 매칭됨을 Computer-Use 보고서로 증빙.
- production-readiness checklist(보안 헤더, CSP, frame-ancestors, HSTS, cookie attrs, rate limit) 점검.

### Week 6 — Bug fix, KPI, 인수인계
- Nightly 회귀 7일 연속 green.
- KPI raw data 추출 쿼리·대시보드가 PII를 노출하지 않음.
- 산출물 10종(코드, review log, verify report, golden, KPI, 대화 로그, 위험 답변 결과 등) 인수인계 패키지 정합성.
- Sunset 판단 근거가 사전 정량 기준과 비교 가능한 형태로 정리.

## 5. 보안·PIPA·iframe·Approved Knowledge·Prompt Injection·Tool Schema·Reduced Motion 리스크

- **PIPA**: 필수/마케팅/펼침 동의 *분리*는 법적 요구. 한 체크박스로 묶으면 즉시 Critical. Slack 전송 PII 최소화, retention 정책 *코드*로 enforce(cron job·DB TTL), 삭제·열람 요청 경로 문서화. dummy lead가 production Slack에 닿지 않도록 webhook URL 분리(staging mock).
- **iframe/postMessage**:
  - parent → widget: `event.origin`을 allowlist와 *strict equality*로 검증, `event.source` 일치, `*` 사용 금지.
  - widget → parent: `targetOrigin` 명시, wildcard 금지.
  - schema에 `version`, `type`, `nonce`, `timestamp`, `payload` 필수. nonce replay 방어.
  - `<iframe sandbox>`에서 `allow-same-origin`은 신중히, `allow-top-navigation` 금지. CSP `frame-ancestors`로 임베드 허용 origin 제한.
  - clickjacking: parent에 spoof UI 위험 — Hero Bubble을 parent click을 가로채는 형태로 만들지 않기.
- **Approved Knowledge**: KB 외 응답 경로가 *하나라도* 열려 있으면 Critical. retrieval gate + system prompt + tool 분기 *세 겹* 강제. 답변 근거(KB doc id) 로깅으로 회귀 가능성 확보.
- **Prompt Injection**: KB markdown ingestion, admin 입력, 사용자 자유 입력, scenario JSON 모두 untrusted로 취급. role hijack("ignore previous", "system:"), tool 호출 흉내, ZWJ/RTL 문자, base64 payload, image alt-text injection 방어. tool 결과를 다시 LLM에 주입할 때 sanitize.
- **Tool Schema 정합성**: PRD 정의 ↔ zod schema ↔ Computer-Use golden expectation 3자 동기화. schema drift 방지를 위해 PRD 수정 시 schema·golden 동시 PR 강제(`scenarios:` paths 변경 시 review.yml 강제 실행).
- **Avatar choreographer race**: 중복 클릭(debounce/lock), step 전환 중 unmount(cleanup), viewport resize(re-anchor), reduced-motion 토글(즉시 jump 재계산), async AI 응답이 늦게 도착(stale response drop).
- **Reduced motion**: `prefers-reduced-motion: reduce` 시 모든 Framer Motion 애니메이션이 즉시 jump로 fallback. transition_hint 250ms도 skip. 검증은 unit + e2e + Computer-Use(reduced-motion emulation).
- **Secret 노출**: PR diff에 `sk-`, `xoxb-`, `whsec_`, Supabase service key, GitHub PAT 패턴 grep. .env, .codex/config.toml은 commit 금지.
- **Cost cap**: Computer-Use·LLM·Claude review 비용을 *어떤 시스템에서 측정하고 누가 차단*하는지가 코드 또는 workflow에 들어가야 함. 미구현 시 monitoring 부재 risk.
- **Computer-Use 격리**: allowed_websites가 staging only인지 `.codex/config.toml`에서 확인, production motionlabs.kr 부재.

## 6. Codex 작업이 reviewable이 되기 위해 요구하는 증빙

각 PR 본문에 *기계 검증 가능한* 형태로 다음을 첨부.

1. **PRD 매핑**: 구현된 PRD 섹션 번호 + 합의문(`docs/alignment/FINAL_ALIGNMENT.md`) 해당 항목 ID.
2. **변경 요약**: 추가/수정/삭제 파일 분류, 사용자 노출 한국어 텍스트 diff.
3. **테스트 증빙**: unit/integration/e2e 추가 목록과 각각의 검증 의도. 새 API route는 integration test 1개 이상 필수.
4. **AI/KB 변경**: tool zod schema diff, system prompt diff, KB ingestion path, safety_response enum diff.
5. **iframe 변경**: postMessage event schema diff, origin allowlist diff, sandbox/CSP 변경.
6. **PIPA 변경**: 동의 항목·문구·보관 기간 diff, Slack payload diff.
7. **Computer-Use 결과**: 영향 시나리오 ID, viewport, step별 pass/fail JSON, screenshot diff.
8. **Cost ledger**: 본 PR Computer-Use 토큰·예상 비용 추정.
9. **Secret scan**: `.env`/key 패턴 grep 결과 0건 증빙.
10. **CHANGELOG 1줄**: 시작·종료 의도(코드 변경 PR에 한함).

위 10종 중 누락이 있으면 Claude는 review를 *진행하지 않고* "evidence gap" 의견만 단다. 이는 토큰 낭비 방지와 책임 경계 보호용.

## 7. Codex(구현 오너)에게 요청하는 질문·Challenge

1. PRD v1.0 원문 부재 상태에서 Week 1 scaffold PR을 진행할지, 아니면 v1.0 합본 또는 v1.2 통합본을 blocker로 둘지 — 결정과 그 근거.
2. 시나리오 카탈로그(5종 × step 상세) 합의문을 누가 언제까지 어떤 포맷으로 내놓을지. 합의문 없이 ortho_revisit_v1을 hard-code하면 Week 3에 재작업 risk가 있는데, 그 trade-off를 받을지.
3. AI tool 7종의 이름·schema·실패 동작 초안을 Week 2 시작 전에 별도 PR(코드 없는 docs PR)로 먼저 합의할지, Week 2 첫 PR에 묶을지.
4. `safety_response` 5종 reason enum과 한국어 카피 owner는 누구인가(이다슬 팀장? 대표?). review에서 카피 일관성을 어떤 기준으로 판정할지.
5. Approved Knowledge 경계를 retrieval gate + system prompt + tool 분기 3겹으로 강제하는 데 동의하는가. 그렇지 않다면 어떤 대체 모델을 제안하는가.
6. Avatar choreographer를 명시적 FSM으로 모델링할지, reducer + transition lock으로 갈지. race 케이스(중복 클릭/unmount/resize/reduced-motion 토글/stale async)를 어떤 단위 테스트로 회귀 보호할지.
7. iframe postMessage event schema 초안(version, type, nonce, payload, timestamp)을 Week 1 scaffold PR에 포함할지, 별도 PR로 분리할지.
8. PIPA 동의 3종 분리·보관 기간·삭제 요청 경로의 final 카피·정책 owner와 deadline.
9. Golden screenshot 1% pixel-diff 임계가 너무 빡빡하다고 보는가. mask region 정책(폰트 anti-aliasing, 스크롤바, 시스템 시계, 광고 영역)을 어떻게 합의할지.
10. Cost cap(Computer-Use 월 $1,000, 단일 PR $10, Claude review 주 $100)의 계측 지점·차단 주체·alert 채널을 어디에 구현할지. 미구현 상태로 PoC를 시작할지 여부.
11. Staging/prod env separation을 CI에서 어떤 체크(예: prod URL 패턴이 staging workflow에 등장 시 fail)로 강제할지.
12. CHANGELOG 갱신을 코드 변경 PR에만 적용하는 것에 동의하는가. 그 경우 AGENTS.md §1 문구를 명시화하는 별도 docs PR이 필요한가.
13. Claude의 review-only 경계가 "iframe origin contract 초안 작성"에까지 미치는가, 아니면 그것은 Codex가 작성하고 Claude가 review만 해야 하는가 — 본 메모는 후자를 가정한다. 합의 확인 요청.

---

본 메모는 합의문(`docs/alignment/FINAL_ALIGNMENT.md`)이 작성될 때 Codex Round 1과 cross-check되어, 위 13개 질문 중 합의된 항목은 합의문으로 흡수되고, 미합의 항목은 Round 2에서 재논의된다. Claude는 Round 2까지 review-only 경계를 유지한다.

문서 끝.

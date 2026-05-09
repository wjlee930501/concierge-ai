# FINAL ALIGNMENT — 개발 착수 전 통합 합의문

작성일: 2026-05-07
기준 문서: `docs/prd/Concierge_AI_PRD_v1.2.md` (canonical), `docs/interaction/CURATION_CHOREOGRAPHY_SPEC.md`. v1.1 PRD와 alignment round 1~2 문서는 v1.2로 흡수되어 삭제됐다.
목적: Concierge AI PoC 개발 전 Claude Code, Codex CLI/OMX, Computer-Use, Woojin의 책임 경계와 merge 기준을 운영 가능한 수준으로 고정한다.

> 운영 override (2026-05-08~): 본 합의문은 PRD baseline 기준으로 작성되었지만, 현재 운영 체계는 Claude Code가 1차 구현자, Codex CLI/OMX가 review-only 교차 검증자다. 본문 내 "Codex가 작성한다 / Claude가 review한다" 표기는 모두 이 override로 읽는다. PRD baseline 자체는 별도 PRD update 없이 보존한다.

---

## 1. 역할 모델

- Claude Code: 1차 구현자. 앱 코드, 디버깅, 테스트 작성, PR 본문 작성, Codex/OMX review 반영을 담당한다.
- Codex CLI / OMX: review-only 교차 검증자. 보안, PIPA, iframe/postMessage, Approved Knowledge, AI schema, choreographer race condition을 검토한다. 앱 코드, schema, scenario JSON, KB 본문, CI workflow를 대신 작성하지 않는다.
- Computer-Use: staging/preview 브라우저 검증자. 실제 브라우저에서 시나리오를 클릭, 입력, 스크린샷으로 검증한다. 코드 수정과 production 접근은 금지한다.
- Woojin: 최종 승인자. CI, review, Computer-Use가 모두 통과해도 Woojin 승인 전 merge하지 않는다.

원칙: Claude Code가 만들고, Codex CLI/OMX가 검토하고, Computer-Use가 staging에서 검증하고, Woojin이 승인한다.

---

## 2. 3단계 게이트

### 2.1 Startable

source data가 아직 부족해도 시작 가능한 구조 작업이다. 예: repo 경계, strict TypeScript 기반, shared type, postMessage envelope, origin allowlist 형식, iframe skeleton, widget shell, test-only fixture, reduced-motion 분기, choreographer contract test.

Startable PR은 사용자 노출 final copy, 실제 시나리오 content, AI 호출, Slack 송신, Supabase write, Admin CRUD를 포함하지 않는다.

### 2.2 Reviewable

Codex CLI/OMX review-only가 PRD 위반 여부를 판단할 수 있을 만큼 source data와 증빙이 붙은 상태다. 시나리오, AI tool, safety_response, PIPA, KB, Admin, KPI는 각 주차별 source of truth가 있어야 Reviewable이다.

### 2.3 Mergeable

다음 4개를 모두 만족한 상태다.

1. CI green.
2. Codex CLI/OMX review-only Critical 0건.
3. 영향받은 Computer-Use 시나리오 100% pass.
4. Woojin 최종 승인.

자동 merge는 금지한다.

---

## 3. Minimal Week 1 Start Contract

Week 1에서 source data 없이 시작 가능한 범위:

- 별도 branch 기준 작업, CHANGELOG 기록, PR template, 기본 CI gate 설계.
- `apps/widget`, `apps/embed`, `apps/admin`, `packages/shared`, `packages/kb`, `tests` 경계 수립.
- scenario, postMessage envelope, origin allowlist, choreographer state 타입 설계.
- iframe 주입 skeleton, sandbox 속성, ready/handshake event.
- Hero Bubble container, Quick Chip 영역, Avatar/Spotlight/Popover 상태 슬롯, reduced-motion 분기.
- production scenario와 물리적으로 분리된 test-only fixture.
- parser/state/choreographer unit test와 secret scan.
- `ortho_revisit_v1` source data가 제공된 뒤에만 desktop smoke e2e 작성.

Week 1에서 source data 전에는 금지되는 범위:

- `ortho_revisit_v1` 실제 5-step content 확정.
- Quick Chip 4개 final 한국어 문구 확정.
- 나머지 4개 시나리오 및 5번째 미정 시나리오 확정.
- AI tool 7종, safety_response 5종, Approved Knowledge 답변 생성.
- Lead Form, PIPA 동의 저장, Slack 실전송, Supabase write.
- production origin, production webhook, production secret 사용.

명시적 금지: 1차 구현자(Claude Code)는 source data 없이 사용자 노출 final copy, 시나리오 step, anchor selector, popover 문구, choice 문구, lead form 전환 조건을 임의 창작하지 않는다. 필요한 임시 데이터는 test-only fixture로만 두고 production scenario와 분리한다.

---

## 4. 주차별 blocker vs non-blocking 가정

| Week | Blocker | Non-blocking 가정 |
|---|---|---|
| Week 1 | postMessage envelope 6필드, origin allowlist 형식/env 분기, iframe sandbox 기본 정책, reduced-motion 분기, choreographer race test 5종, secret hygiene. `ortho_revisit_v1` hard-code merge 전에는 5-step source data와 Quick Chip final copy 필요. | v1.0 원문 물리적 부재는 FINAL_ALIGNMENT로 보강. 시나리오는 섹션 번호가 아니라 scenario ID로 참조. production origin 실값은 후속 확정. cost 자동 차단은 아직 수동 ledger로 시작. |
| Week 2 | AI tool 7종 schema/실패 동작/prompt cache, safety_response 5종 enum/한국어 카피/owner, Approved Knowledge 3겹 차단, KB ingestion sanitization. | provider 세부 구현은 contract가 고정되면 후속 교체 가능. Admin UI는 blocker 아님. |
| Week 3 | PIPA 동의 3종 final copy, 보관 기간, 삭제/열람 경로, Slack staging/mock 분리, Supabase schema/RLS/retention/audit log. | Week 4 Admin 세부 RBAC는 Lead Form merge blocker가 아니나 Admin 착수 전 필요. |
| Week 4 | Admin RBAC, CSRF, idle timeout, API auth, SQL injection 방어, audit log, runtime staging/prod 접근 차단. | Golden screenshot 1% 기준과 위험 답변 30건 suite는 Week 5 blocker. |
| Week 5 | Golden screenshot mask/threshold, 위험 답변 30건 expected reason, mobile bottom sheet/safe-area, A/B 이벤트 PII 제거, production-readiness checklist. | 최종 KPI/sunset 수치는 Week 6 전 확정 가능하나 측정 인프라는 유지해야 한다. |
| Week 6 | nightly 회귀 7일 green, KPI raw data, sunset 판단 정량 임계, 인수인계 산출물 정합성. | 없음. 미해결이면 PoC 종료/merge 판단을 보류한다. |

---

## 5. PR 증빙 요구사항

모든 PR 본문에는 최소한 다음이 있어야 한다.

- scope 선언: scaffolding-only / AI / KB / PIPA / Admin / polish 중 해당 범위.
- PRD 매핑: PRD 섹션 또는 scenario ID, FINAL_ALIGNMENT checklist 항목.
- 변경 요약: 추가/수정/삭제 파일과 사용자 노출 한국어 텍스트 diff.
- 테스트 증빙: unit/integration/e2e/Computer-Use 중 해당 결과.
- Computer-Use 필요 여부: yes/no와 이유. 필요 시 영향 scenario ID, viewport, step별 pass/fail, screenshot diff.
- secret scan 결과: real-looking secret 패턴 0건.
- cost ledger: `pr_number`, `computer_use_minutes`, `claude_review_tokens_estimate`, `llm_calls_estimate`, `running_total_week`.
- CHANGELOG: 코드 변경 PR은 시작/종료 1줄 필수. alignment 문서 변경도 권장한다. 1차 구현자(Claude Code)가 시작/종료 항목을 기록한다.

변경 범위별 추가 증빙:

- AI/KB 변경: tool zod schema diff, system prompt diff, KB ingestion path, safety_response enum diff.
- iframe 변경: postMessage schema diff, origin allowlist diff, sandbox/CSP 변경.
- PIPA 변경: 동의 항목/문구/보관 기간 diff, Slack/DB payload diff.
- Admin 변경: auth/RBAC/CSRF/API 권한/integration test 증빙.

증빙 누락 PR은 Codex CLI/OMX review-only가 기능 review 전에 evidence gap으로 돌려보낸다.

---

## 6. 최종 35개 체크리스트

### A. 기준·Scope

1. Source of truth: PRD v1.1이 최상위 기준이고, v1.0 부재 항목은 FINAL_ALIGNMENT가 보강한다.
2. Scope discipline: PRD에 없는 기능은 구현 PR에 섞지 않는다. 모호하면 alignment/docs PR로 분리한다.
3. 3단계 게이트: Startable / Reviewable / Mergeable을 PR verdict에 명시한다.

### B. 역할·경계

4. Role: Claude Code만 앱 코드를 작성한다. Codex CLI/OMX는 review-only이며 코드, schema, scenario JSON, KB 본문, CI workflow를 대신 작성하지 않는다.
5. Contract 초안 작성자: origin allowlist, envelope schema, choreographer 모델, KB 차단 규칙, sanitization 정책 초안은 Claude Code가 작성하고 Codex CLI/OMX가 review한다.
6. 자기 승인 금지: review Critical 0건은 merge 승인이 아니다. Woojin 승인 전 merge하지 않는다.

### C. Branch·CHANGELOG·PR

7. Branch/PR: 모든 변경은 별도 branch + PR 기준이다. 환경 권한으로 막히면 PR 본문에 명시한다.
8. CHANGELOG: 코드 변경 PR 시작/종료 1줄 필수. alignment 문서 변경도 권장하며, 현재 AGENTS 기준에서는 Claude Code(1차 구현자)가 기록한다.
9. PR 본문 필수 섹션: scope 선언, PRD 매핑, Computer-Use 필요 여부, secret scan, cost ledger.

### D. 보안

10. postMessage: envelope는 version, type, nonce, timestamp, source, payload 6필드를 가진다. `targetOrigin` wildcard는 금지한다.
11. iframe sandbox: `allow-same-origin` 기본 OFF, `allow-top-navigation*` 금지, CSP `frame-ancestors` directive 상시 존재.
12. Secret hygiene: production secret, webhook URL, service key 실값은 코드, 문서, PR 본문 어디에도 쓰지 않는다. `.env.example`은 placeholder만 둔다. git history secret scan은 Week 1 수동 검증으로 시작하고, Week 2 AI/KB 구현 전 CI 마일스톤으로 추적한다.
13. Staging/prod 분리: prod URL/webhook 패턴이 staging workflow나 preview config에 등장하면 CI fail. Week 4 전 runtime cross-env 차단을 도입한다.
14. Computer-Use 격리: staging/preview만 접근한다. production 접근, 실제 사용자 데이터 제출, 코드 수정은 금지한다.

### E. PIPA·데이터

15. 동의 분리: 필수/마케팅/펼침 상세 동의는 별도 체크박스다. 마케팅 미동의 제출은 가능해야 한다.
16. Retention: 보관 기간은 cron/DB TTL 등 코드로 enforce하고, 삭제/열람 요청 경로를 문서화한다.
17. PII 최소화: Slack/DB 저장 항목은 whitelist 방식으로 제한한다. 동의 timestamp, version, 최소 식별 정보만 저장한다.
18. Hero Bubble payload + embed.js parent 권한 표면: scaffold 단계에서도 ready/handshake payload의 식별자 포함 여부를 명시한다. `embed.js`는 parent DOM scrape, cookie access, localStorage access, sessionStorage access를 기본 금지로 문서화하고, 예외가 필요하면 별도 PRD/alignment 승인 후 구현한다.

### F. AI 안전

19. Approved Knowledge 3겹 차단: retrieval gate, system prompt, tool 분기 중 하나라도 누락되면 Critical이다.
20. Tool schema 단일 출처: zod schema, PRD 합의문, Computer-Use expectation이 1:1로 맞아야 한다.
21. Prompt injection 방어: KB markdown, admin 입력, 사용자 자유 입력, tool 결과 재주입을 모두 sanitize한다. 최소 패턴 enum은 `role_hijack`, `unicode_direction_zwj_rtl`, `base64_encoded_payload`, `image_alt_text_injection`, `tool_call_mimicry`, `tool_result_reinjection`이다.
22. safety_response: 5종 enum, 한국어 카피, owner를 합의문에 고정한다. enum 외 reason은 Critical이다.
23. Logging: 답변 근거 KB doc id를 로깅하고 PII echo 가능성을 검증한다.

### G. UX·Motion

24. Korean copy: 사용자 노출 텍스트는 모두 한국어다. source data 없는 final copy와 scenario content는 1차 구현자(Claude Code)가 임의 확정하지 않는다.
25. Reduced motion: `prefers-reduced-motion: reduce`에서는 모든 transition을 즉시 jump 처리하고 unit/e2e/Computer-Use로 검증한다.
26. Choreographer race: 중복 클릭, unmount, resize, reduced-motion 토글, stale async 응답 5개 케이스의 단위 테스트를 둔다.

### H. 테스트·증빙

27. 테스트 분류: 새 shared logic은 unit, 새 API route는 integration, 사용자 flow는 e2e 또는 Computer-Use로 검증한다.
28. 증빙 변경범위 매핑: Round 1의 10종 증빙은 해당 변경이 있을 때만 필수다. scaffold PR에 AI/PIPA 증빙을 강제하지 않는다.
29. Golden screenshot: 1% threshold는 Week 5 polish gate다. mask region 정책 합의 후 강제한다.

### I. 비용·운영

30. Cost ledger schema: `pr_number`, `computer_use_minutes`, `claude_review_tokens_estimate`, `llm_calls_estimate`, `running_total_week`를 Week 1부터 PR 본문에 기록한다.
31. KPI 정량 기준: lead conversion, unsafe rate, latency, cost ceiling, sunset 임계는 Week 6 blocker다. 측정 인프라는 Week 1부터 준비한다.

### J. Review·Merge

32. Critical 정의: PRD 위반, 보안/PIPA/AI boundary 위반, acceptance gate 실패, 실제 사용자 flow break에 한정한다.
33. Comment cap: Important 5개 이하, Nit 5개 이하. blocking 없으면 "No blocking issues."로 시작한다.
34. Verdict 형식: scaffolding 단계는 non-coverage 목록을 명시해 후속 주차 책임 경계를 분리한다.
35. Merge gate: CI green, Codex CLI/OMX review-only Critical 0건, 영향 Computer-Use 100% pass, Woojin 승인 전에는 merge하지 않는다.

---

## 7. unresolved items

아래 표는 합의문 원본의 blocker 목록이며, 최종 날짜나 승인 여부는 source data 없이 확정하지 않는다. v1.2 §25에서 정식 확정된 결정 (Re:putation/NMOS guard 폐기 / 5 visitor view 유지 / 시나리오 Re:Visit·New:Visit 2종) 은 PRD v1.2 본문에 반영됐다.

| 항목 | 상태 | Owner | Deadline |
|---|---|---|---|
| PRD v1.0 원문 통합 또는 v1.2 흡수본 작성 여부 | 미정 | [Woojin/TBD] | [YYYY-MM-DD] |
| `ortho_revisit_v1` 5-step source data와 Quick Chip final copy | Week 1 Reviewable blocker | [Woojin/TBD] | [YYYY-MM-DD] |
| 나머지 4개 시나리오와 5번째 미정 시나리오 catalog | Week 3 Reviewable blocker | [Woojin/TBD] | [YYYY-MM-DD] |
| AI tool 7종 schema/실패 동작/prompt cache 정책 | Week 2 Reviewable blocker | [Claude Code draft / Woojin approve / Codex CLI·OMX review] | [YYYY-MM-DD] |
| safety_response 5종 enum/한국어 카피/owner | Week 2 Reviewable blocker | [Woojin/TBD] | [YYYY-MM-DD] |
| Approved Knowledge 원본, 승인 workflow, KB 외 답변 차단 기준 | Week 2 Reviewable blocker | [Woojin/TBD] | [YYYY-MM-DD] |
| PIPA 동의 3종 final copy, 보관 기간, 삭제/열람 경로 | Week 3 Reviewable blocker | [Woojin/TBD] | [YYYY-MM-DD] |
| Supabase schema, RLS, retention job, audit log | Week 3 Reviewable blocker | [Claude Code draft / Woojin approve / Codex CLI·OMX review] | [YYYY-MM-DD] |
| Admin RBAC role, CSRF, idle timeout 값 | Week 4 Reviewable blocker | [Woojin/TBD] | [YYYY-MM-DD] |
| Hero Bubble handshake payload의 식별자 포함 여부 | Week 1 scaffold review 확인 | [Codex draft / Claude review] | [YYYY-MM-DD] |
| Golden screenshot mask/threshold 정책 | Week 5 Reviewable blocker | [Codex draft / Claude review / Woojin approve] | [YYYY-MM-DD] |
| 위험 답변 30건 suite와 expected reason 매핑 | Week 5 Reviewable blocker | [Woojin/TBD] | [YYYY-MM-DD] |
| Cost cap 자동 차단 위치(workflow/dashboard/alert) | Computer-Use workflow 도입 전 결정 | [Codex draft / Woojin approve] | [YYYY-MM-DD] |
| CHANGELOG 운영 문구를 AGENTS.md에 명문화할지 여부 | 별도 docs PR | [Woojin/TBD] | [YYYY-MM-DD] |
| lead conversion, unsafe rate, latency, cost ceiling, sunset 정량 임계 | Week 6 Mergeable blocker | [Woojin/TBD] | [YYYY-MM-DD] |

---

## 8. 운영 결론

Week 1은 scaffolding-only로 시작 가능하다. 단 source data 없는 사용자 노출 final copy와 scenario content는 만들지 않는다. Week 2 이후 AI, KB, PIPA, Admin, KPI는 각 주차의 blocker가 해결된 뒤에만 Reviewable/Mergeable로 본다.

이 합의문은 개발 시작 전 기준이며, PRD 변경이나 unresolved item 확정이 생기면 별도 docs PR로 갱신한다.

문서 끝.

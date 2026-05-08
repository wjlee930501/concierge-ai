# CODEX ROUND 1 — 구현 오너 메모

작성일: 2026-05-07
작성자: Codex
범위: 개발 착수 전 정렬. 앱 코드, 패키지 설치, 신규 의존성 추가 없음.

## 1. 제품, MVP, 성공 기준 이해

Concierge AI는 MotionLabs 웹사이트 방문자를 대상으로 동작하는 임베디드 상담 위젯이다. 핵심 경험은 `embed.js`가 iframe 기반 widget을 주입하고, Hero Bubble, Quick Chip, Avatar 이동, Spotlight, Popover, Lead Form을 통해 방문자를 정해진 시나리오로 안내하는 것이다. 자유 입력은 AI 응답 경로로 처리하되, Approved Knowledge와 정의된 tool schema 밖으로 답변하지 않아야 한다.

MVP는 6주 PoC 기준으로 이해한다.

- Week 1: 기반 setup, 정형외과 시나리오 hard-coded, `embed.js` inject와 Hero Bubble 검증.
- Week 2: AI tool 7종, system prompt, KB, `safety_response` 5종.
- Week 3: 시나리오 4종 추가, Lead Form, Slack 연동, PIPA 동의 코드.
- Week 4: Admin UI 5페이지와 CRUD/API 권한.
- Week 5: polish, mobile, A/B, 위험 답변 30건 포함 전체 검증.
- Week 6: bug fix, KPI 측정, 인수인계, nightly 회귀.

PRD v1.1에서 명시된 acceptance gate는 다음 4개다.

- CI green: lint, typecheck, unit/integration/e2e 중 해당 범위 통과.
- Claude Code Review Critical 0건.
- 영향받은 Codex Computer-Use 시나리오 100% pass.
- Woojin 최종 승인 후 merge.

제품 KPI는 `Supabase + Vercel Analytics` raw data와 `Sunset 판단 근거`가 산출물로 명시되어 있으나, 정량 성공 기준은 현재 repo 문서 안에 없다. Week 1 coding 전 lead conversion, engagement, unsafe answer rate, latency, cost ceiling 같은 MVP 성공/중단 기준을 수치로 확정해야 한다.

## 2. 역할 분리

- Codex: 1차 구현자. 코드 작성, 디버깅, 리팩토링, 테스트 작성, PR 생성, Claude review 반영을 담당한다.
- Claude Code: review-only 교차 검증자. 보안, PIPA, iframe/postMessage, Approved Knowledge, AI schema, choreographer race condition을 검토한다. 구현을 대신 확장하지 않는다.
- Codex Computer-Use: staging browser 검증자. 실제 브라우저에서 시나리오를 클릭/입력/스크린샷으로 검증한다. 코드 수정 권한은 없고 production 접근은 금지다.
- Woojin: 최종 의사결정자. PR merge 승인권자이며, 두 AI와 CI가 통과해도 자동 merge하지 않는다.

운영 원칙은 단일 책임이다. Codex가 만들고, Claude가 보고, Computer-Use가 브라우저에서 검증하며, Woojin이 결정한다.

## 3. Week 1 coding 전 해결할 가정과 모호성

- PRD v1.0 원문 부재: v1.1은 v1.0의 22개 섹션을 유지한다고 말하지만 repo에는 `Concierge_AI_PRD_v1.1.md`만 있다. 제품 기능, 사용자 여정, KPI, 데이터 정책의 원문 기준이 필요하다.
- 섹션 참조 불일치: v1.1 예시는 "PRD 1.1 5번 섹션의 5개 시나리오"를 언급하지만 현재 5번 섹션은 통합 워크플로다. 구현 기준이 되는 시나리오 섹션 번호를 재확인해야 한다.
- 시나리오 원본 미정: `ortho_revisit_v1`, `im_checkup_v1`, `opening_doctor_v1`, `manager_kakao_v1` 외 5번째 시나리오, 각 step, anchor, popover, choices, lead form 전환 조건이 필요하다.
- AI tool 7종 미정: tool 이름, 입력/출력 schema, 실패 시 동작, prompt cache 옵션, LLM provider/API contract가 정의되어야 한다.
- `safety_response` 5개 reason 미정: reason enum, 사용자 노출 한국어 문구, 로깅 정책, 재질문 허용 범위가 필요하다.
- Approved Knowledge 경계 미정: KB 원본 위치, 승인 워크플로, admin 수정 권한, 미승인 콘텐츠 차단 방식, 답변 근거 표시 여부가 필요하다.
- PIPA 정책 미정: 필수 동의, 마케팅 동의, 펼침 상세 문구, 보관 기간, 삭제 요청, Slack 전송 항목, staging dummy data 정책이 확정되어야 한다.
- iframe 보안 경계 미정: parent origin allowlist, staging/production origin, `postMessage` event contract, iframe sandbox/CSP, clickjacking 정책이 필요하다.
- 데이터 저장소 미정: Supabase project 분리, DB schema, RLS/API auth, retention job, audit log 범위가 필요하다.
- staging/prod 분리 미정: `staging.concierge.motionlabs.kr`, preview URL, allowed websites, env variable naming, real Slack webhook과 mock webhook 경계가 확정되어야 한다.
- 비용 cap 집행 방식 미정: Computer-Use 월 $1,000, 단일 PR $10, Claude review 주 $100 cap을 어디서 계측하고 fail/notify할지 정해야 한다.
- CHANGELOG 예외 처리: AGENTS는 작업 시작/종료 기록을 요구하지만 이번 요청은 메모 외 파일 수정을 금지한다. 문서-only alignment 라운드에도 CHANGELOG를 갱신할지 Woojin 확인이 필요하다.

## 4. 제안 repo architecture와 Week 1 기술 순서

PRD 구조를 기본으로 하되, 구현 전 monorepo 경계를 명확히 한다.

```text
apps/
  widget/        # iframe 안에서 실행되는 React 위젯
  admin/         # Admin UI 5페이지, Week 4부터 본격 구현
  embed/         # 사이트에 삽입되는 embed.js
packages/
  shared/        # 공통 TypeScript 타입, scenario/event contracts, origin helpers
  kb/            # Approved Knowledge markdown, scenario JSON
tests/
  unit/          # pure logic
  integration/   # API, DB, webhook, iframe handshake
  e2e/           # Playwright deterministic browser flows
docs/
  prd/
  alignment/
.github/workflows/
  ci.yml
  claude-review.yml
  computer-use-verify.yml
```

Week 1 순서는 다음을 제안한다.

1. PRD v1.0 원문, 시나리오 1개, staging/env 정책을 확정한다.
2. 별도 branch 생성 후 CHANGELOG 시작 기록, PRD 섹션 기준을 PR template에 반영한다.
3. TypeScript strict 기반 workspace와 CI 뼈대를 만든다.
4. `packages/shared`에 scenario step, anchor, message, lead form, postMessage event 타입을 정의한다.
5. `packages/kb/scenarios/ortho_revisit_v1.json`을 PRD 기준으로 추가한다.
6. `apps/widget`에 Hero Bubble, Quick Chip 4개, Avatar/Spotlight/Popover, reduced-motion fallback을 구현한다.
7. `apps/embed`에 iframe inject, origin config, 최소 postMessage handshake를 구현한다.
8. unit test는 scenario parser/state machine 중심, e2e는 desktop Hero Bubble과 첫 chip flow 중심으로 붙인다.
9. staging preview에서 Computer-Use는 `embed.js` inject와 Hero Bubble 등장만 검증한다.
10. PR 생성 후 Claude review는 보안 경계와 PRD 위반 여부 중심으로 받는다.

Week 1에서는 LLM 자유 입력, Slack 실전송, Admin CRUD, full golden screenshot suite는 구현하지 않는 것이 맞다. PRD 일정상 Week 2-4 범위이기 때문이다.

## 5. 테스트 전략과 경계

- Unit: scenario parser, state machine, next-step resolver, anchor selection, reduced-motion branch, origin allowlist helper, safety reason mapper 같은 pure logic을 검증한다.
- Integration: API route, Supabase read/write, Slack webhook mock, LLM tool schema validation, prompt cache option, iframe parent-widget handshake, PIPA consent persistence를 검증한다.
- E2E: Playwright로 local/preview에서 deterministic flow를 검증한다. desktop/mobile, chip click, popover text, lead form 표시, reload behavior, reduced-motion을 포함한다.
- Computer-Use: staging browser 전용이다. 실제 iframe 삽입, Hero Bubble 3-6초 등장, Avatar 좌표, Spotlight selector, popover 한 글자 비교, mobile bottom sheet, golden screenshot diff를 검증한다. 코드 수정과 production 접근은 금지한다.
- Claude Code Review: 테스트 실행 대체물이 아니다. CI가 못 잡는 PIPA, iframe boundary, prompt injection, Approved Knowledge, race condition, schema drift를 review-only로 잡는다.

경계 원칙은 deterministic test가 빠르게 실패 원인을 좁히고, Computer-Use가 실제 브라우저에서 사용자 경험과 visual contract를 최종 확인하는 구조다.

## 6. 주요 리스크

- PIPA: 동의 3종, 보관 기간, 마케팅 동의 분리, Slack 전송 최소화, 삭제 요청 경로가 불명확하면 PoC라도 법적 리스크가 생긴다.
- iframe/postMessage: origin 검증, sandbox, CSP, event schema, replay 방어가 없으면 parent page와 widget 간 신뢰 경계가 무너진다.
- Approved Knowledge: KB 외 답변 경로가 열리면 의료/상담 맥락에서 hallucination과 과장 답변이 발생한다.
- prompt injection: 사용자 자유 입력, KB markdown, admin 입력이 tool 호출과 system prompt를 오염시킬 수 있다.
- choreographer races: animation 중복 클릭, step 전환 중 unmount, viewport resize, reduced-motion 전환, async AI 응답이 Avatar/Spotlight 상태 불일치를 만들 수 있다.
- staging/prod separation: Computer-Use와 dummy lead가 production에 닿으면 개인정보와 운영 Slack spam 사고로 이어진다.
- cost caps: Computer-Use nightly, PR 검증, Claude managed review, LLM 응답이 모두 누적 비용을 만든다. cap 계측과 자동 중지 로직이 필요하다.
- schema drift: scenario JSON, AI zod schema, admin form schema, Computer-Use golden expectation이 따로 진화하면 PRD 시나리오가 깨진다.
- 한국어 UX 품질: 모든 사용자 노출 텍스트가 한국어여야 하며, copy source와 review owner가 필요하다.

## 7. Claude Code에 요청할 review-only 질문

- PRD v1.0 원문 부재 상태에서 Week 1 scaffold PR을 진행해도 되는가, 아니면 제품 기준 문서 보강을 blocking으로 봐야 하는가?
- iframe/postMessage event contract 초안에서 필수 보안 필드는 무엇이어야 하는가?
- PIPA 동의 3종의 코드-level acceptance criteria를 어떻게 정의할 것인가?
- Approved Knowledge 위반을 테스트 가능한 조건으로 만들려면 어떤 schema와 logging이 필요한가?
- `safety_response` 5개 reason enum은 review에서 어떤 기준으로 PRD 일치 여부를 판단할 것인가?
- prompt injection 방어는 system prompt, tool schema, KB ingestion, admin 입력 검증 중 어디까지 Week 2 blocking으로 볼 것인가?
- Avatar choreographer는 finite state machine으로 강제해야 하는가, 아니면 reducer + transition lock으로 충분한가?
- Computer-Use golden screenshot diff 1% 기준은 UI 변경 PR에서 너무 취약하지 않은가?
- staging/prod env separation을 CI에서 어떤 체크로 강제해야 하는가?
- 비용 cap 초과 시 fail-fast가 PR check failure인지, Slack 알림 후 manual gate인지 정해야 하는가?

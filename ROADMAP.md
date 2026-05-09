# Concierge AI Productization Roadmap

작성: 2026-05-09
상태 기준: PRD v1.1 + FINAL_ALIGNMENT (2026-05-08 override) + 본 세션 진단

## 1. 시스템 정체성 한 문장

방문자가 길을 잃기 전에 다음 행동을 먼저 제안하는, 호스트 페이지 위에 iframe으로 주입되는 의도-기반 가이드 레이어.

호스트는 MotionLabs 공식 홈페이지를 1차 preview target으로 한다. UX는 PRD §2.2 / FINAL_ALIGNMENT §1로 고정된다.

```
Hero Bubble → Quick Chips → Avatar choreography → Spotlight + Popover → Lead Form
```

데스크탑/모바일(bottom-sheet) 동일 플로우. `prefers-reduced-motion: reduce`는 즉시 jump.

## 2. 진단 — 무엇을 갖췄고, 무엇이 비어 있는가

### 2.1 갖춘 것 (W1 scaffolding-only)

- npm workspace + strict TS 골격 (`apps/{widget,embed,admin}`, `packages/{shared,kb}`)
- postMessage envelope 6필드 + ready/handshake/resize known type 검증
- Origin allowlist + scheme guard + env contract
- Choreographer state ADT (race/reduced-motion 단위 테스트 포함)
- Widget shell view-model deep-freeze + render guard
- Embed sandbox/CSP `frame-ancestors` scaffold
- M0/M1 secret scanner (source/diff/history mode)
- PR evidence + cost ledger schema validator + CI gate
- 192 unit/contract test, 0 vulnerability

### 2.2 비어 있는 것 (실제 제품 표면)

- React/Vite/Tailwind/Framer/zod **의존성 미설치**
- Widget UI 실제 렌더 코드 0줄 (view-model만 존재)
- 시나리오 JSON 스키마/엔진 없음 (placeholder도 fixture 없음)
- AI tool 7종 zod schema 없음
- safety_response 5종 enum/카피 없음
- KB ingestion / Approved Knowledge 3겹 차단 미구현
- Lead Form / PIPA 동의 3종 컴포넌트 없음
- `embed.js` 실제 iframe 주입 코드 없음 (타입만)
- Admin 5페이지 0개 (placeholder index.ts만)
- Playwright e2e / golden screenshot 디렉토리 없음
- Anthropic / Slack / Supabase 어댑터 없음

### 2.3 메타-도구 과적합 리스크

CHANGELOG는 W1에 PR evidence validator/문서 drift assertion에 약 60% 시간을 소진한 흔적이 있다. 이는 곧 "사용자 노출 표면 없음 + 거버넌스 도구만 두꺼움" 상태다. 본 로드맵은 사용자 노출 표면을 빠르게 바닥부터 쌓아 거버넌스 두께와 균형을 맞추는 데 집중한다.

## 3. 원칙 (전 페이즈 공통)

1. **FINAL_ALIGNMENT §3 준수**: source data 없는 final 한국어 copy / production 시나리오 콘텐츠 생성 금지. 모든 임시 텍스트는 `tests/fixtures/**` 또는 명시적 placeholder 파일에만 둔다.
2. **금지 어휘 차단**: clinic/병원/환자/진료/의료/예약/appointment/patient/hospital/medical/HandDoc/Re:putation/NMOS는 코드/스키마/설명에서 모두 차단. 시나리오 엔진의 ingest 단에서 lint한다.
3. **PRD §2.2 경계 유지**: postMessage envelope 6필드, sandbox `allow-same-origin` 기본 OFF, CSP `frame-ancestors` 상시, embed.js는 parent DOM/cookie/storage scrape 금지.
4. **3단계 게이트**: Startable / Reviewable / Mergeable 명시. Mergeable = CI green + Codex review-only Critical 0 + 영향 Computer-Use 100% pass + Woojin 승인.
5. **사용자 노출 텍스트는 한국어**. TypeScript strict, React function components, Tailwind utility, Framer Motion.
6. **테스트 우선**: 새 shared logic = unit, 새 API = integration, 사용자 flow = e2e/Computer-Use.
7. **secret hygiene**: production secret/webhook/service key는 코드/문서/PR 본문 전부 금지. `.env.example`은 placeholder만.

## 4. 페이즈별 실행 계획

각 페이즈는 "Definition of Done"으로 닫는다.

### Phase 0 — 진단/문서 (이 세션 끝)

- 본 ROADMAP.md 추가.
- CHANGELOG에 phase 0 시작/종료 1줄 기록.

DoD: 본 문서 머지 가능 상태.

### Phase 1 — 빌드 파이프라인 + Widget UI 표면 (이 세션)

목표: 브라우저에서 실제로 보이는 PRD UX 플로우를 **placeholder 시나리오**로 동작시키기.

작업:
- `apps/widget`을 Vite + React + Tailwind + Framer로 부트스트랩.
- 시나리오 JSON zod 스키마(`packages/shared/src/scenario.ts`) + ScenarioRunner 상태머신.
- React 컴포넌트: `HeroBubble`, `QuickChips`, `Avatar`, `Spotlight`, `Popover`, `LeadFormCard`(placeholder 카피 명시).
- `tests/fixtures/scenarios/placeholder_v0.json` (test-only fixture, production 경로와 분리).
- `prefers-reduced-motion` jump 분기 구현.
- 단위 테스트(상태머신, reduced-motion).

DoD:
- `npm run dev:widget`으로 localhost에서 placeholder 시나리오가 끝까지 동작.
- 기존 192 test 그대로 통과 + 신규 unit 추가.
- 한국어 사용자 노출 텍스트는 placeholder 라벨이 붙은 fixture에서만 로드.

### Phase 2 — AI 런타임 contract + Mock provider

목표: AI 호출 표면을 zod schema로 고정하고 mock으로 정합 테스트. 실제 LLM 호출은 Phase 3에서 wire.

작업:
- `packages/shared/src/ai/tools.ts` — 7종 zod schema (`navigate_to_section`, `show_kb_doc`, `ask_lead_info`, `submit_lead`, `escalate_to_human`, `safety_response`, `noop`). 정확한 동작은 PRD source data 확정 시 다듬는다.
- `packages/shared/src/ai/safety.ts` — 5종 enum (`out_of_scope`, `kb_unavailable`, `pii_request`, `prompt_injection_detected`, `policy_violation`) + 카피는 placeholder 라벨링.
- `packages/shared/src/ai/provider.ts` — Provider interface + MockProvider + prompt cache flag.
- Approved Knowledge 3겹 차단 인터페이스: retrieval gate, system prompt seal, tool 분기.
- contract test (mock fixture 기반).

DoD: AI tool 호출이 zod schema 위반 시 `safety_response = policy_violation`로 폴백. mock test 100% pass.

### Phase 3 — Lead Form + PIPA 골격 + Slack mock

목표: Lead Form Card가 PRD가 요구하는 동의 3종 + 보관 기간 표시 + Slack mock으로 끝나는 닫힘 흐름까지 도달.

작업:
- `apps/widget/src/components/LeadFormCard.tsx` — 필수/마케팅/펼침 3 체크박스. **카피는 source data 도착 전 placeholder 명시**.
- `packages/shared/src/pipa.ts` — 동의 payload schema, retention TTL config, whitelist 기반 PII 최소화.
- `packages/shared/src/integrations/slack-mock.ts` — staging mock webhook (실 webhook URL 금지).
- 단위 테스트: 동의 분리, 마케팅 미동의 제출 가능, payload PII whitelist 강제.

DoD: 폼 제출 → mock Slack payload 생성 → thank-you state 도달. 실 webhook은 Phase 6 production-readiness에서 wire.

### Phase 4 — embed.js iframe 실주입 + Admin 골격

목표: 호스트 페이지에 `<script src="embed.js">`만 넣으면 iframe이 정확히 주입되도록.

작업:
- `apps/embed/src/inject.ts` — iframe 생성, sandbox attr, CSP meta(`frame-ancestors`), origin handshake. 기존 type-level scaffolding을 실 코드로 끌어올린다.
- `apps/embed/dist/embed.js` 빌드(esbuild/Vite lib mode).
- `apps/admin` — Vite + React 골격, 5페이지 라우트 stub(Dashboard/Scenarios/KB/Audit/Settings). 실 데이터는 Phase 5에서.

DoD: `tests/fixtures/host.html`을 `npm run dev:host`로 띄우면 widget이 iframe 안에서 로드되고 handshake가 console에 보인다.

### Phase 5 — 실 데이터 백엔드 (source data 도착 후 시작)

목표: Supabase + Anthropic + Slack 실연결.

작업:
- Supabase schema, RLS, retention cron, audit log.
- Anthropic provider (prompt cache + tool use). API key는 Vercel env / GitHub Secret.
- Slack staging webhook, mock/staging/prod 분리.
- Admin RBAC, CSRF, idle timeout.

DoD: staging.concierge.motionlabs.kr에서 1개 시나리오가 e2e로 동작 + Computer-Use 100% pass.

### Phase 6 — Production-readiness + KPI

목표: 정량 임계 측정과 sunset 판단 인프라.

작업:
- KPI ingest: lead conversion, unsafe rate, latency, cost.
- Cost ceiling 자동 차단 (월 $1,000 over → nightly 중지 알림).
- Golden screenshot 1% threshold + mask 정책.
- 위험 답변 30건 suite + expected reason 매핑.
- A/B 50% rollout 이벤트 PII 제거.

DoD: nightly 회귀 7일 green, KPI raw data 수집, 인수인계 산출물 정리.

## 5. 마일스톤 한눈에

| Phase | 주차 매핑 | 핵심 산출물 | source data 의존 |
|---|---|---|---|
| 0 | W1 후반 | ROADMAP, CHANGELOG | 없음 |
| 1 | W1 후반 | Vite+React widget, ScenarioRunner, placeholder 시나리오 | 없음 (placeholder 라벨) |
| 2 | W2 | AI 7 tool zod, safety enum, mock provider | enum 카피만 source data 필요 |
| 3 | W2~W3 | Lead Form + PIPA 골격 + Slack mock | PIPA 최종 카피 source data 필요 |
| 4 | W3 | embed.js 실주입 + Admin 5페이지 라우트 | 없음 |
| 5 | W4~W5 | Supabase + Anthropic + Slack 실연결, Admin RBAC | source data 필요 |
| 6 | W5~W6 | KPI, golden, 위험 답변 30건, sunset | source data 필요 |

## 6. 자동화 / 거버넌스 그대로 보존

기존 W1 거버넌스 자산(security scan, PR evidence validator, cost ledger fixture, drift mirror test)은 그대로 둔다. 본 로드맵은 **추가**하지, **지우지** 않는다. 새 코드는 기존 PR evidence schema와 cost ledger 키를 그대로 채운다.

## 7. 다음 단계 (이 세션 종료 시)

이 세션에서 Phase 0 + Phase 1 + Phase 2 완료 목표.
- ROADMAP.md, CHANGELOG entry — Phase 0
- React widget 부트스트랩 + 6 컴포넌트 + ScenarioRunner — Phase 1
- 7 tool + 5 safety enum + Mock provider + Approved Knowledge 3겹 인터페이스 — Phase 2

남는 페이즈는 추가 세션 또는 source data 도착 시 재개.

문서 끝.

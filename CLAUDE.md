# Concierge AI — Project Context for Claude Code

## Project identity

- Repo: `/Users/woojinlee/Documents/projects/conciergeai`
- Product: **Concierge AI PoC** — an embedded widget/iframe Concierge experience.
- Preview target / strategic benchmark: **MotionLabs official homepage**, modeled after the **Interact AI** philosophy (turn a static homepage into an interactive guided experience).
- Preview target ≠ scope: the homepage is where the PoC will be staged, but the architecture is the PRD-defined widget/iframe system, not a generic homepage overlay.
- Primary user: MotionLabs website visitors — potential clients, partners, collaboration / career inquirers.

## Primary source of truth (read in this order)

1. `docs/prd/Concierge_AI_PRD_v1.2.md` — canonical PRD.
2. `docs/interaction/CURATION_CHOREOGRAPHY_SPEC.md` — Avatar 큐레이션 인터랙션 정밀 spec (PRD v1.2 §4의 single source).
3. `docs/alignment/FINAL_ALIGNMENT.md` — operating override + 35-item checklist.
4. `AGENTS.md` — agent role contract.
5. `ROADMAP.md` — phased delivery plan.
6. `DEPLOY.md` — Vercel deployment guide.

## Role override (current operation, 2026-05-08~)

- **Claude Code = 1차 구현자 (primary implementer).** Writes app code, schema, scenario JSON, tests, PR bodies. Drafts contracts (origin allowlist, postMessage envelope, choreographer model, KB rules).
- **Codex CLI / OMX = review-only 교차 검증자.** Does not author app code; reviews security, PIPA, iframe/postMessage boundaries, Approved Knowledge, AI tool schema, choreographer race conditions.
- **Computer-Use** = staging/preview browser verifier only. No production access, no code edits.
- **Woojin** = final approver. CI green + reviewer Critical 0 + Computer-Use 100% pass + Woojin approval are all required before merge.

PRD v1.1 §1 originally states Codex primary / Claude review-only. **FINAL_ALIGNMENT §1 + the 2026-05-08 override flips this for the active PoC.** PRD baseline is preserved unchanged; behavior follows FINAL_ALIGNMENT.

## Architecture (PRD-anchored)

- `apps/widget/` — Concierge widget rendered inside an iframe.
- `apps/embed/` — `embed.js` host injector and parent-iframe handshake.
- `apps/admin/` — Admin UI (5 pages, Week 4+).
- `packages/shared/` — shared types, postMessage envelope, origin allowlist helpers.
- `packages/kb/` — Approved Knowledge markdown sources + scenario JSON.
- `tests/` — unit / integration / e2e (Playwright); Computer-Use lives outside.

Iframe / postMessage rules: envelope has `version, type, nonce, timestamp, source, payload`. `targetOrigin` wildcard banned. `allow-same-origin` default OFF. CSP `frame-ancestors` always set. `embed.js` may not scrape parent DOM, cookies, localStorage, or sessionStorage without alignment-approved exception.

## Required UX flow (canonical, no substitutes)

The Concierge PoC interaction flow is fixed:

1. **Hero Bubble** — center-bottom floating capsule appears 3–6s after load.
2. **Quick Chips** — 4 context-aware chips inside the bubble (no free-input-first).
3. **Avatar Choreography** — chip click triggers avatar nudge / point motion toward the target anchor.
4. **Spotlight + Popover** — page section is dimmed and ringed; popover anchored to that section delivers the scenario step text.
5. **Lead Form** — the closing step renders an in-widget Lead Form Card with prefilled fields and PIPA consent (3-checkbox: 필수 / 마케팅 / 펼침).

This flow is the same on desktop and mobile (mobile = bottom-sheet variant). `prefers-reduced-motion: reduce` collapses every transition to an instant jump.

## Hard prohibitions

- No inline body-embedded guide card.
- No right-bottom ChannelTalk / Intercom style chat button.
- No generic empty chatbot ("무엇을 도와드릴까요?" 자유입력만 던지는 형태) — Concierge is choice-led, not chat-led.
- No long free-input-first chat log UX.
- No source-data-less production scenario steps, anchor selectors, popover messages, choice copy, lead-form transition conditions, or final 한국어 carbon copy. Test-only fixtures are allowed, but must be physically separated from production scenario JSON.
- No production secrets, webhook URLs, or service keys committed. `.env.example` is placeholder-only.
- No production motionlabs.kr access from Computer-Use; staging / preview only.

> v1.2 §6.1 — clinic / hospital / patient / medical / 병원 / 환자 / 진료 / 의료 / HandDoc 등 banned-vocab 가드는 폐기됐다. 이 어휘들은 모션랩스 정상 비즈니스 도메인이며 큐레이션 시나리오 작성에 필수다. 보안은 PIPA + prompt injection 2축으로 재정의되어 `packages/shared/src/security/`에 구현됐다.

## Source-data discipline (FINAL_ALIGNMENT §3)

Until Woojin provides source data, do not finalize:

- `ortho_revisit_v1` 5-step content (or any production scenario step content).
- Quick Chip 4종 final 한국어 문구.
- AI tool 7종 schema concrete behaviors and `safety_response` 5종 enum copy.
- Lead Form copy, PIPA consent text, retention values.
- Production origin / webhook real values.

Anything that surfaces user-visible final copy without source data must be a clearly-labeled placeholder inside a test fixture or prototype, never inside `packages/kb/scenarios/` production paths.

## Current quick-chip placeholder (homepage benchmark only)

For the homepage-benchmark prototype only, illustrative placeholder chips include:

- 무엇을 만들 수 있나요
- 프로젝트 상담
- 도입 방식
- 레퍼런스 보기

These are **placeholders** for visualizing the homepage benchmark. They are not the production Concierge PoC scenario chips and must not be promoted into `packages/kb/scenarios/` without source data.

## Verification expectation

Woojin prefers actual browser verification, console / network / resource checks, and screenshots — not only build/typecheck/test gates. Use Computer-Use or local browser for every UX-visible change.

## Working hygiene

- Branch + PR for every change. CHANGELOG.md gets a 1-line start + 1-line end per code-change PR.
- PR body must include: scope declaration, PRD/scenario mapping, change summary with Korean copy diff, test evidence, Computer-Use yes/no + reason, secret-scan result, cost ledger fields (`pr_number, computer_use_minutes, claude_review_tokens_estimate, llm_calls_estimate, running_total_week`).
- TypeScript strict, React function components, Tailwind utility classes, Framer Motion for animation.
- All user-facing text in Korean.

# Current Focus — Concierge AI Context Reset

Updated 2026-05-08. Re-aligned to PRD v1.1 + FINAL_ALIGNMENT after a homepage-only / overlay-only drift in the active doc set.

## Correct product frame

Concierge AI is a **PoC widget/iframe product** defined by `docs/prd/Concierge_AI_PRD_v1.1.md`. The MotionLabs official homepage is the **preview target** for the PoC and the strategic benchmark (Interact AI philosophy of turning a static homepage into an interactive guided experience). It is **not** a scope-reducing replacement for the PRD's iframe-embedded widget architecture.

Architecture stays as PRD §2.2:

- `apps/widget` — iframe widget UI.
- `apps/embed` — `embed.js` host injector + handshake.
- `apps/admin` — admin UI (Week 4+).
- `packages/shared` — shared types, envelope, origin allowlist.
- `packages/kb` — Approved Knowledge + scenario JSON.

## Required UX flow (canonical)

Hero Bubble → Quick Chips → Avatar choreography → Spotlight + Popover → Lead Form.

Same flow on desktop and mobile (mobile = bottom-sheet variant). `prefers-reduced-motion: reduce` jumps to final state instantly.

## Role override (active)

- Claude Code = 1차 구현자 (primary implementer).
- Codex CLI / OMX = review-only 교차 검증자.
- Computer-Use = staging/preview verifier only.
- Woojin = final approver.

PRD v1.1 §1 originally lists Codex primary / Claude review. The 2026-05-08 FINAL_ALIGNMENT override flips this. PRD baseline is preserved unchanged; behavior follows FINAL_ALIGNMENT.

## What was corrected (this pass)

- `CLAUDE.md` — was framed only as a "homepage companion" without anchoring PRD architecture, iframe/embed boundaries, the Hero Bubble → Lead Form flow, or the role override. Rewritten to anchor PRD v1.1 + FINAL_ALIGNMENT explicitly.
- `.claude/context/current-focus.md` (this file) — was contamination-cleanup-only. Re-anchored to PRD architecture and the canonical UX flow.
- `docs/interaction/CONCIERGE_AVATAR_INTERACTION_SPEC.md` — was overlay-language-heavy without iframe-architecture grounding or a Lead Form closing step. Re-anchored as a PRD-shaped, prototype-level spec; canonical flow named explicitly; placeholder copy flagged.
- `apps/widget/prototype-avatar-interaction.html` — copy is non-medical and benchmark-friendly. Marked prototype-only with placeholder copy; flow violations checked.

## Prior contamination (still cleared)

A prior prototype/spec used clinic/medical/HandDoc/Re:putation/NMOS framing. That contamination remains removed from the active prototype/spec; do not reintroduce it. Searches for `clinic / 병원 / 환자 / 진료 / 의료 / 예약 / appointment / patient / hospital / medical / HandDoc / Re:putation / NMOS` continue to return zero matches in the active prototype.

## Quick-chip placeholders

Two placeholder sets exist while source data is pending:

- Homepage-benchmark visualization (in `current-focus.md` / `CLAUDE.md`):
  - `무엇을 만들 수 있나요` / `프로젝트 상담` / `도입 방식` / `레퍼런스 보기`
- Standalone prototype HTML (`apps/widget/prototype-avatar-interaction.html`):
  - `서비스 핵심 보기` / `성과부터 보기` / `데모로 이동` / `도입 상담`

Both are **placeholders** until Woojin supplies `ortho_revisit_v1` 5-step source data and Quick Chip final 한국어 문구. Neither set is allowed inside `packages/kb/scenarios/` production paths.

## Next implementation focus

Before any more feature work:

1. Re-read `docs/prd/Concierge_AI_PRD_v1.1.md`, `docs/alignment/FINAL_ALIGNMENT.md`, `AGENTS.md`, `CLAUDE.md`, this file, `docs/interaction/CONCIERGE_AVATAR_INTERACTION_SPEC.md`.
2. Stay inside Week 1 Startable scope from FINAL_ALIGNMENT §3. Source-data-less final copy is forbidden.
3. When promoting from standalone prototype to production widget, implement inside `apps/widget/src` using PRD-defined iframe boundaries.
4. Browser-verify (console + network + screenshot) for every UX-visible change.

## Do not do

- Do not reintroduce clinic / hospital / patient / medical / appointment / 의료 / 병원 / 환자 / 진료 / 예약 / HandDoc / Re:putation / NMOS language.
- Do not author final 한국어 copy or scenario step content without source data.
- Do not skip browser verification for UX-facing changes.
- Do not treat the homepage benchmark as a substitute for the PRD widget/iframe architecture.
- Do not commit production secrets / webhook URLs / service keys.

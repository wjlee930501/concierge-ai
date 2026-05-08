# Concierge AI — Avatar Interaction Spec (PRD-shaped, v0.5)

## Source of truth ordering

1. `docs/prd/Concierge_AI_PRD_v1.1.md` — canonical PRD. This spec MUST stay consistent with it.
2. `docs/alignment/FINAL_ALIGNMENT.md` — operating override + 35-item checklist (Claude=primary / Codex=review-only, source-data discipline, 3-stage gate).
3. This file — interaction-level visualization aid for the iframe widget. **Not** a replacement for PRD architecture.

This is a prototype-level interaction spec. It must not be used to authorize production scenario content, final 한국어 copy, anchor selectors, popover messages, or PIPA copy without Woojin source data.

## Product framing

Concierge AI is a PoC **widget delivered inside an iframe** (PRD §2.2: `apps/widget` rendered by `apps/embed`). The MotionLabs official homepage is the **preview target / strategic benchmark** (Interact AI philosophy: turn a static homepage into an interactive guided experience). The homepage is where the PoC is staged — it is not a scope-reducing replacement for the iframe-embedded widget architecture.

## Hard corrections (kept)

- No 우하단 ChannelTalk / Intercom 채팅 버튼.
- No 본문 안 inline guide card.
- No Hero section 제품 mockup.
- No 정적 FAQ / CTA 카드.
- No 의료 / HandDoc / Re:putation / NMOS / 병원 / 환자 / 진료 / 예약 / appointment / patient / hospital / medical 문맥.
- No 자유 입력 중심 long chat. Concierge is choice-led, not chat-led.

## Canonical flow (no substitutes)

Hero Bubble → Quick Chips → Avatar choreography → Spotlight + Popover → Lead Form.

### 1. Hero Bubble

- Center-bottom floating capsule on top of the host page (rendered by the widget iframe; `apps/embed` injects the iframe).
- Initial position: viewport center-bottom (mobile = bottom-sheet variant with safe-area-inset).
- Appearance: 3–6s after page load (Computer-Use checks this window per FINAL_ALIGNMENT §4 / PRD v1.1 §4).
- First message proactively offers next-step choices instead of asking "무엇을 도와드릴까요?".
- Must NOT look like a bottom-right chat button.

### 2. Quick Chips

- Exactly 4 chips inside the Hero Bubble.
- Chip text = `scenario.initial_choices` from the corresponding scenario JSON (e.g., `ortho_revisit_v1`). The scenario JSON ships from `packages/kb/scenarios/`.
- Final 한국어 문구는 source data가 도착해야 확정. Until then, prototypes use **clearly labeled placeholders** (see "Placeholder copy" below).
- Free-text input is allowed in production but is never the primary affordance. Choice-first.

### 3. Avatar choreography

- Chip click triggers a `transition_hint` (~250ms) and an avatar nudge / point motion in the direction of the target anchor.
- Race condition tests required (FINAL_ALIGNMENT §G/26): rapid double-click, unmount, resize, reduced-motion toggle, stale async response.
- `prefers-reduced-motion: reduce`: skip motion, jump straight to the next state.

### 4. Spotlight + Popover

- The widget dims the host page (~8–16% rgba dim) and rings the target section with a spotlight outline.
- A popover anchored near the section delivers the scenario step's `popover.message` text exactly (Computer-Use compares 한 글자 수준).
- Popover can present additional choice chips (`step.choices`).
- Anchor selectors come from scenario JSON; the widget never invents them client-side.

### 5. Lead Form

- The closing step renders an in-widget Lead Form Card with prefilled fields.
- PIPA consent has 3 separate checkboxes: 필수 / 마케팅 / 펼침 상세. Marketing-opted-out submissions must still be allowed.
- Submission posts to a Slack webhook from environment variables (no hardcoded URLs) and persists the consent timestamp + version in Supabase.
- Lead Form copy, retention values, and PIPA strings are blocked until Woojin source data lands (FINAL_ALIGNMENT §3).

## Visual direction (prototype-level)

- Widget container: fixed, `bottom: 28~40px`, `left: 50%`, `transform: translateX(-50%)` (rendered inside the iframe; the iframe itself is positioned by `apps/embed`).
- Avatar: realistic AI-companion presence. No exaggerated mascots.
- Bubble palette: dark navy / white / mint accent, MotionLabs-aligned premium feel.
- Overlay: 8–16% page dim + spotlight ring; never blacks out the host page.
- Motion: floating idle, point/nudge, spotlight transition, popover reveal.

## Motion tokens (prototype-level)

- idle float: 4.5s, translateY 0 → -5px → 0
- chip hover: 160ms, translateY(-1px)
- stage open dim: 180ms opacity
- spotlight move: 320ms cubic-bezier(.2,.8,.2,1)
- avatar nudge: 260ms translate toward target direction
- popover reveal: 220ms opacity + translateY(6px)
- reduced motion: all transitions become instant state changes

## Iframe / postMessage boundary (must hold)

- Envelope: `version, type, nonce, timestamp, source, payload`. `targetOrigin` wildcard is forbidden.
- Sandbox: `allow-same-origin` default OFF, `allow-top-navigation*` forbidden, CSP `frame-ancestors` always set.
- `embed.js` may not scrape parent DOM, cookies, localStorage, or sessionStorage without an alignment-approved exception.

## Acceptance criteria

- First view shows a center-bottom floating Concierge inside the host page.
- It must not be mistaken for a bottom-right chat widget.
- Chip click results in real avatar choreography + spotlight + popover anchored to a real page element.
- The closing scenario step opens a Lead Form Card with PIPA 3-checkbox.
- Long chat log is forbidden; companion-style guidance only.
- Reduced-motion users get the same end state without animation.
- Verification on the actual MotionLabs preview must use real-browser screenshots (Computer-Use or local), not just build/test gates.

## Placeholder copy (until source data arrives)

The standalone prototype `apps/widget/prototype-avatar-interaction.html` carries placeholder Quick Chips for benchmark visualization only. They are **not** production scenario content and must not be promoted into `packages/kb/scenarios/`. Final 한국어 carbon copy is gated on Woojin source data per FINAL_ALIGNMENT §3.

## Status

- Prototype HTML: standalone visualization only. PRD-shaped but not architecturally complete (no Lead Form node yet — adding production Lead Form copy without source data would violate FINAL_ALIGNMENT §3).
- Production widget: implement in `apps/widget/src` against PRD §2.2 + FINAL_ALIGNMENT §3 Startable scope.

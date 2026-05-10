# Design Polish Sprint 4 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current Concierge widget feel more alive by adding a photo-avatar expression layer, speech-bubble motion details, and instant chip/focus feedback without migrating the full scenario schema yet.

**Architecture:** Keep the existing `ScenarioStep` runner intact and add a visual state layer at the component boundary. `App` derives a Korean-facing avatar expression from runner/free-input/choreography state, `Avatar` renders the current expression with cross-fade-friendly state attributes, and `HeroBubble`/`QuickChips` add low-risk motion polish that remains disabled under reduced-motion.

**Tech Stack:** React 19, TypeScript strict, Framer Motion, Tailwind utilities, Vitest + Testing Library, Vite widget build.

---

### Task 1: Spec Import And Planning Trace

**Files:**

- Create: `docs/interaction/CONCIERGE_DESIGN_POLISH_SPEC.md`
- Create: `docs/superpowers/plans/2026-05-10-design-polish-sprint4-foundation.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Import the provided design polish spec**

Run:

```bash
cmp -s /Users/woojinlee/Downloads/CONCIERGE_DESIGN_POLISH_SPEC.md docs/interaction/CONCIERGE_DESIGN_POLISH_SPEC.md
```

Expected: exit `0`, proving the repo copy matches the provided source document.

- [ ] **Step 2: Record the work start**

Ensure `CHANGELOG.md` contains a `Design polish / 2026-05-10` start line describing the Sprint 4 foundation scope.

### Task 2: Avatar Expression Contract

**Files:**

- Modify: `apps/widget/src/components/Avatar.tsx`
- Modify: `apps/widget/src/components/HeroBubble.tsx`
- Modify: `apps/widget/src/App.tsx`
- Test: `apps/widget/src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

Add App-level assertions that:

- Direct free-input focus switches the avatar to `listening`.
- AI thinking mode switches the avatar to `thinking`.
- Step choreography renders a `smile` expression for pointing/system-demo moments.

Run:

```bash
npx vitest run apps/widget/src/App.test.tsx
```

Expected before implementation: FAIL because avatar expression data attributes do not exist.

- [ ] **Step 2: Implement expression typing and derivation**

Add an `AvatarExpression` union with `neutral | smile | surprise | thinking | celebrate | concerned | listening | farewell`. Derive it in `App` from `freeInput.mode`, `avatarState`, and phase.

- [ ] **Step 3: Render expression evidence on Avatar**

Update `Avatar` to accept `expression`, expose `data-avatar-expression`, and keep the current single WebP as the fallback image for every expression until generated Tier 1 assets land in the next PR.

- [ ] **Step 4: Verify green**

Run:

```bash
npx vitest run apps/widget/src/App.test.tsx
```

Expected: PASS.

### Task 3: Bubble And Chip Micro-Interactions

**Files:**

- Modify: `apps/widget/src/components/HeroBubble.tsx`
- Modify: `apps/widget/src/components/QuickChips.tsx`
- Modify: `apps/widget/src/components/AiSpeechBubble.tsx`
- Test: `apps/widget/src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

Add assertions that the main speech bubble exposes `data-polish-breathing="true"` in normal motion mode and chip buttons expose `data-feedback-window-ms="50"`.

Run:

```bash
npx vitest run apps/widget/src/App.test.tsx
```

Expected before implementation: FAIL because the data attributes and reduced-motion breathing behavior do not exist.

- [ ] **Step 2: Add bubble breathing and tail rotation foundation**

Wrap the speech pill with a subtle scale keyframe in normal motion mode. Add a spring-animated tail element with `data-tail-anchor` so later anchor-specific rotation can be validated visually.

- [ ] **Step 3: Add instant chip feedback contract**

Set chip `whileTap` transition to 50ms and expose `data-feedback-window-ms="50"` for regression tests. Keep labels Korean and preserve existing chip sizing.

- [ ] **Step 4: Verify green**

Run:

```bash
npx vitest run apps/widget/src/App.test.tsx
```

Expected: PASS.

### Task 4: Full Verification And Branch Completion

**Files:**

- Modify: `CHANGELOG.md`

- [ ] **Step 1: Run verification**

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run security:scan
npm run pr:evidence:validate
npm run build:vercel:widget
git diff --check
```

Expected: every command exits `0`.

- [ ] **Step 2: Browser smoke**

Run the host preview dev server and verify that the widget still appears, chips still respond, and the host page spotlight path is not broken.

- [ ] **Step 3: Record the end state**

Append a single end line to `CHANGELOG.md` with the exact verification evidence and remaining follow-up items: generated photo assets, full 3-tier scenario schema, staging Computer-Use automation.

- [ ] **Step 4: Commit and open PR**

Use the Lore commit protocol with `Co-authored-by: OmX <omx@oh-my-codex.dev>`, push `feature/design-polish-sprint4`, and open a draft PR.

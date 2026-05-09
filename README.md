# Concierge AI

방문자가 길을 잃기 전에 다음 행동을 먼저 제안하는, 호스트 페이지 위에 iframe으로 주입되는 의도-기반 가이드 레이어.

## 모노레포 구조

```
apps/
  widget/   # iframe 안에서 실행되는 React 위젯 (Vite + Tailwind + Framer)
  embed/    # 호스트 페이지에 iframe을 주입하는 embed.js 번들
  admin/    # 운영용 Admin UI 5페이지 라우트 골격 (placeholder)
packages/
  shared/   # postMessage envelope, origin allowlist, 시나리오/AI zod 스키마
  kb/       # Approved Knowledge ingest, 시나리오 loader, 금지 어휘 가드
scripts/    # security scan, PR evidence validator
tests/
  fixtures/ # test-only 시나리오 / cost ledger / security fixture
docs/
  prd/        # PRD v1.1
  alignment/  # FINAL_ALIGNMENT, Codex/Claude 합의 문서
  architecture/, security/, interaction/
ROADMAP.md  # 페이즈별 제품화 로드맵
CHANGELOG.md
```

## 빠른 시작

```bash
npm install                            # 의존성 설치
npm run typecheck                      # 루트 strict TS 검사
npm test                               # vitest 전체
npm run dev:widget                     # 위젯 dev server (Vite, http://127.0.0.1:5173)
npm run --workspace=@conciergeai/admin dev   # Admin dev server (http://127.0.0.1:5174)
npm run --workspace=@conciergeai/embed build # embed.js 번들 빌드
```

## 검증 게이트

```bash
npm run typecheck
npm test
npm run pr:evidence:validate
npm run security:scan
npm run security:scan:diff
npm run security:scan:history
```

## 주요 문서

- `docs/prd/Concierge_AI_PRD_v1.1.md` — PRD canonical.
- `docs/alignment/FINAL_ALIGNMENT.md` — 운영 override + 35-item checklist.
- `AGENTS.md` / `CLAUDE.md` / `REVIEW.md` — 에이전트 역할 계약.
- `ROADMAP.md` — Phase 0~6 제품화 로드맵.

## 원칙 요약

1. PRD §2.2 / FINAL_ALIGNMENT §1로 고정된 UX 플로우: Hero Bubble → Quick Chips → Avatar choreography → Spotlight + Popover → Lead Form.
2. FINAL_ALIGNMENT §3에 따라 source data 미도착 카피는 모두 `[PLACEHOLDER]` 라벨 + `tests/fixtures/**`에만 둔다.
3. clinic/병원/환자/진료/예약/HandDoc/Re:putation/NMOS 등 금지 어휘는 `@conciergeai/kb`의 banned-vocab 가드가 자동 차단한다.
4. iframe 보안 경계: postMessage envelope 6필드, sandbox `allow-same-origin` 기본 OFF, CSP `frame-ancestors` 상시. `embed.js`는 parent DOM/cookie/storage scrape 금지.
5. PR 본문은 cost ledger 5필드(`pr_number`, `computer_use_minutes`, `claude_review_tokens_estimate`, `llm_calls_estimate`, `running_total_week`) 필수.

## 라이선스

Internal — MotionLabs.

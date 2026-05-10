# Concierge AI

방문자가 길을 잃기 전에 다음 행동을 먼저 제안하는, 호스트 페이지 위에 iframe으로 주입되는 의도-기반 가이드 레이어.

## Live Preview

- Widget Preview: TBD
- Embed Fixture Preview: TBD
- Admin Preview: TBD
- Staging MotionLabs Integration: TBD

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

- `docs/prd/Concierge_AI_PRD_v1.2.md` — **PRD canonical** (v1.1 supersedes).
- `docs/interaction/CURATION_CHOREOGRAPHY_SPEC.md` — Avatar 큐레이션 인터랙션 정밀 spec (PoC 단일 차별점).
- `docs/alignment/FINAL_ALIGNMENT.md` — 운영 override + 35-item checklist (v1.2 §1이 정식 승격).
- `AGENTS.md` / `CLAUDE.md` / `REVIEW.md` — 에이전트 역할 계약.
- `ROADMAP.md` — Phase 0~6 제품화 로드맵.
- `DEPLOY.md` — Vercel 배포 가이드.

## 원칙 요약

1. **PoC 단일 가치 명제 (PRD v1.2 §0)**: Avatar가 motionlabs.kr 위에서 직접 이동하며 방문자에게 적합한 모션랩스 제품을 손짓으로 안내하고, 그 큐레이션의 결과로 세일즈 리드를 수집한다.
2. **UX 플로우 (canonical)**: Hero Bubble → Quick Chips → Avatar choreography → Spotlight + Popover → Lead Form. 정밀 spec은 `CURATION_CHOREOGRAPHY_SPEC.md`.
3. **FINAL_ALIGNMENT §3**: source data 미도착 카피는 `tests/fixtures/**` + `isPlaceholder: true` boundary로 분리.
4. **보안 2축 (PRD v1.2 §6)**: PIPA (M0/M1 secret scanner) + prompt injection 3-layer (`packages/shared/src/security/`). v1.1의 banned-vocab 가드는 폐기.
5. **iframe 경계**: postMessage envelope 6필드, sandbox `allow-same-origin` 기본 OFF, CSP `frame-ancestors` 상시. `embed.js`는 parent DOM/cookie/storage scrape 금지.
6. **PR 본문**: cost ledger 5필드(`pr_number`, `computer_use_minutes`, `claude_review_tokens_estimate`, `llm_calls_estimate`, `running_total_week`) 필수.

## 라이선스

Internal — MotionLabs.

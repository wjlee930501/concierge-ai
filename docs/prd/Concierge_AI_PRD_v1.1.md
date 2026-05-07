# Concierge AI PRD v1.1 (MVP + Implementation Loop)

작성 목적: v1.0 MVP 위에 실제 구현 도구 stack과 자동 검증 루프를 명확히 한다.

v1.0 대비 변경:
- 1차 구현 메인은 Codex (GPT-5.4 / GPT-5.5)
- Claude Code는 review-only 교차 검증 (Code Review 기능 + headless mode)
- Codex Computer-Use로 실제 브라우저에서 시나리오 검증 자동 루프
- 일일 / 주간 검증 cadence와 산출물 정의

본 문서는 v1.0의 22개 섹션은 그대로 유지하면서 실행 layer만 추가합니다.

---

## 1. 도구 역할 분담 (단일 책임)

| 도구 | 역할 | 권한 |
|------|------|------|
| Codex (CLI / IDE / Cloud) | 1차 구현, 디버깅, 리팩토링, 테스트 작성 | Read + Write + Run |
| Codex Computer-Use | 실제 브라우저에서 PoC 시나리오 자동 검증 | Browser only (격리) |
| Claude Code | PR review-only, 교차 검증, 보안 검토 | Read only |
| 대표님 | 최종 의사결정 + merge 승인 | All |

핵심 원칙:
- 같은 PR을 두 AI가 build하지 않습니다. Codex가 만들고 Claude가 봅니다.
- Codex Computer-Use는 production code를 만지지 않습니다. 검증만.
- 모든 merge는 대표님 승인 필수. 두 AI 모두 통과해도 자동 merge 금지.

---

## 2. Codex 메인 구현 환경

### 2.1 설치 / 모델

- 설치: `npm install -g @openai/codex` 또는 GitHub Release binary
- ChatGPT Pro 계정 sign-in (대표님 이미 보유)
- 모델: 기본 GPT-5.5 (가용 시), fallback GPT-5.4
- 빠른 작업: GPT-5.3-Codex-Spark
- GPT-5.4 / 5.5는 native computer-use 지원

### 2.2 Repo 구조 (PoC 시작 시)

```
concierge-ai/
├── .agents/
│   ├── plugins/marketplace.json     # Codex skill / plugin
│   └── skills/
│       ├── concierge-ui/SKILL.md
│       ├── concierge-ai/SKILL.md
│       └── concierge-test/SKILL.md
├── .codex/
│   └── config.toml                  # Codex 환경 설정
├── AGENTS.md                        # Codex 진입 가이드 (구 CODEX.md)
├── CLAUDE.md                        # Claude Code 진입 가이드
├── REVIEW.md                        # Claude Code Code Review 룰
├── CHANGELOG.md                     # 작업 이력 working memory
├── apps/
│   ├── widget/                      # Concierge widget (iframe)
│   ├── admin/                       # Admin UI 5페이지
│   └── embed/                       # embed.js
├── packages/
│   ├── shared/                      # 공유 타입 / utils
│   └── kb/                          # KB markdown 원본
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                         # Playwright (Codex Computer-Use는 별도)
├── docs/
│   └── prd/Concierge_AI_PRD_v1.1.md
└── .github/
    └── workflows/
        ├── ci.yml                   # 테스트 + 빌드
        ├── claude-review.yml        # Claude Code Review trigger
        └── computer-use-verify.yml  # Codex Computer-Use 검증 trigger
```

### 2.3 AGENTS.md (Codex 진입 가이드)

Codex가 매 세션 시작 시 읽는 파일.

```markdown
# AGENTS.md — Codex Agent Guide

## 역할
당신은 Concierge AI의 1차 구현자입니다.
모든 코드는 당신이 작성하고, Claude Code가 review합니다.

## 작업 우선순위
1. PRD v1.1 docs/prd/Concierge_AI_PRD_v1.1.md를 기준 문서로 따릅니다.
2. CHANGELOG.md에 작업 시작 시 의도를 1줄 기록, 종료 시 변경 사항을 1줄 추가합니다.
3. 모든 변경은 별도 git branch에서 작업하고 PR로 push합니다.
4. PR 본문에는 다음 4개를 반드시 포함:
   - 어떤 PRD 섹션을 구현했는가
   - 무엇을 변경했는가
   - 어떤 테스트를 추가했는가
   - Computer-Use 검증이 필요한가 (yes / no)

## 코딩 규칙
- TypeScript strict mode
- React function components only
- Tailwind utility class only (custom CSS 금지)
- Framer Motion으로 애니메이션 (CSS animation 금지)
- 모든 사용자 노출 텍스트는 한국어
- 모든 새 함수에 단위 테스트 1개 이상

## 절대 하지 말 것
- production secrets (API key, webhook URL 등) 코드에 하드코드
- 사용자 노출 영역에 console.log 남기기
- 새로운 npm dependency 추가 시 PR 본문에 이유 명시 (license, size 검증)
- PRD에 명시되지 않은 새 기능 추가 (변경은 PRD update PR 별도)

## Computer-Use 사용
브라우저 검증이 필요한 경우 codex computer-use를 호출합니다.
production motionlabs.kr이 아닌 staging.concierge.motionlabs.kr만 접근.
검증 결과는 PR 본문 하단에 자동 첨부합니다.

## Claude Code의 review를 기다립니다
당신은 PR을 만들고, Claude Code가 review를 답니다.
review 결과를 받으면 의견을 평가하고 수정합니다.
Critical issue는 모두 반영, Nit은 선택적으로 반영합니다.
```

### 2.4 Codex 활용 패턴 (3가지)

#### 패턴 A — 기능 단위 구현

```bash
codex
# 인터랙티브 세션
> @AGENTS.md 읽고, PRD 1.1 5번 섹션 (5개 시나리오 중 정형외과)을
  apps/widget에 구현해줘. 시나리오 JSON은 packages/kb/scenarios/
  ortho_revisit_v1.json을 사용해줘. 단위 테스트 포함.
```

Codex가 반복 loop로 file 읽기 → 수정 → 테스트 실행 → PR 생성까지 수행.

#### 패턴 B — Cloud 병렬 작업

여러 시나리오를 동시 작업:

- Cloud Task 1: 시나리오 2 (im_checkup_v1) 구현
- Cloud Task 2: 시나리오 3 (opening_doctor_v1) 구현
- Cloud Task 3: 시나리오 4 (manager_kakao_v1) 구현

각 cloud task는 자체 sandbox에서 완료 → 대표님이 merge 결정.

#### 패턴 C — Computer-Use 검증

```bash
codex
> staging.concierge.motionlabs.kr에서 정형외과 시나리오 5단계를 실행하고,
  각 step의 spotlight가 올바른 element에 떨어지는지 screenshot 찍고
  비교해줘. 실패하면 fail 사유와 함께 보고해줘.
```

Codex가 in-app browser로 직접 클릭, 타이핑, screenshot 비교.

---

## 3. Claude Code 교차 검증 환경

### 3.1 설치 / 모델

- 설치: 대표님 보유 Anthropic 계정 / Claude Max plan
- 모델: Claude Sonnet 4.7 또는 Opus 4.7 (review용)
- 운영 mode: Code Review (managed) + headless mode (CI)

### 3.2 운영 mode 2가지

#### Mode 1 — Code Review (managed, 권장)

GitHub PR 생성 시 자동 trigger. multi-agent fleet이 review.

- 비용: PR당 약 $15~25 (PoC 6주 약 50~80 PR 가정 시 $750~2,000)
- 트리거: "Once after PR creation" (PoC에 맞는 옵션)
- 결과: PR에 inline comment + summary

#### Mode 2 — headless mode (CI 보완, 선택)

GitHub Actions에서 Claude Code SDK로 추가 검증. 토큰 cap 필요.

```yaml
# .github/workflows/claude-review.yml
name: Claude Code Review (headless)
on: pull_request
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Review this PR strictly per REVIEW.md.
            Focus: security, PIPA compliance, AI tool schema integrity, 
            iframe / postMessage boundary, race conditions in choreographer.
            Cap nits at 5.
          claude_args: |
            --max-tokens 20000
            --read-only
```

PoC에서는 비용 절감 위해 Mode 1만 사용 권장. Mode 2는 critical PR(보안·결제·개인정보)에만.

### 3.3 REVIEW.md (Claude Code 진입 가이드)

```markdown
# REVIEW.md — Claude Code Review Rules

## What Important means here
Reserve "Important" for:
- Logic errors that break a defined PRD scenario
- Security vulnerabilities (XSS, SQL injection, prompt injection)
- PIPA compliance gaps (consent missing, retention violation)
- Race conditions in Avatar Choreographer
- iframe/postMessage boundary violations
- Approved Knowledge 원칙 위반 (KB 외 답변 가능 경로)

## Cap the nits
Report at most 5 nits per review.
If everything is a nit, lead summary with "No blocking issues."

## Do not report
- CI 자동 enforce (lint, typecheck, format, test result)
- Generated files (`*.gen.ts`, `*.d.ts`, `dist/`)
- KB markdown 본문의 한국어 표현 ("느낌"의 영역)
- 시나리오 JSON의 마이크로카피 ("의역" 가능 영역)

## Always check
- 새 API route는 integration 테스트가 있는가
- LLM 호출에 prompt cache 옵션이 있는가
- Slack webhook URL이 환경변수에서 오는가 (하드코드 X)
- DB 쿼리에 SQL injection 가능성 있는가
- iframe postMessage origin 검증이 있는가
- 사용자 노출 텍스트가 한국어인가
- Lead form에 PIPA 동의 항목 3개(필수, 마케팅, 펼침)가 있는가
- AI tool zod schema가 PRD 정의와 일치하는가
- safety_response가 PRD 5개 reason과 매칭되는가
- prefers-reduced-motion 대응 코드가 있는가

## Repo-specific checks
- AGENTS.md를 수정하면 사유를 PR 본문에 명시
- 새 npm dependency는 license 명시 (MIT / Apache 2.0만)
- GPT-5.4 / 5.5에 의존하는 API contract 변경은 separate PR
```

### 3.4 Review → 수정 흐름

```
[Codex가 PR 생성]
    ↓
[GitHub Actions CI (lint, typecheck, test)]
    ↓
[Claude Code Review 자동 dispatch]
    ↓
[Claude이 inline comment + summary]
    ↓
[Codex가 review를 읽고 평가]
    ↓
[Critical 이슈 → 즉시 수정 commit]
[Important → 수정 또는 reasoning 답변 commit]
[Nit → 선택적 수정]
    ↓
[대표님 final review]
    ↓
[Merge 승인]
```

Codex는 Claude의 review에 자동 응답 가능. 하지만 본 PoC에서는 Codex가 **commit으로만** 응답하고, 답글은 안 답니다 (token 낭비 방지).

---

## 4. Codex Computer-Use 자동 검증 루프

이게 v1.1의 핵심 추가입니다. 시나리오 정확성을 LLM이 직접 브라우저에서 검증.

### 4.1 검증 환경

- URL: `https://staging.concierge.motionlabs.kr` (PoC용 staging, production 분리)
- 브라우저: Codex in-app browser (GPT-5.4 / 5.5 native computer-use)
- 권한: staging only, allowed websites 화이트리스트 등록
- 격리: production motionlabs.kr / 외부 사이트 접근 금지

### 4.2 검증 시나리오 카탈로그

5개 visitor view × 각 시나리오 step 평균 5개 = 약 25개 step. 각 step별로 다음을 자동 검증:

| 검증 항목 | 통과 조건 |
|----------|----------|
| Hero Bubble 등장 | 페이지 로드 후 3~6초 사이 viewport 안 등장 |
| Quick Chip 4개 | 텍스트가 PRD와 정확 일치 |
| Chip 클릭 → Avatar Move | Avatar가 해당 anchor로 이동 (좌표 ±20px 허용) |
| Spotlight 위치 | 의도한 section_id에 정확히 떨어짐 (selector match) |
| Popover 텍스트 | 시나리오 JSON message와 정확 일치 (한 글자 비교) |
| 선택지 chip 노출 | 정의된 choices 모두 시각화 |
| 다음 step 진행 | 클릭 후 다음 anchor로 이동 |
| Lead Form 노출 | 마지막 step에서 Lead Form Card 등장 |
| 자유 입력 → AI 응답 | 자유 텍스트 입력 시 적절한 tool 호출 |
| Mobile 변형 | 375px viewport에서 bottom sheet 작동 |
| prefers-reduced-motion | 모션 감소 켜진 환경에서 즉시 jump |

### 4.3 Test Plan 자동화 (PRD v1.0 7번 섹션과 연결)

PRD v1.0 7번의 100 시나리오 중 다음을 Computer-Use로 자동화:

| 카테고리 | 자동화 가능 | 비고 |
|---------|-----------|------|
| 정상 흐름 30건 | 100% | 5 view × 6 시나리오 |
| 위험 답변 30건 | 100% | 입력 → safety_response 호출 검증 |
| Edge case 15건 | 80% | 모바일·새로고침은 자동, 네트워크 단절은 수동 |
| Returning visitor 15건 | 0% (To-Be) | cross-session memory 미구현 |
| Failure mode 10건 | 50% | API timeout 모킹 |

총 약 70건이 매주 자동 회귀 테스트.

### 4.4 검증 trigger

#### Trigger A — PR 생성 시 (CI integration)

```yaml
# .github/workflows/computer-use-verify.yml
name: Codex Computer-Use Verification
on:
  pull_request:
    paths:
      - 'apps/widget/**'
      - 'apps/admin/**'
      - 'packages/kb/scenarios/**'
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        run: |
          # PR preview 배포 (Vercel preview URL)
          PREVIEW_URL=$(vercel deploy --token ${{ secrets.VERCEL_TOKEN }})
          echo "PREVIEW_URL=$PREVIEW_URL" >> $GITHUB_ENV
      - name: Codex Computer-Use verify
        run: |
          codex exec \
            --json \
            --max-tokens 50000 \
            --skill concierge-test \
            --prompt "Run scenario suite ortho_revisit_v1 against $PREVIEW_URL. Report each step pass/fail with screenshot."
      - name: Post results to PR
        run: gh pr comment ${{ github.event.pull_request.number }} --body-file verify-result.md
```

#### Trigger B — 매일 야간 (정기 회귀)

```yaml
# .github/workflows/computer-use-nightly.yml
name: Nightly Verification
on:
  schedule:
    - cron: '0 16 * * *'  # 매일 새벽 1시 KST
jobs:
  verify-all:
    runs-on: ubuntu-latest
    steps:
      - name: Run all 70 scenarios
        run: codex exec --skill concierge-test --prompt "Run full suite against https://staging.concierge.motionlabs.kr"
      - name: Notify Slack
        if: failure()
        run: |
          curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"🔴 Concierge nightly verify failed. Check Codex run."}' \
            ${{ secrets.SLACK_WEBHOOK_URL }}
```

#### Trigger C — KB / 시나리오 수정 시 (이다슬 팀장 admin 작업 후)

이다슬 팀장이 admin에서 시나리오 또는 KB 수정 → 저장 시 webhook → GitHub repository_dispatch event → Computer-Use가 영향 받는 시나리오만 재검증.

```typescript
// apps/admin/api/scenarios/[id]/route.ts (PUT)
export async function PUT(req: Request) {
  // ... 시나리오 저장 로직
  
  // GitHub에 verify trigger 발송
  await fetch('https://api.github.com/repos/motionlabs/concierge-ai/dispatches', {
    method: 'POST',
    headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` },
    body: JSON.stringify({
      event_type: 'scenario_changed',
      client_payload: { scenario_id, version_id }
    })
  })
}
```

### 4.5 Computer-Use Skill 정의

`.agents/skills/concierge-test/SKILL.md`:

```markdown
# concierge-test

## name
concierge-test

## description
Verify Concierge AI scenarios end-to-end in a real browser.
Use when: PR touches apps/widget, apps/admin, or packages/kb/scenarios.
Trigger words: verify, test scenario, browser check, e2e

## Inputs
- target_url: staging URL
- scenario_id: e.g., ortho_revisit_v1
- viewport: desktop (1280x800) | mobile (375x667)

## Steps
1. Open target_url in browser
2. Wait 5 seconds for Hero Bubble
3. Verify Hero Bubble visible at viewport center-bottom
4. Verify 4 Quick Chips text matches scenario.initial_choices
5. Click first chip
6. Verify transition_hint appears for ~250ms
7. Verify Avatar moves to expected anchor
8. Verify spotlight on expected section_id
9. Verify popover text matches step.popover.message
10. Repeat for each step until lead_form
11. Verify Lead Form Card with prefilled fields
12. Submit dummy data
13. Verify Slack webhook called (mock)
14. Verify thank-you message
15. Capture screenshots at each step
16. Compare with golden screenshots in tests/golden/

## Output
JSON report:
{
  "scenario_id": "ortho_revisit_v1",
  "viewport": "desktop",
  "steps": [
    { "id": "step_case", "passed": true, "screenshot": "..." },
    { "id": "step_how", "passed": false, "reason": "Spotlight on wrong element", "expected": "case_orthopedics_revisit_card", "actual": "case_internal_revenue_card" }
  ],
  "overall": "failed",
  "duration_ms": 45000,
  "tokens_used": 12000
}

## Forbidden
- Do NOT touch production motionlabs.kr
- Do NOT submit real user data
- Do NOT modify any code (read-only browser ops)
```

### 4.6 Golden Screenshot 비교

각 step의 expected UI를 `tests/golden/{scenario_id}/{step_id}_{viewport}.png`로 저장.
Computer-Use가 새 screenshot을 찍어 pixel-diff. 임계 1% 이상 차이나면 fail.

골든 업데이트는 별도 PR (UPDATE_GOLDEN=true 환경변수로 명시적 갱신).

### 4.7 비용 통제

Computer-Use는 토큰 비싼 작업. 하루에 무한정 돌리면 비용 폭주.

| Trigger | 빈도 | 시나리오 수 | 추정 토큰 | 추정 비용/회 |
|---------|------|-----------|----------|------------|
| PR (코드 변경) | PR당 1회 | 영향 받는 시나리오만 (1~5개) | 20K~80K | $0.5~2 |
| Nightly 회귀 | 매일 1회 | 70개 전수 | 800K | $20 |
| 시나리오 수정 | 이벤트 | 해당 시나리오만 (1개) | 20K | $0.5 |

월 추정:
- PR: 50회 × $1 = $50
- Nightly: 30회 × $20 = $600
- 수정 trigger: 100회 × $0.5 = $50
- 합산 약 $700/월

비용 cap:
- 월 $1,000 초과 시 nightly 자동 중지 + 대표님 알림
- 단일 PR이 $10 초과 시 fail (이상 동작 의심)

---

## 5. 통합 워크플로 (3-Layer Loop)

```
                    ┌──────────────────────────┐
                    │   대표님 (의사결정자)     │
                    └─────────────┬────────────┘
                                  │ task assign
                                  ▼
                    ┌──────────────────────────┐
                    │      Codex (구현자)       │
                    │   GPT-5.5 / 5.4           │
                    └─────┬─────────────────┬──┘
                          │                 │
                          │ creates PR      │ uses computer-use
                          ▼                 ▼
              ┌──────────────────┐  ┌──────────────────────┐
              │  GitHub PR       │  │ Codex Computer-Use   │
              │  + CI (test/lint)│  │ (staging 브라우저)    │
              └────────┬─────────┘  └──────────┬───────────┘
                       │                       │
                       │ triggers              │ verify result
                       ▼                       ▼
              ┌──────────────────┐  ┌──────────────────────┐
              │ Claude Code      │  │ Verify Report → PR   │
              │ Review (검증자)   │  │                       │
              └────────┬─────────┘  └──────────┬───────────┘
                       │ inline comments        │ pass/fail
                       ▼                       ▼
                       └───────────┬───────────┘
                                   │
                                   ▼
                       ┌──────────────────────┐
                       │  대표님 최종 승인     │
                       │  → Merge             │
                       └──────────────────────┘
```

검증 통과 조건 (모두 만족 시 merge 가능):
1. CI green (lint, typecheck, unit test)
2. Claude Code Review에 Critical 0건
3. Codex Computer-Use 영향 시나리오 100% pass
4. 대표님 승인

---

## 6. 6주 일정 — 구현 도구 관점 재배치

| Week | Codex 작업 | Claude Code 검증 | Computer-Use 검증 |
|------|-----------|-----------------|------------------|
| 1 | 기반 setup, 정형외과 시나리오 hard-coded | REVIEW.md 작성, 첫 PR review | embed.js inject 검증, Hero Bubble 등장 검증 |
| 2 | AI tool 7종, system prompt, KB | LLM 호출 안전성 / prompt injection / safety_response 5종 검증 | 정형외과 시나리오 5 step e2e |
| 3 | 시나리오 4종 추가, Lead Form, Slack | 시나리오 5종 schema 일관성, PIPA 동의 코드 | 시나리오 5종 × desktop/mobile = 10 suite |
| 4 | Admin UI 5페이지 | Auth / CSRF / SQL injection / API 권한 | Admin 5페이지 CRUD 시나리오 |
| 5 | Polish, mobile, 50% A/B | Production-readiness checklist | 위험 답변 30건 + 정상 70건 = 100건 전수 |
| 6 | Bug fix, KPI 측정, 인수인계 | 최종 sweep | 매일 nightly 회귀 |

---

## 7. CHANGELOG.md 운영

Codex가 매 작업마다 1줄씩 추가하는 working memory.

```markdown
# CHANGELOG.md

## [Week 5 / 2026-06-XX]
- W5D1: Hero Bubble mobile 변형 작업 시작 (Section 4.6)
- W5D1: Hero Bubble bottom 12px → safe-area-inset 적용
- W5D2: Avatar size 28px in mobile, anchor 모두 bottom-right로 통일
- W5D3: Test plan 위험 30건 자동화 PR #87 생성
...

## [Week 4]
- W4D1: Admin Dashboard scaffolding (PRD 7.1)
...
```

이 파일은 Codex의 `tmux 다일 세션 working memory`로 작용. Codex가 새 세션 시작 시 항상 읽음.

---

## 8. 보안 / Secret 관리

| Secret | 저장 위치 | 접근자 |
|--------|----------|--------|
| Anthropic API key (운영) | Vercel env | production Concierge widget |
| Anthropic API key (Claude Code Review) | GitHub Secret | claude-review.yml |
| OpenAI API key (Codex CLI) | 대표님 로컬 | 대표님 |
| OpenAI API key (Codex Cloud) | ChatGPT Pro 자동 | Codex Cloud |
| Supabase service key | Vercel env | API routes |
| Slack webhook URL | Vercel env + GitHub Secret | API routes + computer-use |
| GitHub token | 대표님 로컬 + repository_dispatch용 | admin 백엔드 |

원칙:
- Codex가 작성하는 코드에 절대 secret 하드코드 금지 (REVIEW.md에서도 강제)
- staging과 production은 별도 Supabase 프로젝트
- Computer-Use는 staging만 접근

---

## 9. 사고 발생 시 대응

| 사고 | 대응 |
|------|------|
| Computer-Use가 production 접근 시도 | 즉시 차단 (allowed website list로 막힘) + 대표님 알림 |
| Claude Code Review 비용 폭주 ($100/주 초과) | trigger를 manual로 변경 |
| Codex가 production secret 하드코드 PR 생성 | Claude Code Review가 detect → block |
| Computer-Use가 dummy lead 정보로 Slack spam | mock webhook 사용 (real webhook은 production만) |
| Nightly 회귀 매일 fail | Slack 알림 → 대표님 morning review에 포함 |

---

## 10. PoC 종료 시 산출물

6주 종료 시 다음을 회수:

| 산출물 | 위치 | 용도 |
|--------|------|------|
| 코드 베이스 (Codex 작성) | concierge-ai repo | 향후 운영·수정 |
| Claude Code Review 이력 | GitHub PR comments | 의사결정 기록 |
| Computer-Use 검증 보고서 | GitHub Actions artifacts | 회귀 자산 |
| Golden screenshot 70개 | tests/golden/ | 향후 회귀 비교 |
| KPI raw data | Supabase + Vercel Analytics | Sunset 판단 근거 |
| 대화 로그 전수 | Supabase | 시나리오 개선 자산 |
| 위험 답변 30건 결과 | Computer-Use 보고서 | 안전성 증명 |

---

## 11. v1.0 → v1.1 변경 요약

추가:
- Section 1: 도구 역할 분담 (단일 책임 원칙)
- Section 2: Codex 메인 구현 (CLI, Cloud, Computer-Use 활용 패턴 3종)
- Section 3: Claude Code 교차 검증 (managed Code Review + headless 보완)
- Section 4: Codex Computer-Use 자동 검증 루프 (skill, 70건 자동화, 3종 trigger, 비용 통제)
- Section 5: 통합 워크플로 (3-Layer Loop 다이어그램)
- Section 6: 6주 일정 — 구현 도구 관점 재배치
- Section 7: CHANGELOG.md working memory 운영
- Section 8: Secret 관리
- Section 9: 사고 발생 시 대응
- Section 10: PoC 종료 시 산출물

변경:
- v1.0의 11번 (Solo 개발 일정) → 본 문서 6번에 도구별 책임 추가
- v1.0의 7번 (Test Plan 100 시나리오) → 본 문서 4번에 자동화 비율 명시 (70건 자동, 30건 수동)

원칙 하나만 기억:
> Codex는 만든다. Claude는 본다. Computer-Use는 검증한다. 대표님이 결정한다.

---

## 12. 다음 액션 (PoC 착수 전 1주)

기존 v1.0 다음 액션 5가지에 추가:

6. ChatGPT Pro 계정에서 Codex CLI 설치 + sign-in
7. Codex .codex/config.toml 작성 (computer-use allowed_websites: staging.concierge.motionlabs.kr만)
8. Anthropic 계정 Claude Code 사용량 확인 + Code Review 활성화
9. GitHub repo 생성 + AGENTS.md / CLAUDE.md / REVIEW.md 작성
10. staging.concierge.motionlabs.kr 서브도메인 발급 (production과 분리)

이 10가지 모두 준비되면 Week 1 시작.

---

문서 끝.

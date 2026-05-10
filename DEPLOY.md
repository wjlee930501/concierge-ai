# DEPLOY.md — Vercel 배포 가이드

작성: 2026-05-09
대상 저장소: https://github.com/wjlee930501/concierge-ai

## 1. 사전 준비

- GitHub repo에 모든 변경 커밋·push (현재 로컬은 git init은 됐지만 첫 커밋 없음).
- Vercel 계정 (Hobby tier로 PoC 충분).
- staging 도메인 1개 + production 도메인 1개. PRD §4.1에 따라 production motionlabs.kr은 Computer-Use 접근 금지, staging만 검증용.

## 2. Vercel Project 2개 생성

같은 GitHub repo를 두 번 import해서 Project를 두 개 만든다.

### Project A — Concierge Widget

| 설정               | 값                                      |
| ------------------ | --------------------------------------- |
| Project name       | `concierge-widget`                      |
| Framework Preset   | Vite                                    |
| **Root Directory** | `apps/widget`                           |
| Install Command    | (default — vercel.json이 override)      |
| Build Command      | (default — vercel.json이 override)      |
| Output Directory   | (default — vercel.json이 `dist`로 지정) |

Environment Variables (모든 환경에 동일하게):

| Key                              | Production                                        | Preview/Staging                                                            |
| -------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| `VITE_CONCIERGE_ENVIRONMENT`     | `production`                                      | `staging`                                                                  |
| `VITE_CONCIERGE_ALLOWED_ORIGINS` | `https://motionlabs.kr,https://www.motionlabs.kr` | `https://staging.motionlabs.kr`                                            |
| `VITE_CONCIERGE_EMBED_BASE`      | `https://widget.concierge.motionlabs.kr`          | `https://widget.concierge.motionlabs.kr` (preview alias 사용 시 자동 분리) |

Custom domain: `widget.concierge.motionlabs.kr` (production) + `staging.widget.concierge.motionlabs.kr` (preview alias).

### Project B — Concierge Admin

| 설정               | 값                     |
| ------------------ | ---------------------- |
| Project name       | `concierge-admin`      |
| Framework Preset   | Vite                   |
| **Root Directory** | `apps/admin`           |
| Build Command      | (vercel.json override) |
| Output Directory   | `dist`                 |

Vercel Project 설정 → Deployment Protection → Password 권장 (Phase 5 RBAC 도입 전까지).

Custom domain: `admin.concierge.motionlabs.kr`.

## 3. 호스트 페이지 (motionlabs.kr) 통합

production motionlabs.kr 본문 `<head>` 또는 `<body>` 끝에 다음 한 줄만 추가하면 된다.

```html
<script src="https://widget.concierge.motionlabs.kr/embed.js" defer></script>
<script>
  window.addEventListener("DOMContentLoaded", function () {
    window.Concierge.inject({
      widgetSrc: "https://widget.concierge.motionlabs.kr/",
      allowedParentOrigins: [
        "https://motionlabs.kr",
        "https://www.motionlabs.kr"
      ],
      frameAncestors: ["https://motionlabs.kr", "https://www.motionlabs.kr"],
      environment: "production"
    });
  });
</script>
```

staging은 origin 목록만 staging 도메인으로 교체.

## 4. 검증 체크리스트

배포 직후 staging URL에서 확인:

- [ ] Hero Bubble이 3-6초 사이에 등장 (`prefers-reduced-motion` 켜면 즉시 등장).
- [ ] Quick Chip 4개 모두 클릭 가능, 클릭 시 Avatar가 해당 anchor 방향으로 이동, Spotlight + Popover 정상 표시.
- [ ] "직접 물어보기" → 자유 입력 입력 후 응답 streaming → 제안 chip 노출.
- [ ] 마지막 step 도달 시 Lead Form Card 노출, 메시지 필드에 자동 요약 prefill.
- [ ] PIPA 필수 동의 미체크면 제출 버튼 비활성화.
- [ ] 제출 후 thank-you 카드 노출.
- [ ] DevTools Network: production secret/webhook URL 노출 없음.
- [ ] DevTools Console: postMessage handshake 성공 로그(host-fixture 사용 시 `[host-fixture] embed ready`).
- [ ] DevTools Application > Frames: iframe `sandbox` 속성에 `allow-same-origin` 없음.
- [ ] Response Headers: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` 모두 존재.

## 5. Phase 5 wiring (source data 도착 후)

- `/api/concierge` Vercel Function 추가 → Anthropic prompt cache + tool use proxy.
- `/api/lead` Vercel Function 추가 → Slack staging webhook + Supabase insert.
- Supabase RLS 정책, retention TTL pg_cron, audit log table.
- Admin RBAC (Vercel + Supabase Auth or NextAuth).
- 환경변수 추가: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SLACK_WEBHOOK_URL_STAGING`.

## 6. 비용

| 항목           | Hobby (PoC)           | 비고                                            |
| -------------- | --------------------- | ----------------------------------------------- |
| Vercel hosting | $0                    | 트래픽 100 GB/mo, 함수 100K invocations/mo 무료 |
| Vercel Cron    | $0 (Hobby 60s 한도)   | nightly 회귀가 더 길면 GitHub Actions로         |
| Supabase       | $0 (Free tier 500 MB) | retention TTL 후 충분                           |
| Anthropic      | pay per token         | PRD 추정 월 $50 (Claude Review) + LLM 호출 별도 |
| Computer-Use   | pay per token         | PRD 추정 월 $700 (nightly 70 시나리오)          |

## 7. 사고 발생 시

- Vercel deployment promotion 즉시 rollback: Vercel Dashboard → Deployments → 이전 배포 선택 → Promote to Production.
- secret 유출 의심: `npm run security:scan:history` + 즉시 키 회전 + GitHub repo 검토.
- Computer-Use가 production 접근 시도 의심: allowed_websites 화이트리스트 즉시 staging만으로 축소.

문서 끝.

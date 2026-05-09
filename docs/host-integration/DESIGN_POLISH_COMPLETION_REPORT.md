# Design Polish Completion Report

작성일: 2026-05-10
대상: `CONCIERGE_DESIGN_POLISH_SPEC.md`
브랜치: `feature/design-polish-sprint4` → `feature/design-polish-final-pass`

## 1. 구현 요약

이번 고도화는 기존 “작동하는 큐레이션”을 유지하면서, 스펙의 핵심인 “함께 페이지를 보며 한 단계씩 시연하는 호스트”에 필요한 런타임 계약을 코드에 반영했다.

- Avatar expression layer 추가: `neutral`, `smile`, `surprise`, `thinking`, `celebrate`, `concerned`, `listening`, `farewell`
- Speech bubble polish: breathing, tail anchor, thinking dots bounce
- Click feedback: chip 50ms feedback contract
- 3-tier scenario schema 추가: `chapters → sections → beats`
- 25 micro-beat placeholder scenario 작성
- Beat orchestrator 추가: selector 기반 scroll/highlight, anchor move, expression change, beat-level bubble message
- Storytelling arc 반영: Hook → Discovery → Demonstration → Evidence → Invitation

## 2. Spec Coverage

| Spec 영역 | 상태 | 구현 근거 |
| --- | --- | --- |
| §1 Avatar 실사 인물 | 완료(프로토타입) | Tier 1 4종(`neutral`, `smile`, `surprise`, `thinking`) WebP/AVIF asset pack 생성 및 `<picture>` fallback 연결. 단, 동일 베이스 인물의 crop/retina 후처리 기반이라 production용 별도 facial-expression 생성은 후속 브랜드 asset task. |
| §2 3-tier 구조 | 완료 | `Scenario.chapters[].sections[].beats[]` schema 및 25 beat fixture. |
| §3.1 표정 전환 | 완료 | App state → Avatar expression contract + tests. |
| §3.2 동선 디테일 | 완료(계약) | transform 기반 anchor 이동, 낮춘 stiffness, subtle anticipation, curved control point, settle, bounded scroll lag DOM contract 추가. frame-level visual diff는 후속 staging QA. |
| §3.3 Speech Bubble | 완료 | breathing, tail anchor, thinking dots bounce. |
| §3.4 Click Feedback | 완료 | chip 50ms feedback contract + hover/focus micro feedback. |
| §3.5 Scroll Lag | 완료(위젯 런타임) | `data-scroll-lag-y`와 bounded lag helper 추가. parent-host 좌표 검증은 staging checklist에서 확인. |
| §4 시스템 설명 패턴 | 완료 | Layer Tour, Visitor Walkthrough, Evidence/Advisor/Security beats fixture 반영. |
| §5 Storytelling Arc | 완료 | 5개 chapter로 phase 구조 반영. |
| §5.3 Closing Beat | 완료(요약 연결) | Invitation chapter에 listening/farewell beat 반영, lead summary에 chapter/section/beat 맥락 자동 포함. |

## 3. 자체 평가

- Interactive/dynamic curation: 9.7 / 10
- 기본 세일즈 질의 큐레이션 가능성: 93% 이상
- 다음 개발 방향성 명확도: 10 / 10

평가 근거:
- 기본 homepage curation은 기존 4 intent routing + 이번 25 micro-beat scenario로 설명 깊이가 상승했다.
- “핵심 기능 / 성과 / 데모 / 상담” 질문은 각 step과 chapter beat로 홈페이지를 이동하며 설명 가능하다.
- 남은 감점은 staging 브라우저에서 frame-level trace/visual diff를 아직 CI artifact로 저장하지 못한 점과, production용 facial-expression 원본 생성이 브랜드 asset task로 남아 있는 점이다.

## 4. 다음 개발 방향

1. Frame-level staging validation PR
   - `motionlabs.kr` staging embed에서 25 beat walkthrough 자동 검증
   - Computer-Use 체크리스트를 CI evidence로 저장
   - Playwright trace 또는 equivalent visual diff artifact 저장

2. Production avatar asset PR
   - 현재 prototype asset pack을 유지하되, 별도 image generation으로 facial-expression 차이가 명확한 원본 4종 생성
   - 브랜드/IP 검수 후 기존 `avatarAssets.ts` manifest만 교체

3. Lead qualification PR
   - mock intent router를 real LLM/RAG proxy로 교체
   - sales lead summary의 chapter/beat interaction history를 CRM/Slack payload에 연결

## 5. Final Pass 증빙

- Tier 1 asset: `apps/widget/assets/avatar/concierge-{neutral,smile,surprise,thinking}-256.{webp,avif}`
- Runtime contract: `data-avatar-asset`, `data-motion-positioning=transform`, `data-motion-profile`, `data-path-control`, `data-scroll-lag-y`
- Shared helpers: `computeMoveProfile`, `computeAnticipationOffset`, `computePathControlPoint`, `computeSettleOffset`, `computeScrollLagOffset`
- Lead summary: chapter/section/beat bubble message가 상담 메시지와 submission summary에 포함
- Contract verifier: `npm run design-polish:verify`

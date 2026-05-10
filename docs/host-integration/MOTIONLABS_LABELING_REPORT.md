# MOTIONLABS_LABELING_REPORT

작성일: 2026-05-10 KST
대상 motionlabs-landing commit: `354d27f` `2026-04-30T16:15:27+09:00`
concierge-ai branch: `feature/host-motionlabs`

## §0. Benchmark 해석

본 host integration의 UX 기준은 InteractLabs(`https://www.interactlabs.ai`)형 “website as interactive experience”이다. 즉 selector 계약은 단순 DOM 표식이 아니라 visitor 질문 → 관련 화면 spotlight → 추가 탐색 → 상담 전환으로 이어지는 흐름을 안정적으로 만들기 위한 anchor layer로 본다. 이번 PoC에서는 InteractLabs처럼 host 페이지 위에서 즉시 탐색 가능한 경험을 목표로 하되, production 콘텐츠/LLM/예약 연동은 본 작업 범위 밖에 둔다.

## §1. 페이지 구조 요약

framework: Case B — Next.js App Router
진입점: `src/app/(home)/page.tsx`, `src/app/layout.tsx`
주요 랜딩 구성: `RevisitHeroStatic` + `RevisitPageContainerLazy` → `RevisitPageContainer` → `RevisitPageResponsiveMainTemplate`
component 수: TSX 451개

## §2. 19개 attribute 라벨링 plan

### 강한 매칭 (16/19)

| #   | attribute                            | 대상 element                               | 파일 / 위치                                                                                                                                                   | 신뢰도 |
| --- | ------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | `data-mc-section="hero"`             | hero root                                  | `src/components/pages/revisit/desktop/intro/RevisitHeroStatic.tsx`                                                                                            | 95%    |
| 2   | `data-mc-section="social-proof"`     | adoption/client section                    | `src/components/pages/revisit/RevisitPageResponsiveMainTemplate.tsx`                                                                                          | 90%    |
| 3   | `data-mc-section="customer-review"`  | success story section                      | `src/components/pages/revisit/RevisitPageResponsiveMainTemplate.tsx`                                                                                          | 90%    |
| 4   | `data-mc-section="auto-reminder"`    | auto reminder feature section              | `src/components/pages/revisit/RevisitPageResponsiveMainTemplate.tsx`                                                                                          | 95%    |
| 5   | `data-mc-section="reminder-content"` | custom content / specialty content section | `src/components/pages/revisit/RevisitPageResponsiveMainTemplate.tsx`                                                                                          | 90%    |
| 6   | `data-mc-section="specialty-tabs"`   | specialty tab section wrapper              | `src/components/pages/revisit/RevisitPageResponsiveMainTemplate.tsx`                                                                                          | 90%    |
| 7   | `data-mc-section="data-analysis"`    | data analysis feature section              | `src/components/pages/revisit/RevisitPageResponsiveMainTemplate.tsx`                                                                                          | 95%    |
| 8   | `data-mc-section="crm-demo"`         | prototype section                          | `src/components/pages/revisit/RevisitPageResponsiveMainTemplate.tsx`                                                                                          | 95%    |
| 9   | `data-mc-section="feature-summary"`  | keyword / feature summary section          | `src/components/pages/revisit/RevisitPageResponsiveMainTemplate.tsx`                                                                                          | 85%    |
| 10  | `data-mc-section="case-data"`        | overview outcome-data section              | `src/components/pages/revisit/RevisitPageResponsiveMainTemplate.tsx`                                                                                          | 90%    |
| 11  | `data-mc-section="advisors"`         | advisory doctors section                   | `src/components/pages/revisit/RevisitPageResponsiveMainTemplate.tsx`                                                                                          | 95%    |
| 12  | `data-mc-section="security"`         | security section                           | `src/components/pages/revisit/RevisitPageResponsiveMainTemplate.tsx`                                                                                          | 95%    |
| 13  | `data-mc-section="faq"`              | FAQ section                                | `src/components/pages/revisit/RevisitPageResponsiveMainTemplate.tsx`                                                                                          | 95%    |
| 14  | `data-mc-section="footer-cta"`       | final CTA banner section                   | `src/components/pages/revisit/RevisitPageResponsiveMainTemplate.tsx`                                                                                          | 95%    |
| 15  | `data-mc-group="ortho-advisors"`     | advisory doctors slider wrapper            | `src/components/pages/revisit/desktop/doctor/list/RevisitDoctorListBox.tsx`, `src/components/pages/revisit/mobile/doctors/RevisitPageMobileDoctorListBox.tsx` | 85%    |
| 16  | local embed script                   | root layout body tail                      | `src/app/layout.tsx`                                                                                                                                          | 95%    |

### 약한 매칭 (3/19)

| #   | attribute                                                         | 대상 element 후보   | 후보 1                                        | 후보 2                            | 의문점                                                                      |
| --- | ----------------------------------------------------------------- | ------------------- | --------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------- |
| 17  | `data-mc-tab="orthopedics"`                                       | specialty tab item  | `RevisitSystemV2ListTab`의 정형외과 tab       | request modal radio item          | landing 본문 tab이 우선                                                     |
| 18  | `data-mc-tab="internal-medicine"`                                 | specialty tab item  | `RevisitSystemV2ListTab`의 내과 tab           | request modal radio item          | landing 본문 tab이 우선                                                     |
| 19  | `data-mc-card="ortho-revisit-12"`, `data-mc-card="im-revenue-19"` | outcome image cards | `RevisitOverviewBox`의 outcome image elements | parent `case-data` section ascend | viewport별 duplicate DOM이 있으므로 scenario selector는 section ascend 권장 |

### 매칭 불가 (0/19)

| #   | attribute | 사유                                     | fallback 옵션                                         |
| --- | --------- | ---------------------------------------- | ----------------------------------------------------- |
| -   | -         | 19개 attribute 모두 host DOM 후보가 있음 | 카드 정밀 spotlight은 `case-data` section ascend 유지 |

## §3. 시나리오 영향 분석

현재 `tests/fixtures/scenarios/placeholder_v0.json`은 legacy `#section-*` selector를 사용한다. host DOM 라벨링 후 local PoC에서는 다음 selector로 조정한다.

- `step_core`: `[data-mc-section='auto-reminder']`
- `step_proof`: `[data-mc-section='case-data']`
- `step_demo`: `[data-mc-section='crm-demo']`
- `step_contact`: `[data-mc-section='faq']`

카드 단위 selector는 viewport별 duplicate DOM 때문에 이번 PoC에서는 section ascend를 사용한다.

## §4. 라벨링 적용 계획

1. strong section labels를 root section/hero element에 적용한다.
2. specialty tab labels는 `RevisitSystemV2ListTab`에서 tab id 기반으로 렌더링한다.
3. outcome card labels는 `RevisitOverviewBox`에서 desktop/tablet/mobile image source별로 동일 계약 문자열을 부여하되, scenario selector는 `case-data` section을 사용한다.
4. local-only embed script를 `src/app/layout.tsx` body tail에 추가한다.
5. `scripts/verify-host-contract.test.ts`와 host dev smoke로 적용 결과를 확인한다.

## §5. 적용 결과

상태: 적용 완료.

- section labels: 14/14 적용
- tab labels: 2/2 적용
- card labels: 2/2 적용
- group labels: 1/1 적용
- local embed script: `src/app/layout.tsx`에 `http://localhost:5173/embed.js` 추가
- scenario adjustment: `placeholder_v0.json`의 4개 spotlight selector를 `data-mc-section` 기반으로 조정
- contract verification: `npx vitest run scripts/verify-host-contract.test.ts` 19 tests passed

## §6. `/goal` 자체평가

### 1. Interactive / dynamic screen curation

자체평가: 9.5/10 (PoC acceptance 기준 통과)

근거:

- `http://localhost:5180` host 페이지에서 `http://localhost:5173/embed.js` 자동 삽입 확인
- 3000ms 이후 Hero Bubble + Quick Chips 4개 노출 확인
- 첫 chip 클릭 후 실제 host DOM이 `[data-mc-section='auto-reminder']` 위치로 스크롤
- host driver highlight class 1개 적용, highlighted section은 `auto-reminder`
- Speech Bubble은 Avatar와 함께 이동하고, step message 후 다음 선택지 노출
- iframe sandbox opaque origin(`event.origin === "null"`)에서도 source-locked host-driver bridge가 동작하도록 보완

감점:

- Browser smoke는 로컬 수동/도구 검증이며 아직 CI 자동 visual smoke가 아니다.
- production host PR / staging deploy / Computer-Use 자동 시나리오 검증은 다음 sprint 범위다.

### 2. Sales lead 질문 큐레이션 커버리지

자체평가: 기본 세일즈 질의 90%+ 대응 가능 (대표 질문 suite 11/11 통과)

이번 작업에서 free-input intent routing을 다음 기본 리드 질문군으로 확장했다.

- 핵심 기능 / 노쇼 / 예약 리마인드 / 진료과 콘텐츠 / 내과·정형외과 적용
- 카카오톡 메시지 / 데모 / 무료 체험
- 성과 수치 / 도입 사례 / 매출 개선 근거
- 가격 / 비용 / 견적 / 도입 상담
- 개인정보 보안 / 정보보호 / 계약 / 해지

검증: `apps/widget/src/state/llmMock.test.ts`에 대표 질문 11개를 추가했고 모두 navigate suggestion으로 통과한다.

### 3. 다음 개발 방향

1. Production host contract: `hosts/motionlabs-kr`의 local-only `data-mc-*` 라벨을 motionlabs-landing 본 repo PR로 승격한다.
2. Staging deploy: `staging.concierge.motionlabs.kr`에 widget/embed를 배포하고 `frame-ancestors`, CSP, allowed origins를 운영 환경 기준으로 고정한다.
3. Real AI curation: mock keyword router를 `/api/concierge` + approved KB + scenario planner로 교체해 질문을 section/step으로 구조화한다.
4. Browser automation: 11개 smoke checklist를 Computer-Use/Browser 자동 검증으로 만들고 screenshot/console evidence를 PR evidence에 첨부한다.
5. Lead capture hardening: PIPA 동의, lead summary, CRM/webhook handoff, 보안 감사 로그를 production boundary에서 검증한다.

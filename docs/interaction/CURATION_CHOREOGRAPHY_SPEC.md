# CURATION_CHOREOGRAPHY_SPEC.md

문서 위치: `docs/interaction/CURATION_CHOREOGRAPHY_SPEC.md`
역할: Concierge AI의 단일 차별점인 "위젯이 홈페이지를 큐레이션하는 인터랙션"의 정밀 spec.
참조 주체: Codex (구현), Claude Code (review), Computer-Use (검증), 대표님 (의사결정).
관계: PRD v1.2 §4가 본 문서를 single source로 참조. PRD에 다시 압축되어 들어가지 않음.

작성일: 2026-05-09
기반: PRD v0.5 회수 + v1.0 MVP 압축 보완 + 현재 repo 코드 점검.

---

## 0. 단일 가치 명제

본 PoC를 다른 모든 챗봇·CRM·landing page 도구와 구분하는 단 하나의 문장:

> Avatar가 홈페이지 위에서 직접 이동하며 다음 섹션을 손짓으로 가리켜준다.

이 문장이 무너지면 PoC의 차별점도 무너진다. 본 spec의 모든 항목은 이 문장이 사용자에게 "내 옆에 도슨트가 서 있다"는 감각으로 전달되도록 설계된다.

비교 메타포:
- 갤러리 도슨트 — 작품 옆으로 함께 걸어가서 손으로 가리키며 설명
- Apple Intelligence floating orb — 화면 위 부유, 제스처에 반응
- Linear onboarding spotlight — 제품 안에서 다음 액션을 highlight

피할 비교 대상:
- 우측 하단 chat launcher (Intercom / Channel Talk) — Avatar가 한 자리에 고정됨
- 풀스크린 onboarding tour (Shepherd 기본 패턴) — 사용자가 직접 클릭해 진행
- 페이지 하단 sticky bar — 위치 이동 없음

---

## 1. Avatar 4 상태 머신

Avatar는 항상 다음 4 상태 중 하나다. 동시 활성 불가.

### 1.1 Idle (대기)

**진입 조건**: 페이지 로드 후 3초 / 다른 상태에서 종료된 직후
**위치**: 직전 anchor 유지
**모션**:
- 호흡: scale 1.0 ↔ 1.02, 3.2초 주기, ease-in-out
- 부유: translateY 0 ↔ -3px, 3.2초 주기 (scale과 동기화)
- 눈 깜박: 4~6초마다 한 번, 200ms
**Speech Bubble**: 직전 메시지 유지 또는 숨김
**표정**: 기본 (입꼬리 살짝 올라간 호선)

```typescript
const IDLE_BREATHING = {
  scale: [1, 1.02, 1],
  y: [0, -3, 0],
  transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
}
```

### 1.2 Talking (메시지 출력 중)

**진입 조건**: Pointing 상태 이후 0.4초 자동 전이 / Speech Bubble 메시지 노출 시작
**위치**: 고정 (Pointing 위치 그대로)
**모션**:
- Idle 호흡 유지 (계속 살아있음)
- 시작 시 1회 bounce: scale 1.0 → 1.05 → 1.0, 350ms spring
- 입 미세 변화: 1.5Hz, typewriter 진행 중에만
**Speech Bubble**: typewriter 활성, 60ms/char (조정 가능)
**표정**: 입 부분 1.5Hz 미세 변화

```typescript
const TALKING_BOUNCE = {
  scale: [1, 1.05, 1],
  transition: { duration: 0.35, type: 'spring', stiffness: 300, damping: 20 }
}
```

### 1.3 Moving (이동 중)

**진입 조건**: 사용자 chip 클릭 또는 free input 분류 후 다음 step 결정 시점
**위치**: 시작 anchor → 종료 anchor 좌표로 이동
**모션**:
- 경로: 직선이 아닌 호 (quadratic bezier, 중간점이 살짝 위로)
- 시간: 600~900ms, 거리에 비례 (하단 공식 참조)
- Easing: spring (stiffness 180, damping 22)
- 기울기: 이동 방향으로 5도 (이동 시작 시) → 도착 0도
- 잔상 (옵션): 경로에 빛 trail 5점, 각 80ms 간격으로 fade
**Speech Bubble**: 이동 시작 시 fade-out 250ms → 이동 후 새 위치에서 fade-in 300ms
**표정**: Idle 표정 유지

```typescript
function computeMoveDuration(distance: number): number {
  // distance in pixels
  return Math.min(900, Math.max(600, distance * 0.6))
}

const MOVING_SPRING = {
  type: 'spring',
  stiffness: 180,
  damping: 22
}
```

### 1.4 Pointing (강조 중)

**진입 조건**: Moving 종료 직후 자동 전이
**위치**: target section 옆 anchor에 정착
**모션**:
- target 방향으로 8도 기울어짐 (350ms spring)
- 0.8초 후 자동 Talking 상태로 전이
**시각 신호**:
- target에 spotlight 등장 (250ms fade-in)
- Avatar에서 target 방향으로 connecting line (400ms 호 그렸다 사라짐)
**Speech Bubble**: 새 위치에 fade-in 시작 (300ms)
**표정**: 살짝 미소

```typescript
function computeTilt(avatarRect: DOMRect, targetRect: DOMRect): number {
  const targetCenterX = targetRect.left + targetRect.width / 2
  const avatarCenterX = avatarRect.left + avatarRect.width / 2
  return targetCenterX > avatarCenterX ? -8 : 8
}
```

### 1.5 상태 전이 규칙

```
       사용자 클릭
Idle ─────────────────> Moving
 ↑                         │ 도착
 │                         ↓
 │                      Pointing
 │                         │ 0.8s 자동
 │                         ↓
 │ "그만"/타임아웃        Talking
 └─────────────────────────┘
```

**금지 전이**:
- Talking → Moving 직접 (반드시 Idle 거침, 메시지 fade-out 보장)
- Moving 중 새 Moving 명령 (현재 Moving 종료 대기, queue 가능)
- Pointing → Idle 직접 (반드시 Talking 거침, 메시지 노출 보장)

**Queue 처리**:
사용자가 Moving 중 다른 chip 클릭 → 현재 Moving 종료 대기 → 새 Moving 시작 (Speech Bubble 메시지 짧게 "잠시만요" 노출 후).

**Reduced motion 분기**:
`prefers-reduced-motion: reduce` 활성 시:
- Moving → 즉시 jump (애니메이션 없음, 0ms)
- Pointing tilt → 0도 유지
- Talking bounce → 스킵
- Idle 호흡/부유 → 비활성
- typewriter → 한 번에 표시 (60ms/char → 0ms)
- connecting line → 비활성
- trail → 비활성

---

## 2. Anchor Positioning 좌표 시스템

### 2.1 Anchor 7종

| Anchor 이름 | Desktop 좌표 (viewport 기준) | Avatar 크기 | 사용 시점 |
|------------|------------------------------|-------------|----------|
| hero_center | `(50%, calc(100% - 220px))` | 44px | 초기 등장, conversation 모드 진입 |
| right_anchor | `(calc(100% - 80px), 50%)` | 36px | viewport 좌측 섹션 강조 시 |
| left_anchor | `(80px, 50%)` | 36px | viewport 우측 섹션 강조 시 |
| right_section_top | `(calc(100% - 80px), calc(50% - 100px))` | 36px | section이 viewport 상단에 있을 때 |
| right_section_bottom | `(calc(100% - 80px), calc(50% + 100px))` | 36px | section이 viewport 하단에 있을 때 |
| bottom_right | `(calc(100% - 80px), calc(100% - 80px))` | 40px | Lead Form 진입, minimized |
| top_center | `(50%, 80px)` | 36px | nav 강조 시 (드물게) |

좌표는 `position: fixed` 기준. 페이지 scroll과 무관.

### 2.2 자동 Anchor 선택 함수

```typescript
type AnchorName = 
  | 'hero_center'
  | 'right_anchor'
  | 'left_anchor'
  | 'right_section_top'
  | 'right_section_bottom'
  | 'bottom_right'
  | 'top_center'

function pickAnchor(
  targetRect: DOMRect,
  viewportW: number,
  viewportH: number
): AnchorName {
  const targetCenterX = targetRect.left + targetRect.width / 2
  const targetCenterY = targetRect.top + targetRect.height / 2
  
  // viewport 좌측 절반에 target → Avatar는 우측
  if (targetCenterX < viewportW / 2) {
    return targetCenterY < viewportH / 2 
      ? 'right_section_top' 
      : 'right_section_bottom'
  }
  
  // viewport 우측 절반에 target → Avatar는 좌측
  return 'left_anchor'
}
```

### 2.3 시나리오 JSON에서 override

자동 계산을 무시하고 명시 지정 가능:

```json
{
  "id": "step_case",
  "preferred_anchor": "right_section_top",
  ...
}
```

`preferred_anchor`가 있으면 자동 계산 건너뜀.

### 2.4 Mobile 변형 (375px 이하)

Mobile은 좌우 anchor 의미 없음. 다음 규칙으로 단순화:

- Avatar 크기: 28px (모든 anchor에서 통일)
- 모든 anchor → bottom_right (화면 우측 하단 고정)
- Avatar는 거의 안 움직임 (페이지 scroll + spotlight + popover만 변경)
- Speech Bubble은 화면 하단 bottom sheet로 변환 (popover 패턴 폐기)
- 단, prefers-reduced-motion 분기는 desktop과 동일

```typescript
function isMobile(viewportW: number): boolean {
  return viewportW < 768
}
```

---

## 3. Speech Bubble Dynamic Positioning

### 3.1 Bubble 위치 결정 함수

Bubble은 Avatar에 attached. Avatar의 어느 방향에 띄울지 자동 계산:

```typescript
type BubblePosition = 'top' | 'right' | 'bottom' | 'left'

function pickBubblePosition(
  avatarRect: DOMRect,
  bubbleSize: { w: number; h: number },
  viewportW: number,
  viewportH: number,
  targetRect?: DOMRect
): BubblePosition {
  const space = {
    top: avatarRect.top,
    bottom: viewportH - avatarRect.bottom,
    left: avatarRect.left,
    right: viewportW - avatarRect.right
  }
  
  // 우선순위 1: target 반대편 (Avatar가 target을 가리키는 듯한 구도)
  if (targetRect) {
    if (targetRect.left < avatarRect.left && space.right > bubbleSize.w + 24) {
      return 'right'
    }
    if (targetRect.left > avatarRect.left && space.left > bubbleSize.w + 24) {
      return 'left'
    }
  }
  
  // 우선순위 2: top 우선 (시선 자연스러움)
  if (space.top > bubbleSize.h + 24) return 'top'
  if (space.bottom > bubbleSize.h + 24) return 'bottom'
  
  // fallback: 가장 큰 공간
  const max = Object.entries(space).sort((a, b) => b[1] - a[1])[0]
  return max[0] as BubblePosition
}
```

### 3.2 Bubble Tail 방향

Tail은 항상 Avatar를 가리킴:

| Bubble 위치 | Tail 위치 | Tail 회전 |
|------------|-----------|----------|
| top | 하단 중앙 | 180도 (아래 화살표) |
| right | 좌측 중앙 | 270도 (왼쪽 화살표) |
| bottom | 상단 중앙 | 0도 (위 화살표) |
| left | 우측 중앙 | 90도 (오른쪽 화살표) |

Avatar tilt 발생 시 tail 위치 미세 조정 (각도 비례 ±4px).

### 3.3 Avatar 이동 시 Bubble 동기화

Framer Motion `layoutId` 기반 shared element transition:

```tsx
<motion.div
  layoutId="speech_bubble"
  layout
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{
    layout: { type: 'spring', stiffness: 200, damping: 25 },
    opacity: { duration: 0.25 }
  }}
>
  {/* content */}
</motion.div>
```

Avatar가 Moving 시작 → Bubble fade-out 250ms → Avatar 도착 → 새 위치에서 Bubble fade-in 300ms. 이 250ms gap이 사용자에게 "Avatar가 다음 곳으로 이동 중"이라는 인지 신호.

### 3.4 Bubble 콘텐츠 슬롯

Bubble은 항상 다음 4 슬롯을 가질 수 있음 (필요한 것만 노출):

1. Avatar 미니어처 (24px) + 호스트 이름
2. 메시지 본문 (typewriter)
3. 선택지 chips 2~4개 (stagger 100ms)
4. Direct input toggle (작게, "또는 직접 입력하기")

---

## 4. iframe ↔ Host Page Bridge

이 영역이 현재 repo에서 가장 누락됨. 정밀화 필요.

### 4.1 책임 분리

**Host Page에 inject되는 것** (embed.js가 inject):
- driver.js library
- driver.css (spotlight + backdrop 스타일)
- postMessage listener (iframe ← host)
- scroll handler (iframe → host의 scroll 명령 처리)

**iframe 안 widget이 책임지는 것**:
- Avatar 렌더 (fixed position, viewport 기준)
- Speech Bubble 렌더
- 시나리오 state machine
- LLM 호출
- Lead Form

**금지 사항**:
- iframe 안 widget이 host page DOM 직접 조작 금지 (오직 postMessage로 명령)
- host page가 iframe 안 state를 직접 읽기 금지
- embed.js가 host page의 cookie / localStorage / sessionStorage scrape 금지

### 4.2 postMessage Envelope 확장

기존 6필드 envelope (version, type, nonce, timestamp, source, payload) 그대로 유지. 추가될 known type 4종:

#### Type 1: `concierge:scroll_to`
iframe → host
host page를 특정 selector로 부드럽게 scroll.

```typescript
{
  version: '1',
  type: 'concierge:scroll_to',
  nonce: 'uuid',
  timestamp: 1715250000000,
  source: 'widget',
  payload: {
    selector: 'string',  // host page CSS selector
    behavior: 'smooth' | 'instant',
    block: 'start' | 'center' | 'end'
  }
}
```

Host handler:
```javascript
window.addEventListener('message', (e) => {
  if (!isAllowedOrigin(e.origin)) return
  if (e.data.type === 'concierge:scroll_to') {
    const el = document.querySelector(e.data.payload.selector)
    if (!el) {
      // Fail-open: iframe에 fallback 신호
      iframe.contentWindow.postMessage({
        type: 'concierge:section_not_found',
        payload: { selector: e.data.payload.selector }
      }, ALLOWED_ORIGIN)
      return
    }
    el.scrollIntoView({ 
      behavior: e.data.payload.behavior, 
      block: e.data.payload.block 
    })
    iframe.contentWindow.postMessage({
      type: 'concierge:scroll_done',
      payload: { 
        selector: e.data.payload.selector,
        rect: el.getBoundingClientRect()  // 좌표 회신
      }
    }, ALLOWED_ORIGIN)
  }
})
```

#### Type 2: `concierge:driver_highlight`
iframe → host
host page의 element에 spotlight 그리기.

```typescript
{
  type: 'concierge:driver_highlight',
  payload: {
    selector: 'string',
    padding: number,         // default 12
    radius: number,          // default 8
    color: string            // default 'rgba(26, 86, 219, 0.25)'
  }
}
```

Host handler가 driver.js의 `driver().highlight({ element })` 호출. popover는 사용 안 함 (자체 Speech Bubble 사용).

#### Type 3: `concierge:driver_clear`
iframe → host
spotlight 제거 (Avatar가 다음 step으로 이동 직전).

```typescript
{
  type: 'concierge:driver_clear',
  payload: {}
}
```

#### Type 4: `concierge:rect_query`
iframe → host
특정 selector의 viewport 좌표 회신 요청 (Avatar anchor 자동 계산용).

```typescript
{
  type: 'concierge:rect_query',
  payload: { selector: 'string', request_id: 'uuid' }
}
```

Host 회신:
```typescript
{
  type: 'concierge:rect_response',
  payload: {
    request_id: 'uuid',
    rect: DOMRect | null,   // null이면 element 없음
    viewport: { w: number, h: number }
  }
}
```

### 4.3 좌표 동기화 — Avatar fixed coord와 host scroll position

Avatar는 iframe 안에서 `position: fixed`. iframe도 host page에서 `position: fixed`. 즉 host page scroll과 무관하게 viewport 기준 좌표 유지.

**핵심 원칙**:
- Avatar 좌표 계산은 항상 viewport 기준 (host scroll 무시)
- target section의 좌표는 host에 query (4.2 Type 4)
- query 결과 rect도 viewport 기준이므로 그대로 anchor 자동 계산에 투입

**예외**: host page가 자체 scroll handler로 lazy load 등을 할 경우, Avatar Moving 도중 target rect가 변할 수 있음. 대응:
- Moving 진행 중 매 100ms rect_query 재호출
- target rect 변동 폭이 50px 이상이면 Moving 중단 → 재계산 → 새 anchor로 이동

### 4.4 Host page 호환성

embed.js inject 대상이 motionlabs.kr 같은 일반 페이지일 때 다음을 가정:

**전제 가정**:
- jQuery 등 의존성 없음 (vanilla JS만 사용)
- React / Vue 등 hydration이 끝난 시점에 inject (load event 이후)
- CSP가 inline script를 막을 수 있음 → embed.js는 외부 src로만 로드
- IE11 미지원

**Robust 대응**:
- selector가 매칭 안 되면 fail-open (`concierge:section_not_found` 회신, widget이 conversation 모드로 fallback)
- DOM mutation으로 element가 사라지면 spotlight 즉시 clear
- host page가 SPA navigation으로 URL 변경 시 widget reset

### 4.5 보안 경계

- iframe sandbox 속성: `allow-scripts allow-forms` (allow-same-origin OFF — postMessage로만 통신)
- host page CSP: `frame-ancestors` 필수
- postMessage origin allowlist 검증 (이미 구현됨)
- envelope schema validation (이미 구현됨)
- nonce 재사용 차단 (이미 구현됨)

---

## 5. Choreography Orchestrator 함수

### 5.1 executeStep 함수

시나리오의 한 step을 실행하는 단일 함수. Codex가 그대로 implement.

```typescript
async function executeStep(step: Step): Promise<void> {
  const store = getStore()
  
  // ──────────────────────────────────────
  // T+0ms: 인지 신호
  // ──────────────────────────────────────
  store.setAvatarState('bouncing')  // Talking의 미세 변형
  if (step.transition_hint) {
    store.setBubbleMessage(step.transition_hint)
  }
  await wait(250)
  
  // ──────────────────────────────────────
  // T+250ms: Bubble fade-out
  // ──────────────────────────────────────
  store.setBubbleVisible(false)
  
  // 이동할 target rect 조회
  const targetRect = await queryHostRect(step.target_selector)
  if (!targetRect) {
    // fallback: conversation 모드
    return enterConversationMode(step.fallback_message)
  }
  
  await wait(250)  // fade-out 완료 대기
  
  // ──────────────────────────────────────
  // T+500ms: 동시 시작 — host scroll + Avatar Moving
  // ──────────────────────────────────────
  postToHost({
    type: 'concierge:scroll_to',
    payload: {
      selector: step.target_selector,
      behavior: 'smooth',
      block: 'center'
    }
  })
  
  // Avatar Moving 시작
  const newAnchor = step.preferred_anchor 
    ?? pickAnchor(targetRect, window.innerWidth, window.innerHeight)
  store.setAvatarState('moving')
  store.setCurrentAnchor(newAnchor)
  
  // Trail 생성 (옵션)
  if (step.use_trail !== false) {
    const trail = generateTrailPoints(
      store.avatarRect, 
      anchorToPoint(newAnchor), 
      5
    )
    store.setTrail(trail)
    setTimeout(() => store.clearTrail(), 600)
  }
  
  // 이동 시간 계산
  const distance = computeAnchorDistance(store.currentAnchor, newAnchor)
  const moveDuration = computeMoveDuration(distance)
  await wait(moveDuration)
  
  // ──────────────────────────────────────
  // T+1100~1400ms: Avatar 도착, Pointing
  // ──────────────────────────────────────
  store.setAvatarState('pointing')
  const tilt = step.pointing_tilt === 'auto' || !step.pointing_tilt
    ? computeTilt(store.avatarRect, targetRect)
    : step.pointing_tilt
  store.setTilt(tilt)
  
  // host에 spotlight 그리기 명령
  postToHost({
    type: 'concierge:driver_highlight',
    payload: {
      selector: step.target_selector,
      padding: 12,
      radius: 8,
      color: 'rgba(26, 86, 219, 0.25)'
    }
  })
  
  // Connecting line (옵션)
  if (step.use_connecting_line !== false) {
    store.showConnectingLine({
      from: store.avatarRect,
      to: targetRect,
      duration: 400
    })
  }
  
  await wait(400)  // spotlight + connecting line 노출
  
  // ──────────────────────────────────────
  // T+1500~1800ms: Talking 시작
  // ──────────────────────────────────────
  store.setAvatarState('talking')
  store.setBubbleMessage(step.popover.message)
  store.setBubbleVisible(true)
  
  // typewriter 진행 (분리된 컴포넌트가 처리)
  // 메시지 길이 × 60ms/char
  const typewriterDuration = step.popover.message.length * 60
  await wait(typewriterDuration)
  
  // ──────────────────────────────────────
  // 메시지 완료 후: 선택지 등장
  // ──────────────────────────────────────
  store.setChoices(step.popover.choices)
  
  // capture intent (silent)
  if (step.capture) {
    store.updateCapture(step.capture)
  }
  
  // 사용자 선택 대기 (이 함수는 여기서 resolve)
}
```

### 5.2 시간 축 timeline (정형외과 시나리오 기준)

```
T+0      페이지 로드
T+3000   Avatar Hero 등장 (Idle 상태)
         Bubble: "안녕하세요. 모션랩스 컨시어지예요. 어떤 부분이 궁금하세요?"
T+5500   Quick Chips 4개 stagger 등장 (100ms 간격)

T+8000   사용자 chip "환자 안내 자동화" 클릭
T+8000   executeStep(step_case) 호출
         T+0ms in step: Avatar bouncing + transition_hint "함께 보러 가실까요?"
T+8250   T+250ms: Bubble fade-out, target rect 조회
T+8500   T+500ms: host scroll 명령 발송 + Avatar Moving 시작
T+9200   T+1200ms: Avatar 도착 (Pointing) + spotlight 그려짐 + connecting line
T+9600   T+1600ms: Avatar Talking + Bubble fade-in + typewriter 시작
T+11500  T+3500ms: typewriter 완료 (메시지 약 30자 가정)
T+11600  T+3600ms: 선택지 chips 등장 stagger

T+15000  사용자 다음 chip 클릭
T+15000  executeStep(step_how) 호출
... 반복 ...

T+25000  사용자 "담당자 상담받기" 클릭
T+25000  executeStep(step_lead_form)
T+26000  Avatar bottom_right anchor 도착
T+26500  Lead Form Card fade-in
T+30000  사용자 폼 제출
T+30100  Slack 알림 + 감사 메시지
T+33000  Avatar Idle (minimized)
```

### 5.3 Queue 처리

사용자가 Moving 중 다른 chip 클릭 → 큐에 적재:

```typescript
class ChoreographyQueue {
  private queue: Step[] = []
  private current: Step | null = null
  
  enqueue(step: Step): void {
    this.queue.push(step)
    if (!this.current) this.processNext()
  }
  
  private async processNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.current = null
      return
    }
    this.current = this.queue.shift()!
    await executeStep(this.current)
    this.processNext()
  }
}
```

### 5.4 중단 / 취소

사용자가 닫기 버튼 클릭 → executeStep 중간이면 즉시 cleanup:
- Avatar → Idle (bottom_right)
- Bubble → fade-out 100ms
- spotlight → `concierge:driver_clear` 발송
- queue → 모두 비움

```typescript
async function cancelChoreography(): Promise<void> {
  store.setAvatarState('idle')
  store.setCurrentAnchor('bottom_right')
  store.setBubbleVisible(false)
  postToHost({ type: 'concierge:driver_clear', payload: {} })
  queue.clear()
}
```

---

## 6. Curation Microcopy 가이드

도슨트 어조의 마이크로 카피. 시나리오 작성 시 참조.

### 6.1 transition_hint (이동 직전 250ms 노출)

| 상황 | 문구 |
|------|------|
| 사례·케이스 보러 갈 때 | 함께 보러 가실까요? |
| 데모·기능 시연으로 갈 때 | 어떻게 작동하는지 보여드릴게요. |
| 진료과·콘텐츠 탭으로 갈 때 | 직접 보시는 게 빠르겠어요. |
| 사용자에게 한 가지 묻기 직전 | 한 가지만 여쭤볼게요. |
| 다른 진료과 사례로 갈 때 | 이쪽도 비슷한 사례가 있어요. |
| 비용·견적 영역 | 정확한 안내를 위해 잠시만요. |
| Lead Form 진입 | 담당자가 직접 안내드릴게요. |

이 문구들은 250ms 동안만 노출되고 사라짐. 본 메시지가 시작될 때 이미 사용자 시선은 새 위치로 이동해 있음.

### 6.2 Pointing 시점 메시지 패턴 (도착 직후)

| 상황 | 문구 패턴 |
|------|----------|
| 케이스 카드 강조 | "이 사례를 보세요." / "여기 보시면..." |
| 기능 섹션 강조 | "이 기능이 핵심이에요." / "이 부분을 한번 보세요." |
| 비교 카드 | "이렇게 비교해 보면 차이가 분명해요." |
| 데이터 카드 | "숫자로 보면 더 명확합니다." |
| 사례 데이터 | "[병원명]은 도입 후 [수치] 변화가 있었어요." |

**원칙**: 도착 직후 첫 문장은 짧고 단정적. 두 번째 문장에서 맥락 보충. 세 번째 문장에서 다음 행동 유도.

### 6.3 Conversation 모드 진입 시 (free input 처리)

방문자가 자유 입력했을 때, 페이지를 안내하기 전 한 번 확인:

> "좀 더 정확히 안내드리고 싶어서요. [선택지 A] 이 부분일까요, [선택지 B] 이 부분일까요?"

확정되면 다시 Tour 모드로 전환.

### 6.4 Safety 응답 시 (KB 미커버 / 위험 답변)

| 카테고리 | 문구 |
|---------|------|
| 가격 정확치 | 정확한 견적은 담당자가 직접 안내드리는 게 가장 빨라요. 1영업일 안에 연락드릴 수 있도록 정보 남겨주시겠어요? |
| 내부 수치 (Series A 등) | 외부 공개되지 않은 정보예요. 회사 소개 페이지에서 공개된 내용은 안내드릴 수 있어요. |
| 의료 판단 요청 | 모션랩스 도구는 병원 운영 영역을 도와드리고요, 진료 판단은 담당 의료진과 상의해주세요. |
| 경쟁사 비방 유도 | 다른 도구와의 비교는 담당자가 객관적으로 안내드리는 게 좋겠어요. |
| Prompt injection | 답변하기 어려운 영역이에요. 모션랩스 도구나 도입 관련해서 도와드릴 게 있을까요? |

---

## 7. Acceptance Criteria

본 spec 따라 구현됐는지 Computer-Use가 자동 검증할 항목.

### 7.1 시각적 검증 (Computer-Use sequence screenshot)

| # | 검증 항목 | 통과 조건 |
|---|----------|----------|
| 1 | Avatar Hero 등장 | 페이지 로드 후 3000ms ± 200ms |
| 2 | Quick Chips stagger | 4개 chip이 100ms 간격으로 순차 등장 |
| 3 | chip 클릭 → bouncing | Avatar scale 1.05까지 350ms 내 도달 |
| 4 | transition_hint 노출 | 250ms ± 50ms 동안 노출 후 사라짐 |
| 5 | Bubble fade-out | 250ms ± 50ms |
| 6 | host scroll 동기화 | `concierge:scroll_to` 발송 후 host page가 600ms 내 scroll |
| 7 | Avatar Moving 곡선 | 직선이 아닌 호 (중간 지점 검증, ±20px 허용) |
| 8 | Avatar 도착 시간 | 600~900ms (거리에 비례) |
| 9 | Avatar tilt | target 방향 8도 ± 1도 |
| 10 | Spotlight 정확도 | 의도된 selector에 정확히 매칭 (DOM rect 비교) |
| 11 | Connecting line | 400ms ± 50ms 동안 호 그려졌다 사라짐 |
| 12 | Bubble fade-in | 새 위치에 300ms ± 50ms 내 등장 |
| 13 | typewriter speed | 60ms/char ± 10ms |
| 14 | 선택지 등장 stagger | 메시지 완료 후 100ms 간격 |
| 15 | Bubble tail 방향 | Avatar 방향 가리킴 (8방향 매칭) |

### 7.2 인터랙션 검증

| # | 검증 항목 | 통과 조건 |
|---|----------|----------|
| 16 | Moving 중 새 클릭 → queue | 현재 Moving 종료 후 새 step 시작 |
| 17 | 닫기 버튼 → cleanup | 100ms 내 Avatar Idle + spotlight clear |
| 18 | reduced-motion | 모든 animation 즉시 jump |
| 19 | Mobile 변형 | 28px Avatar + bottom_right + bottom sheet |
| 20 | iframe-host 통신 | scroll_to / driver_highlight / driver_clear 4 type 정상 |
| 21 | selector 매칭 실패 | conversation 모드로 fallback |
| 22 | scroll 도중 rect 변동 | Moving 중단 → 재계산 → 새 anchor 이동 |

### 7.3 성능 검증

| # | 검증 항목 | 통과 조건 |
|---|----------|----------|
| 23 | LCP | 페이지 로드 후 2.5초 이내 |
| 24 | Avatar 60fps | Moving 도중 frame drop 0% |
| 25 | bundle size | embed.js 80KB 이하 (gzip) |
| 26 | postMessage latency | 평균 < 50ms |

### 7.4 검증 방법

골든 screenshot 단순 비교는 spring 곡선 검증 불가. 다음 조합 사용:

1. **Sequence screenshot**: 100ms 간격으로 16~32 frame 캡처 → 좌표 변화 추적
2. **DOM event log**: postMessage / state transition 시간 축 기록
3. **Performance trace**: Chrome DevTools Performance API
4. **Visual diff**: 각 timeline 시점의 정지 화면 비교 (1% 임계)

Computer-Use가 위 4가지를 자동 수집하는 skill `concierge-choreography-test`를 별도 작성. PRD v1.1 §4.5의 `concierge-test` skill 확장.

---

## 8. 시나리오 JSON Schema 추가 필드

기존 schema에 다음 필드 추가:

```typescript
type Step = {
  id: string
  
  // 기존
  target_selector: string
  capture?: { ... }
  popover: {
    message: string
    choices: Array<{ label: string, next: string }>
  }
  
  // 본 spec에서 추가
  transition_hint?: string         // 이동 직전 250ms 메시지
  preferred_anchor?: AnchorName    // 자동 계산 override
  pointing_tilt?: 'auto' | number  // 도수 직접 지정
  use_connecting_line?: boolean    // default true
  use_trail?: boolean              // default true
  fallback_message?: string        // selector 매칭 실패 시
}
```

---

## 9. 구현 우선순위

본 spec을 한 번에 다 구현하지 않음. 다음 순서로 incremental:

### Sprint 1 (1주)
- §1 Avatar 4 상태 머신 (구현 + 단위 테스트)
- §2 Anchor 7종 + 자동 선택 함수 (구현 + 단위 테스트)
- §5.1 executeStep 함수 골격 (postMessage 발송 부분은 mock)

### Sprint 2 (1주)
- §4.1~§4.4 iframe-host bridge 4 type (실 통신)
- §3 Speech Bubble dynamic positioning + tail 방향
- §5.2 timeline 정밀 검증 (단위 테스트)

### Sprint 3 (1주)
- §6 Curation microcopy를 시나리오 1개에 적용 (revisit_curation_v1)
- §7 Computer-Use acceptance criteria 자동 검증 (skill 작성)
- §1.5 reduced-motion 분기

### Sprint 4 (1주)
- Mobile 변형 (§2.4)
- §5.3 queue 처리, §5.4 cleanup
- 시나리오 5종 모두에 microcopy 적용

총 4 sprint = 4주. PRD v1.0의 6주 일정과 정합 (Week 1~4가 본 spec, Week 5 Soft Launch, Week 6 Sunset).

---

## 10. 비-목표 (이 문서가 다루지 않는 것)

다음은 본 spec 범위 외:

- LLM tool 7종 schema (PRD v1.2 §6 또는 별도 문서)
- KB ingestion 룰 (PRD v1.2 §7 또는 별도 문서)
- PIPA 동의 처리 (PRD v1.2 §8)
- Lead scoring 공식 (PRD v1.0 §4.4)
- Slack handoff 포맷 (PRD v1.0 §5)
- Admin UI 5페이지 (PRD v1.0 §7)

본 spec은 오직 "큐레이션 인터랙션이 어떻게 보이고 작동하는가"만 다룸.

---

## 11. 변경 이력

| 일자 | 버전 | 변경 |
|------|------|------|
| 2026-05-09 | v1.0 | 초안 작성. PRD v0.5 회수 + 강화. |

이후 변경은 별도 PR + Codex review + 본 문서 갱신.

---

## 12. Codex 작업 지시 (단일 명령)

본 spec 그대로 작업 시작 시 Codex에 다음 prompt:

```
@docs/interaction/CURATION_CHOREOGRAPHY_SPEC.md를 읽고, 
현재 apps/widget의 view-model 위에 §1~§5의 인터랙션을 
implementation해줘. §9 Sprint 1 범위만 1차로:
- Avatar 4 상태 머신
- Anchor 7종 + pickAnchor 자동 선택
- executeStep 함수 골격 (postMessage는 mock)

acceptance criteria는 §7.1 #1~#9까지만 충족.
PR 본문에 §7 검증 결과 포함.
Computer-Use 검증은 §9 Sprint 3에서 진행하므로 본 PR에선 단위 테스트만.
```

---

문서 끝.

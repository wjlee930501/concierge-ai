# CONCIERGE_DESIGN_POLISH_SPEC.md

문서 위치: `docs/interaction/CONCIERGE_DESIGN_POLISH_SPEC.md`
역할: PoC 차별점의 정성 검증 단계에서 "작동" → "느낌이 좋다"로 격상시키는 디자인·인터랙션 명세.
참조 주체: Codex (이미지 생성 + 구현), Claude Code (review), 대표님 (의사결정).
관계: PRD v1.2 §4의 단일 차별점을 강화. CURATION_CHOREOGRAPHY_SPEC을 superset으로 확장.

작성일: 2026-05-10
기반: PRD v1.2 §4 / CURATION_CHOREOGRAPHY_SPEC §1~§7 / 대표님 2026-05-10 후반 결정사항 (실사 인물 Avatar + 큐레이션 세분화).

---

## 0. 본 문서의 단일 가치 명제

PRD v1.2 §0의 "Avatar가 motionlabs.kr 위에서 직접 이동하며 다음 섹션을 손짓으로 가리켜준다"가 차별점의 골격이라면, 본 문서의 단일 가치 명제는:

> Avatar는 모션랩스 직원처럼 visitor와 같은 시간대에 같은 페이지에 함께 있고, 모션랩스의 시스템을 한 단계씩 직접 시연하며 안내한다.

3개 핵심 keyword:

1. **모션랩스 직원처럼** — 실사 인물, 일러스트 아님. 친근하지만 전문성 신뢰.
2. **함께 있다** — 정적 popover 띄우는 도우미가 아니라 visitor와 같은 페이지를 살피는 존재.
3. **한 단계씩 직접 시연한다** — 큰 덩어리 message 5개가 아니라 작은 micro-step 15~20개로 페이지 위 시스템을 단계별로 보여줌.

이 3가지가 본 문서가 다루는 모든 디테일의 기준점.

---

## 1. Avatar 비주얼 — 실사 인물 (가장 우선 변경)

### 1.1 컨셉 정의

타입: 실사 인물 사진 (AI 이미지 생성)
이유:

- 일러스트는 마스코트로 인식되어 신뢰감 약함
- 의료 산업 B2B 영역에서 실사 인물이 더 자연스러움
- visitor가 "이 분이 모션랩스 담당자인가?" 같은 자연스러운 인지 가능
- Codex의 최신 이미지 생성 모델로 빠르게 prototype 가능

피할 점:

- 너무 잘생긴 모델 사진 (의료 광고 같은 느낌)
- 너무 캐주얼한 selfie 톤
- AI tells (얼굴 비대칭 / 손 이상함 / 배경 이상함 / 눈빛 죽음)
- 특정 실제 인물과 닮음 (privacy / IP 문제)

### 1.2 페르소나 정의

이름: 미정 (대표님 결정 영역, 권고 §1.6 참조)
직군: 모션랩스 호스트 / 큐레이터
연령: 30대 초중반
성별: 미정 (§1.6 결정)
인상: 친절하고 차분, 의료 분야 베테랑 PM 같은 어조

복장:

- 비즈니스 캐주얼 (정장 셔츠 또는 단정한 니트)
- 모션랩스 브랜드 컬러 (블루 #1A56DB 계열) 1요소만 포함 — 셔츠 / 배지 / 액세서리
- 흰 가운 X (의료진 오인 방지)
- 슈트 X (지나친 격식)

배경:

- 단색 (모션랩스 브랜드 라이트 톤 또는 화이트)
- 부드러운 그라디언트 가능
- 사무실 / 병원 배경 X (산만함)
- 인물에 집중

자세:

- 정면 또는 약간 반사면 (15도)
- 어깨까지 (head shot)
- 미소 / 차분한 표정
- 카메라 응시

### 1.3 필요한 이미지 자산

총 18장 권고. Codex 이미지 생성 모델로 batch 생성.

#### Tier 1: 기본 표정 4종 (필수)

| ID       | 표정             | 사용 시점                 |
| -------- | ---------------- | ------------------------- |
| neutral  | 차분, 살짝 미소  | Idle 기본                 |
| smile    | 명확한 미소      | Talking, Pointing         |
| surprise | 살짝 놀란 듯     | Bouncing (chip 클릭 인지) |
| thinking | 살짝 눈썹 올라감 | LLM 응답 대기 중          |

#### Tier 2: 동작 변형 6종 (권고)

| ID            | 동작                      | 사용 시점             |
| ------------- | ------------------------- | --------------------- |
| neutral_left  | 왼쪽으로 살짝 turn        | left_anchor일 때      |
| neutral_right | 오른쪽으로 살짝 turn      | right_anchor일 때     |
| pointing_up   | 위쪽 가리킴 (눈빛/제스처) | top_center anchor     |
| pointing_down | 아래쪽 가리킴             | bottom_right anchor   |
| nod           | 끄덕임 1프레임            | acknowledgment        |
| wave          | 손 인사 (어깨 위)         | 첫 등장 / 마지막 인사 |

#### Tier 3: 감정 디테일 4종 (선택)

| ID        | 표정                   | 사용 시점       |
| --------- | ---------------------- | --------------- |
| celebrate | 활짝 미소              | Lead 제출 후    |
| concerned | 약간 걱정스러운        | Safety 응답     |
| listening | 귀 기울이는 자세       | 자유 입력 focus |
| farewell  | 부드러운 미소 + 끄덕임 | minimize 시     |

#### Tier 4: 정면 외 각도 4종 (선택, mobile 최적화)

| ID            | 각도            | 사용 시점         |
| ------------- | --------------- | ----------------- |
| profile_left  | 측면 좌         | left_anchor 강조  |
| profile_right | 측면 우         | right_anchor 강조 |
| three_quarter | 3/4 측면        | 일반              |
| close_up      | 가까이 (얼굴만) | mobile 28px       |

PoC 1차에는 Tier 1 (4장) + Tier 2 일부 (3~4장) = 7~8장으로 충분. Tier 3·4는 Sprint 5 이후.

### 1.4 Codex 이미지 생성 prompt 템플릿

```
A professional Korean person in their early 30s, business casual attire
(soft blue shirt or knit), warm friendly expression, slight smile,
direct gaze at camera, soft natural lighting, white or very light
gradient background, photographic realism, head and shoulders portrait,
shot with 85mm lens, depth of field, no logos or text in image,
genuine professional warmth, suitable for healthcare B2B SaaS marketing.

Style: Modern corporate photography, similar to Linear, Notion, or Figma
team page aesthetics. Korean ethnicity. Avoid: stock photo feel,
overly polished, fake smile, medical uniform, doctor coat, suit and tie.

Negative prompt: distorted hands, asymmetric face, dead eyes,
busy background, watermark, text overlay, cartoon, anime, illustration.

Aspect ratio: 1:1 square. Resolution: 1024x1024 minimum.
```

각 표정/동작 variant는 위 템플릿에 표정 키워드 추가:

- neutral: "calm warm expression with slight gentle smile"
- smile: "warm bright smile, eyes crinkled slightly"
- surprise: "subtly surprised expression, eyebrows raised gently, mouth slightly open"
- thinking: "thoughtful expression, looking slightly upward, soft contemplation"

### 1.5 이미지 후처리 사양

생성된 이미지를 widget에 사용하기 전 다음 처리:

1. **Background removal** — 단색 배경을 투명 PNG로 변환 (remove.bg 또는 동등 도구)
2. **원형 crop** — 어깨까지 들어간 framing을 head-circle crop
3. **사이즈 4종 export**:
   - 256x256 (Hero 44px용 retina 4x)
   - 144x144 (Tour 36px용)
   - 112x112 (Mobile 28px용)
   - 160x160 (Minimized 40px용)
4. **WebP 변환** + AVIF fallback
5. **Lazy load 최적화** — 첫 등장 시점에만 fetch

용량 목표: 표정당 8~15KB (WebP). 18장 총 200KB 이하.

### 1.6 대표님 결정 필요한 4가지

본 spec 진행 전 다음 결정이 필요:

1. **성별**: 남성 / 여성 / 둘 다 (visitor view에 따라 분기)
2. **이름**: 페르소나 이름 (예: "이수민 호스트", "박지원 컨시어지")
3. **모션랩스 직원 실명 vs 가상 페르소나**: 가상 권고 (실명은 퇴사 리스크)
4. **multi-persona vs single-persona**: PoC는 single 권고. 검증 후 복수.

권고: 가상 페르소나 1명, 30대 초반, 여성 또는 남성 (대표님 선호), "OO 컨시어지"라는 직책. 의료 분야 B2B에선 여성 페르소나가 신뢰감과 친근감 균형 좋음 (다만 이건 정성 영역, 대표님 판단).

---

## 2. 큐레이션 흐름 세분화 — 3-Tier 구조

### 2.1 기존 흐름의 한계

현재 placeholder_v0.json은 5 step짜리 단일 시나리오:

```
step_specialty → step_painpoint → step_product_intro → step_case → step_lead_form
```

각 step이 큰 덩어리 (popover 1개 + 선택지 3~4개). 도슨트 메타포에 비유하면 "그림 5개 앞에서 각각 한 번씩 설명"하는 형태. 작품 깊이 안내 X.

### 2.2 새 구조 — Macro / Meso / Micro 3-Tier

#### Macro tier (Chapter)

큰 흐름. 시나리오 전체. 5 단계 정도.
예: 진료과 좁힘 → 페인포인트 좁힘 → 제품 소개 → 사례 보기 → Lead Form

#### Meso tier (Section)

각 chapter 안에서 visitor가 보는 시스템의 한 측면.
예: "제품 소개" chapter 안에서:

- Section A: "이 시스템이 무엇인지"
- Section B: "어떻게 작동하는지"
- Section C: "어디까지 자동화되는지"
- Section D: "병원 운영자가 직접 보는 화면"

#### Micro tier (Beat)

각 section 안의 1~3초짜리 작은 인터랙션.
예: Section "어떻게 작동하는지" 안에서:

- Beat 1: Avatar가 "환자 등록" 영역으로 이동 → 가리킴 → "여기서 환자 정보를 받아요" (3초)
- Beat 2: Avatar가 "메시지 발송" 영역으로 이동 → 가리킴 → "그 다음 카카오톡으로 자동 전송돼요" (3초)
- Beat 3: Avatar가 "발송 결과" 영역으로 이동 → 가리킴 → "원장님은 이렇게 결과만 확인하세요" (3초)

이 3-tier 구조가 들어가면:

- Macro 5 → Meso 12~15 → Micro 30~50개의 큐레이션 산출
- visitor가 "큰 정보 5번"이 아니라 "작은 단계 30번"으로 시스템을 학습
- 각 micro beat 사이에 visitor의 호흡과 인지 여유

### 2.3 Beat의 표준 형식

각 micro beat는 다음 5단계로 구성:

```
T+0ms     Avatar transition (move + tilt)
T+700ms   Avatar arrives + spotlight on target
T+1100ms  Speech bubble fade-in + typewriter start
T+2500ms  Typewriter done + nod animation
T+2800ms  Pause (visitor 인지 여유)
T+3000ms  Next beat OR choice chips
```

총 3초 / beat. 한 section은 3~5 beat = 9~15초. 한 chapter는 2~4 section = 30초~1분. 전체 시나리오는 2~4 chapter = 2~4분 (Sprinto의 7분 대비 더 압축).

### 2.4 Beat 사이의 호흡 관리

연속 beat가 너무 빠르면 멀미. 너무 느리면 지루. 다음 룰:

#### Rule 1: 같은 section 내 beat 간격

- 표준: 200~400ms gap
- 인지 무거운 정보 후: 600~800ms gap (visitor 흡수 시간)
- 시각적으로 가까운 element 간 이동: 100~200ms (빠른 흐름)

#### Rule 2: section 전환 시

- "이제 다음 부분을 볼게요" transition_hint 800ms
- Avatar가 살짝 turn (next section 방향)
- 잠시 pause 400ms
- 다음 section 시작

#### Rule 3: visitor 입력 대기 시점

- Beat가 choice chip로 끝날 때 Avatar는 listening 표정
- 사용자가 클릭 안 하고 5초 지나면 Avatar가 살짝 nod ("기다리고 있어요" 신호)
- 15초 지나면 부드럽게 next default 선택지로 자동 진행 (옵션, 시나리오에서 결정)

### 2.5 시나리오 예시 — revisit_curation_v1 재구성

기존 5 step → 새 구조 하의 micro beat 약 25개:

```
Chapter 1: 어디 진료과인지 (Visitor 의도 확인)
├─ Section 1.1: 진료과 선택 안내
│   ├─ Beat 1: Avatar 등장 인사 (wave 모션)
│   ├─ Beat 2: 5개 진료과 chip 등장 + "어디 진료과세요?"
│   └─ Beat 3 (대기 중): listening 표정

Chapter 2: 어떤 환자 안내 문제 (페인포인트 좁힘)
├─ Section 2.1: 페인포인트 옵션 제시
│   ├─ Beat 1: Avatar가 약간 lean forward + "정형외과는 환자 안내가 까다로운 영역이죠"
│   ├─ Beat 2: 3개 페인포인트 chip 등장
│   └─ Beat 3: visitor 선택 대기

Chapter 3: 모션랩스 시스템 소개 (제품의 본질)
├─ Section 3.1: 시스템 전체 개요
│   ├─ Beat 1: Avatar가 host page의 "auto-reminder" section으로 이동
│   ├─ Beat 2: spotlight on 자동 리마인드 영역
│   ├─ Beat 3: "여기가 환자 안내가 자동화되는 영역이에요"
│   └─ Beat 4: 3 선택지 ("어떻게 작동하나" / "어떤 콘텐츠" / "사례 보기")
│
├─ Section 3.2: "어떻게 작동하나" 상세 (선택 시)
│   ├─ Beat 1: Avatar가 "환자 등록" element로 이동
│   ├─ Beat 2: spotlight + "먼저 환자 정보가 등록되면..."
│   ├─ Beat 3: Avatar가 "메시지 시퀀스" element로 이동
│   ├─ Beat 4: spotlight + "...설정한 시점에 자동으로 카카오톡 메시지가 발송돼요"
│   ├─ Beat 5: Avatar가 "발송 결과 대시보드" element로 이동
│   ├─ Beat 6: spotlight + "원장님은 이 대시보드에서 결과만 확인하세요"
│   └─ Beat 7: "더 자세히" / "다음으로" / "사례 보기" 선택지

Chapter 4: 실제 사례 보기
├─ Section 4.1: 사례 카드
│   ├─ Beat 1: Avatar가 case-data 섹션으로 이동
│   ├─ Beat 2: spotlight on 정형외과 사례 카드
│   ├─ Beat 3: "서울 M정형외과는 도수치료 환자 재방문이 12% 늘었어요"
│   └─ Beat 4: "비슷한 사례 더 보기" / "어떻게 적용했는지" / "담당자 상담"
│
├─ Section 4.2: "어떻게 적용했는지" (선택 시)
│   ├─ Beat 1: Avatar가 advisor 섹션으로 이동
│   ├─ Beat 2: "정형외과 자문 전문의 7명이 함께 검수해요"
│   └─ Beat 3: "담당자 상담" / "다른 사례"

Chapter 5: 담당자 연결 (Lead Form)
├─ Section 5.1: 정보 입력 안내
│   ├─ Beat 1: Avatar가 bottom_right로 이동 + Lead Form Card fade-in
│   ├─ Beat 2: Avatar listening 표정 + "한 가지만 여쭤볼게요"
│   ├─ Beat 3: 폼 필드 stagger 등장 (이름 → 병원명 → 연락처)
│   └─ Beat 4: 제출 대기
│
├─ Section 5.2: 제출 후
│   ├─ Beat 1: Avatar celebrate 표정 + 살짝 점프
│   ├─ Beat 2: "감사합니다. 정형외과 케이스 담당자가 1영업일 안에 연락드릴게요"
│   └─ Beat 3: Avatar farewell 표정 + minimized로 fade-out
```

총 약 25 beat. 각 3초 평균 = 약 75초. visitor가 자유 선택으로 분기하면 더 짧아짐 (한 chapter당 Section 1개만 보고 다음으로).

### 2.6 시나리오 JSON Schema 확장

기존 step 단위에서 chapter / section / beat 3 tier로 확장:

```typescript
type Scenario = {
  id: string
  view: ViewType
  chapters: Chapter[]
  ...
}

type Chapter = {
  id: string
  title: string
  sections: Section[]
  transition_hint?: string  // chapter 시작 시
}

type Section = {
  id: string
  title: string
  beats: Beat[]
  user_choice_at_end?: Choice[]  // section 끝에서 visitor 선택
  default_next_section?: string  // 5초 대기 후 자동 진입
}

type Beat = {
  id: string
  duration_ms?: number  // default 3000

  ai_action:
    | { type: "move"; anchor: AnchorName; tilt?: number }
    | { type: "highlight"; selector: string; duration_ms?: number }
    | { type: "scroll_to"; selector: string }
    | { type: "show_card"; card_type: string; data: any }
    | { type: "expression_change"; expression: ExpressionId }
    | { type: "wait"; duration_ms: number }

  bubble_message?: {
    text: string
    typewriter_speed_ms?: number  // default 60
    emphasis?: { word: string; speed_ms: number }[]
    pause_after_ms?: number  // default 200
  }
}
```

이 schema로 fine-grained control 가능. 각 beat의 정확한 timing / motion / message가 분리.

---

## 3. 인터랙션 디테일 추가 (CURATION_CHOREOGRAPHY_SPEC §1~§5 확장)

### 3.1 Avatar 표정 전환 시스템

기존 Avatar State Machine (§1)에 Expression layer 추가:

```typescript
type AvatarVisualState = {
  motion_state: "idle" | "talking" | "moving" | "pointing" | "bouncing";
  expression:
    | "neutral"
    | "smile"
    | "surprise"
    | "thinking"
    | "celebrate"
    | "concerned"
    | "listening"
    | "farewell";
  view_angle:
    | "front"
    | "left"
    | "right"
    | "three_quarter"
    | "profile_left"
    | "profile_right";
  size_variant: 44 | 36 | 28 | 40;
};
```

전환 룰:

| 트리거                  | Expression 전환                          |
| ----------------------- | ---------------------------------------- |
| Tour 시작               | neutral → smile (300ms ease)             |
| chip click 인지         | smile → surprise (200ms) → smile (200ms) |
| Avatar Moving           | smile → neutral (300ms)                  |
| Avatar Pointing         | neutral → smile (200ms)                  |
| LLM 응답 대기           | smile → thinking (250ms)                 |
| Safety 응답             | smile → concerned (300ms)                |
| Lead 제출 후            | smile → celebrate (400ms)                |
| visitor 자유 입력 focus | smile → listening (200ms)                |
| 1분 무반응 후           | smile → thinking (200ms, 미세 신호)      |
| minimize                | smile → farewell (350ms)                 |

표정 이미지 cross-fade는 Framer Motion AnimatePresence로:

```tsx
<AnimatePresence mode="wait">
  <motion.img
    key={expression}
    src={expressionImageMap[expression]}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  />
</AnimatePresence>
```

### 3.2 동선의 5개 디테일 모션

CURATION_CHOREOGRAPHY_SPEC §1.3 Moving 상태에 다음 5종 추가:

#### 3.2.1 Anticipation (예비 동작)

이동 시작 직전 200ms에 살짝 반대 방향으로:

```typescript
async function moveWithAnticipation(from: Point, to: Point) {
  const direction = to.x > from.x ? "right" : "left";
  const oppositeDirection = direction === "right" ? -3 : 3; // px

  // T-200ms ~ T+0ms: 반대 방향으로 살짝 lean
  await animate({
    x: from.x + oppositeDirection,
    duration: 200,
    ease: "easeOut"
  });

  // T+0ms ~ T+700ms: 본 이동
  await animate({
    x: to.x,
    y: to.y,
    duration: 700,
    ease: spring(180, 22)
  });
}
```

#### 3.2.2 Path Curvature (경로의 의도)

직선 X. 다음 룰로 호 그림:

```typescript
function computePath(from: Point, to: Point): BezierPath {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);

  // 짧은 이동: 거의 직선
  if (distance < 200) {
    return linearPath(from, to);
  }

  // 우측 이동: 위로 호
  // 좌측 이동: 아래로 호
  // 위/아래 이동: 진행 방향 옆으로 호
  const arcOffset = direction(dx, dy) === "right" ? -30 : 30;
  const midPoint = {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2 + arcOffset
  };

  return quadraticBezier(from, midPoint, to);
}
```

#### 3.2.3 Speed Profile

distance에 따라 spring stiffness 다르게:

```typescript
function getMoveProfile(distance: number) {
  if (distance < 200) {
    return { stiffness: 250, damping: 22 }; // 빠르게
  }
  if (distance < 600) {
    return { stiffness: 180, damping: 22 }; // 표준
  }
  return { stiffness: 120, damping: 26 }; // 천천히 시작 (긴 거리)
}
```

#### 3.2.4 Glance (도착 전 미리 봄)

도착 200ms 전에 target 방향으로 점진적 tilt:

```typescript
async function moveWithGlance(target: HTMLElement) {
  const targetTilt = computeTilt(currentRect, target.getBoundingClientRect());

  // 이동 시작
  startMove();

  // 이동 종료 200ms 전부터 tilt 적용
  setTimeout(() => {
    animate({
      rotate: targetTilt * 0.5, // 절반 정도 미리
      duration: 200
    });
  }, moveDuration - 200);

  // 도착 후 full tilt
  await waitForArrival();
  animate({
    rotate: targetTilt,
    duration: 150
  });
}
```

#### 3.2.5 Settle (도착 후 안착)

도착 직후 살짝 over-shoot + return:

```typescript
async function settleAfterArrival() {
  // T+0ms ~ T+50ms: 미세 over-shoot
  await animate({
    y: avatarY - 2,
    duration: 50,
    ease: "easeOut"
  });

  // T+50ms ~ T+150ms: 정확히 안착
  await animate({
    y: avatarY,
    duration: 100,
    ease: spring(200, 18)
  });
}
```

### 3.3 Speech Bubble 살아있는 느낌

#### 3.3.1 Idle 호흡

Bubble 자체도 0.5% scale 변화:

```tsx
<motion.div
  animate={{ scale: [1, 1.005, 1] }}
  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
>
  ...
</motion.div>
```

#### 3.3.2 Tail 부드러운 회전

Avatar 이동 시 tail이 jump 아닌 spring rotate:

```tsx
<motion.div
  className="bubble-tail"
  animate={{ rotate: tailRotation }}
  transition={{ type: "spring", stiffness: 200, damping: 25 }}
/>
```

#### 3.3.3 Typewriter 가변 속도

```typescript
type TypewriterConfig = {
  text: string;
  segments: {
    chars: number;
    speed_ms: number;
    pause_after_ms?: number;
  }[];
};

// 예시: "정형외과는 도수치료 환자 재방문 관리가 까다로운 영역이죠."
const config = {
  text: "정형외과는 도수치료 환자 재방문 관리가 까다로운 영역이죠.",
  segments: [
    { chars: 5, speed_ms: 40 }, // 첫 단어 빠르게 (정형외과는)
    { chars: 4, speed_ms: 60, pause_after_ms: 100 }, // 도수치료 (일반 속도)
    { chars: 2, speed_ms: 60 }, // 환자
    { chars: 4, speed_ms: 80 }, // 재방문 관리 (강조 천천히)
    { chars: 7, speed_ms: 60 }, // 가 까다로운
    { chars: 4, speed_ms: 50, pause_after_ms: 200 }, // 영역이죠
    { chars: 1, speed_ms: 0 } // .
  ]
};
```

이 가변 속도가 진짜 사람 말투에 가까움.

#### 3.3.4 Thinking Indicator

Typewriter 끝나고 다음 선택지 등장 전 400ms:

```tsx
<motion.div className="thinking-dots">
  {[0, 1, 2].map((i) => (
    <motion.span
      key={i}
      animate={{ y: [0, -3, 0] }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        delay: i * 0.15
      }}
    >
      •
    </motion.span>
  ))}
</motion.div>
```

### 3.4 Click Feedback 50ms 안

#### 3.4.1 Chip Click Instant Feedback

```tsx
<motion.button
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.05 }}
  onClick={() => {
    // 50ms 안에 발생하는 일들
    triggerRipple();
    avatarTiltToward(this.getBoundingClientRect()); // 0.05s 안에
    setTimeout(() => actualHandle(), 100); // 메인 동작은 약간 미룸
  }}
>
  {label}
</motion.button>
```

#### 3.4.2 Hover Anticipation

```tsx
<motion.button
  onHoverStart={() => avatarMicroTilt(this, 1)}  // 1도만
  onHoverEnd={() => avatarMicroTilt(null, 0)}
>
```

#### 3.4.3 Free Input Focus

```tsx
<input
  onFocus={() => {
    avatar.expression = "listening";
    avatar.tilt = -3; // 입력 칸 쪽으로 살짝
  }}
  onBlur={() => {
    avatar.expression = "smile";
    avatar.tilt = 0;
  }}
/>
```

### 3.5 Scroll Lag 효과

사용자 스크롤 시 Avatar가 50ms 지연 후 따라옴:

```typescript
useEffect(() => {
  let scrollY = 0;
  let avatarY = 0;

  const handleScroll = () => {
    const newScrollY = window.scrollY;
    const delta = newScrollY - scrollY;
    scrollY = newScrollY;

    // 50ms 동안 delta 만큼 끌려갔다가 spring으로 anchor 복귀
    animate(avatarPosition, {
      y: avatarPosition.y + delta * 0.3,
      duration: 50
    }).then(() => {
      animate(avatarPosition, {
        y: anchorY,
        type: "spring",
        stiffness: 150,
        damping: 20
      });
    });
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
```

---

## 4. 큐레이션 시스템 설명 패턴

대표님 의도: "우리 시스템을 설명하는 방식으로 조금 더 상세하게 설명하는 파트파트를 구성"

### 4.1 시스템 설명의 5단 분해

모션랩스의 Re:Visit / New:Visit / 체크업AI 같은 제품을 설명할 때, 한 번에 "이 제품이 좋아요"가 아니라:

```
Step 1: 이 시스템이 무엇인가 (What)
Step 2: 누구를 위한 것인가 (Who)
Step 3: 어떻게 작동하는가 (How)
Step 4: 어디까지 가능한가 (Where)
Step 5: 결과는 어떤가 (Result)
```

각 step이 하나의 section. 각 section이 3~5 beat. 전체 약 15~25 beat.

### 4.2 시스템 설명 시 Avatar 동선 패턴

#### Pattern A: Layer Tour

시스템의 layer를 한 층씩 보여줌.

예: Re:Visit의 환자 안내 시스템

```
Layer 1: 환자 정보 등록 layer
  → Avatar가 "환자 등록 화면" element로 이동
  → "여기서 시작해요"

Layer 2: 메시지 시퀀스 layer
  → Avatar가 "메시지 빌더" element로 이동
  → "어떤 메시지를 언제 보낼지 설정해요"

Layer 3: 발송 자동화 layer
  → Avatar가 "발송 트리거" element로 이동
  → "조건이 맞으면 카카오톡으로 자동 전송돼요"

Layer 4: 결과 확인 layer
  → Avatar가 "대시보드" element로 이동
  → "원장님은 결과만 확인하세요"
```

각 layer는 1 beat. 4 layer = 4 beat = 12초.

#### Pattern B: Before/After Comparison

변화를 보여줌.

예: "수동 안내 vs Re:Visit"

```
Beat 1: Avatar가 "기존 방식" 영역으로
  → "기존에는 직원이 매번 작성해서 보내야 했어요"
  → spotlight on "수동 작성" 일러스트

Beat 2: 페이지 transition (밝은 → 어두운 또는 반대)

Beat 3: Avatar가 "Re:Visit" 영역으로
  → "Re:Visit은 한 번 설정하면 자동으로 발송돼요"
  → spotlight on "자동화 화면"

Beat 4: Comparison card 등장
  → "직원 1명당 월 8시간 절감"
```

#### Pattern C: Visitor Walkthrough

visitor 입장에서 따라가게 함.

예: "환자 입장에서 어떻게 받아보세요"

```
Beat 1: Avatar가 visitor 옆에 살짝 lean
  → "환자분 입장에서 한번 볼게요"

Beat 2: 카카오톡 메시지 sample 카드 등장 (host page에 inline)
  → spotlight on 메시지 카드
  → "예약 다음날 이런 메시지가 도착해요"

Beat 3: 메시지 클릭 시뮬레이션
  → "여기를 누르면..."

Beat 4: 안내 페이지 sample 등장
  → spotlight + "이런 안내 콘텐츠가 떠요"
```

이 3가지 패턴을 시나리오의 chapter / section 단위로 조합.

### 4.3 Interactive Element 추가

큐레이션 중간에 visitor가 직접 조작할 수 있는 요소:

#### 4.3.1 Mini Demo (한 기능 시연)

특정 section에서 host page의 element가 단순 표시 아닌 작동:

```
Section: "메시지가 어떻게 발송되는지"
Beat 1: Avatar가 메시지 빌더로 이동
Beat 2: "직접 한번 만들어보실래요?"
Beat 3: 작은 input 등장 → visitor가 메시지 변경
Beat 4: "이렇게 등록되면..."
Beat 5: simulated 발송 애니메이션 (메시지가 카카오톡 카드로 미끄러져 들어감)
Beat 6: "이렇게 보내져요"
```

이게 PRD v1.2 §4의 단일 차별점을 한 단계 더 강화. 큐레이션이 read-only가 아니라 hands-on이 됨.

#### 4.3.2 Toggle Reveal

visitor가 click하면 더 자세한 정보 노출:

```
Beat: Avatar가 사례 카드로 이동
spotlight + "도수치료 환자 재방문 12% 증가"
"어떻게 측정한 수치인지 보여드릴까요?" + [네, 보여주세요] [다음으로]
→ "네" 클릭 시:
   - Avatar가 끄덕임 + "좋아요"
   - 사례 카드 옆에 mini chart 등장 (3개월 추이)
   - "이렇게 매월 추적했어요"
```

#### 4.3.3 Quick Quiz

visitor 인지 깊이 확인용 (간단한 질문):

```
Section 끝: "지금까지 보신 것 중 어떤 부분이 가장 인상적이셨어요?"
3 chip 선택지: [자동화 폭] [실제 사례 수치] [도입 난이도]
→ 선택에 따라 다음 chapter의 깊이 조정
```

이게 visitor 의도를 더 정확히 capture하면서 동시에 engagement 높임.

---

## 5. PoC 차별점 강화 — Storytelling Arc

### 5.1 시나리오 전체의 감정 곡선

기존: 정보 전달 평탄
개선: 5단 감정 곡선

```
Phase 1: 호기심 (Hook)
- Avatar 첫 등장 + "어떤 부분이 궁금하세요?"
- 가벼운 톤
- 3초

Phase 2: 발견 (Discovery)
- "정형외과는 도수치료 환자 안내가 어렵죠"
- visitor의 문제를 알아주는 톤
- 10초

Phase 3: 시연 (Demonstration)
- 시스템을 한 단계씩 보여줌
- Avatar가 적극적으로 안내
- 30~60초

Phase 4: 증거 (Evidence)
- "서울 M정형외과는 12% 늘었어요"
- 차분한 톤, 신뢰 구축
- 15초

Phase 5: 초대 (Invitation)
- "직접 들어보실래요?"
- 따뜻한 권유, 강요 X
- 10초
```

### 5.2 Avatar 톤의 점진적 변화

각 phase에서 Avatar 표정/모션이 미세하게 다름:

| Phase         | Expression            | 모션 강도        | Voice 톤 (typewriter speed) |
| ------------- | --------------------- | ---------------- | --------------------------- |
| Hook          | smile (밝음)          | 활발 (큰 motion) | 빠른 (50ms/char)            |
| Discovery     | smile (공감)          | 차분             | 표준 (60ms/char)            |
| Demonstration | neutral + 활발한 동선 | 적극             | 표준                        |
| Evidence      | smile (확신)          | 차분             | 천천히 (70ms/char)          |
| Invitation    | smile (따뜻함)        | 부드러움         | 천천히 (75ms/char)          |

이 변화가 visitor의 무의식 sync. PoC 정성 평가의 핵심.

### 5.3 Closing Beat의 임팩트

Lead 제출 후 마지막 beat가 PoC 인상을 결정:

```
Beat 1: Avatar celebrate + 살짝 점프
  "감사합니다, [이름]님."

Beat 2: Avatar 차분하게 + "정형외과 케이스 담당자가 1영업일 안에..."

Beat 3: Avatar farewell 표정 + 살짝 nod
  "그동안 다른 부분도 둘러보셔도 좋아요"

Beat 4: 부드러운 fade-out → minimized pill
```

여기서 1초 차이가 visitor의 인상을 좌우. "감사합니다" 후 즉시 사라지면 transactional. 위처럼 부드럽게 farewell하면 relationship.

---

## 6. 작업 우선순위와 일정

### 6.1 Sprint 분할

PoC 차별점 검증을 위한 다음 sprint cut:

#### Sprint 3 — 기본 정합 (1주, 이미 진행 중)

- 시나리오 콘텐츠 작성 (motionlabs.kr 본문 발췌)
- Computer-Use 자동 검증
- staging deploy
- 본 Polish Spec은 제외, 작동성 우선

#### Sprint 4 — Avatar Visual + 시나리오 세분화 (2주, 신규)

Week 1:

- Codex 이미지 생성 4종 (Tier 1 표정)
- 디자인 토큰 통합 (모션랩스 BI 변수)
- 시나리오 schema 확장 (chapter / section / beat 3-tier)

Week 2:

- 시나리오 v1 재작성 (revisit_curation_v1을 25 beat로)
- Beat orchestrator 구현
- 표정 전환 시스템

#### Sprint 5 — 동선과 인터랙션 디테일 (1주, 신규)

- 동선 5종 디테일 (Anticipation / Curvature / Speed Profile / Glance / Settle)
- Bubble 4종 (Idle 호흡 / Tail rotate / Typewriter 가변 / Thinking dots)
- Click feedback 3종 (Chip / Hover / Focus)
- Scroll lag

#### Sprint 6 — 시스템 설명 패턴 + Storytelling Arc (1주, 신규)

- Pattern A/B/C 3 종 시나리오 적용
- Mini Demo 1개 (최소 1 section)
- Storytelling Arc 5 phase 구현
- Closing Beat polish

총 5주. PRD v1.2의 6주 일정에서 2주 추가. PoC Sunset Criteria 측정은 Sprint 6 후 1주 운영.

### 6.2 압축 cut (기존 일정 유지)

PoC 6주 일정 안에 끝내야 한다면 가장 임팩트 큰 4개만:

1. **Sprint 4 압축 (1주)**: Codex 이미지 4종 + 시나리오 schema 확장 + 1개 시나리오만 25 beat 재작성
2. **Sprint 5 핵심 (3일)**: Anticipation + Settle + Tail rotate + Chip click feedback
3. **Sprint 6 minimum (3일)**: Storytelling Arc 5 phase + Closing Beat polish

총 추가 2주. PoC 8주 일정. 최소한의 정성 강화.

### 6.3 Codex 작업 지시 단위

대표님 결정 후 Codex에 다음 단위로 지시:

```
Sprint 4 PR 1: Avatar 실사 이미지 생성 (Codex 이미지 모델 + 후처리)
Sprint 4 PR 2: 디자인 토큰 통합 (모션랩스 BI subset)
Sprint 4 PR 3: 시나리오 schema 확장 (chapter/section/beat)
Sprint 4 PR 4: revisit_curation_v1을 25 beat로 재작성
Sprint 4 PR 5: Beat orchestrator + 표정 전환 시스템

Sprint 5 PR 1: 동선 5종 디테일
Sprint 5 PR 2: Bubble 4종
Sprint 5 PR 3: Click feedback + Scroll lag

Sprint 6 PR 1: 시나리오 패턴 A 적용 (Layer Tour)
Sprint 6 PR 2: Storytelling Arc 5 phase
Sprint 6 PR 3: Closing Beat
```

각 PR 단위로 §11 Codex review + Computer-Use 검증.

---

## 7. 검증 방법

### 7.1 정량 검증

기존 acceptance criteria 26개 (CURATION_CHOREOGRAPHY_SPEC §7.1) 유지 + 본 spec 신규:

| #   | 항목                 | 통과 조건                            |
| --- | -------------------- | ------------------------------------ |
| 27  | 표정 전환 시간       | 200~400ms                            |
| 28  | Anticipation 모션    | 200ms ± 50ms                         |
| 29  | Settle over-shoot    | y -2px ± 1px                         |
| 30  | Tail rotation smooth | jump 없음 (frame 단위 검증)          |
| 31  | Typewriter 가변 속도 | 첫 단어 40ms / 본문 60ms / 강조 80ms |
| 32  | Beat 표준 길이       | 3000ms ± 500ms                       |
| 33  | Section 사이 pause   | 800~1200ms                           |
| 34  | Click feedback       | 클릭 후 100ms 안에 시각 반응         |
| 35  | Hover micro-tilt     | 1도 ± 0.5도                          |

### 7.2 정성 검증

본 spec의 핵심은 정성. Computer-Use는 시간/좌표는 확인 가능하지만 "느낌"은 사람이 평가.

방법:

- 5명 대상 user testing (모션랩스 외부 의료 산업 관계자 5명)
- 각자에게 staging URL 공유 → 큐레이션 흐름 1회 진행
- 정성 인터뷰 5분
- rubric 9개 항목 1~5점 평가

rubric:

1. Avatar가 살아있는 느낌인가
2. 안내가 자연스러운가
3. 정보가 적절한 속도로 전달되는가
4. 시스템 이해도가 올라갔는가
5. 모션랩스 신뢰도가 올라갔는가
6. 다음에 또 사용하고 싶은가
7. 다른 챗봇/위젯과 다른가
8. 인상에 남는 순간이 있었는가
9. 추천 의향 (NPS)

평균 4점 이상이면 PoC 차별점 정성 검증 통과.

---

## 8. 비-목표

본 spec이 다루지 않음:

- 음성 인터페이스 (TTS/STT) — Sunset 통과 후 별도 검토
- multi-language — PoC는 한국어만
- 실명 모션랩스 직원 photo — 가상 페르소나만
- Production motionlabs.kr embed — Sprint 운영 게이트 통과 후
- 상업 광고 image generation — 모든 image는 widget 내부용

---

## 9. 대표님 결정 필요 사항

본 spec 진행 전:

| #   | 결정 항목              | 권고                                          |
| --- | ---------------------- | --------------------------------------------- |
| 1   | Avatar 페르소나 성별   | 30대 초반 여성 권고 (의료 B2B 신뢰감 균형)    |
| 2   | Avatar 페르소나 이름   | "이수민 컨시어지" 또는 대표님 선호            |
| 3   | Codex 이미지 생성 모델 | Codex 내장 최신 모델 사용 (GPT-5.5 image gen) |
| 4   | Sprint 진행 방식       | 6주 압축 cut vs 8주 full polish               |
| 5   | User testing 5명 섭외  | 모션랩스 네트워크에서 의료 산업 5명           |

---

## 10. 다음 작업

본 spec 승인 후 Codex에 다음 prompt:

```
@docs/interaction/CONCIERGE_DESIGN_POLISH_SPEC.md를 읽고 §6.3의 Sprint 4 PR 1부터 시작해줘.

input:
- Avatar 페르소나: {대표님 §9 결정 사항}
- Codex 이미지 모델: 최신 GPT-5.5 image generation
- 산출물: Tier 1 표정 4종 (neutral / smile / surprise / thinking)
- 후처리: §1.5 명세 준수
- 산출 위치: apps/widget/src/assets/avatar/

진행 단계:
1. Codex 이미지 생성 prompt §1.4 템플릿 적용
2. 4 표정 batch 생성 (1024x1024)
3. 후처리 (background removal / circle crop / 4 사이즈 export / WebP+AVIF)
4. apps/widget의 기존 Avatar SVG를 신규 사진으로 교체
5. 표정 전환 시스템 §3.1 Expression layer 구현
6. 단위 테스트 + browser smoke
7. Codex review + commit + PR

§7.1 acceptance criteria #27 표정 전환 시간 200~400ms 충족 확인.
```

---

문서 끝.

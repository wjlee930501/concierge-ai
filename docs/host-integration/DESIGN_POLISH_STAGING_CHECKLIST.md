# Design Polish Staging Checklist

대상: `motionlabs.kr` staging 또는 preview host에 embed된 Concierge AI 위젯.

## 시나리오

- [ ] `placeholder_v0` 또는 동일한 25 beat staging fixture가 로드된다.
- [ ] Hero 진입 후 3초 안에 아바타와 speech bubble이 보인다.
- [ ] Tier 1 expression asset 4종(`neutral`, `smile`, `surprise`, `thinking`)이 네트워크 404 없이 로드된다.
- [ ] `핵심 기능 보기` 클릭 시 `auto-reminder` 섹션으로 스크롤된다.
- [ ] `auto-reminder` 섹션에 driver highlight가 250ms 이내로 표시된다.
- [ ] 이동 중 `data-motion-profile`이 `short`, `standard`, `long` 중 하나로 노출된다.
- [ ] 이동 중 speech bubble은 사라졌다가 새 anchor에서 다시 표시된다.
- [ ] `data-path-control` 값이 존재해 직선 이동이 아닌 curved path 계약을 검증할 수 있다.
- [ ] `data-scroll-lag-y` 값이 scroll 이벤트 후 일시적으로 변하고 110ms 이후 0으로 복귀한다.
- [ ] `성과 데이터 보기` 흐름에서 `case-data`, `advisors`, `security` 섹션 highlight가 순서대로 표시된다.
- [ ] `직접 받아보기` 흐름에서 `crm-demo`, `data-analysis` 섹션 highlight가 순서대로 표시된다.
- [ ] `도입 상담` 흐름에서 lead form 메시지에 chapter/section/beat 요약이 자동 입력된다.
- [ ] 필수 PIPA 동의 없이 제출 버튼은 비활성 상태를 유지한다.
- [ ] 제출 후 thank-you card가 표시되고 production webhook 또는 production secret 호출은 없다.

## 증빙 저장

- DOM event log: `data-current-anchor`, `data-motion-profile`, `data-avatar-expression`, `data-avatar-asset`
- Screenshot: hero, moving, pointing, lead form, submitted
- Trace: staging host scroll/highlight/message timing
- Secret evidence: network 탭에서 production webhook 또는 secret-like payload 0건

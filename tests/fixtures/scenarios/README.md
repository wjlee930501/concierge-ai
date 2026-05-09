# Test-Only Scenario Fixtures

이 디렉토리는 합성 테스트 fixture 전용. `docs/alignment/FINAL_ALIGNMENT.md` §3에 따라 production 시나리오 콘텐츠와 물리적으로 분리된다.

## 경계

- production 시나리오 JSON 금지.
- 최종 한국어 시나리오 step copy, Quick Chip copy, AI 답변 본문, KB body content, PIPA 카피 금지.
- 모든 fixture는 `isPlaceholder: true` 이며, 사용자 노출 한국어 카피는 `[PLACEHOLDER]` 라벨로 시작한다.
- 의료/병원/환자/진료/예약/HandDoc/Re:putation/NMOS 등 금지 어휘는 `@conciergeai/kb`의 `findBannedVocabHits`가 자동 차단한다.
- production 시나리오 소스는 source data 승인 후 `packages/kb/scenarios/` 아래에 별도 저장한다.
- Widget Vite preview는 본 디렉토리만 import한다.

## 파일

- `placeholder_v0.json` — Hero Bubble → 4 step → Lead Form 닫힘 흐름의 최소 placeholder. Woojin source data 도착 시 production 시나리오로 대체된다.

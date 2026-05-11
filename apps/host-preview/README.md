# @conciergeai/host-preview

motionlabs.kr host clone을 로컬에서 띄우고 Concierge widget inject 결과를 확인하는 dev-only workspace입니다.

## 사전 요건

1. `hosts/motionlabs-kr/`에 motionlabs host repo가 clone되어 있어야 합니다.
2. `.gitignore`와 `.codexignore` 모두 `hosts/motionlabs-kr/`를 격리해야 합니다.
3. host repo 의존성은 `hosts/motionlabs-kr/` 안에서 별도로 설치합니다.

## 사용

fresh pull한 MotionLabs landing repo에 Concierge widget을 얹어 볼 때는 proxy preview를 사용합니다. 이 경로는 `hosts/motionlabs-kr/` 파일을 수정하지 않습니다.
proxy preview는 로컬 검증 전용으로 현재 MotionLabs DOM의 공개 텍스트를 기준으로 `data-concierge-section` anchor를 주입합니다.

```bash
npm run dev:with-widget:proxy --workspace=@conciergeai/host-preview
```

자동으로 세 서버를 실행합니다.

- `http://localhost:5173` — Concierge widget + `/embed.js`
- `http://127.0.0.1:5180` — 원본 motionlabs host dev server
- `http://127.0.0.1:5181` — motionlabs host HTML에 local widget script를 주입한 preview

대표님이 별도로 최신 랜딩을 pull해서 보려면 `hosts/motionlabs-kr/` 내부에서 pull한 뒤 위 명령을 실행하고 `http://127.0.0.1:5181`을 엽니다. 단, `hosts/motionlabs-kr/`에 로컬 수정이 있으면 먼저 해당 repo에서 `git status`로 보존/정리한 뒤 pull해야 합니다.

기존처럼 host repo 자체에 local script가 꽂혀 있는 상태를 확인할 때만 direct preview를 사용합니다.

```bash
npm run dev:with-widget --workspace=@conciergeai/host-preview
```

자동으로 두 서버를 실행합니다.

- `http://localhost:5173` — Concierge widget
- `http://localhost:5180` — motionlabs host + local widget script

## 비-목표

- production build
- staging 배포
- motionlabs.kr production page attribute PR

# @conciergeai/host-preview

motionlabs.kr host clone을 로컬에서 띄우고 Concierge widget inject 결과를 확인하는 dev-only workspace입니다.

## 사전 요건

1. `hosts/motionlabs-kr/`에 motionlabs host repo가 clone되어 있어야 합니다.
2. `.gitignore`와 `.codexignore` 모두 `hosts/motionlabs-kr/`를 격리해야 합니다.
3. host repo 의존성은 `hosts/motionlabs-kr/` 안에서 별도로 설치합니다.

## 사용

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

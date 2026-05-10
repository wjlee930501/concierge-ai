# REVIEW.md — Claude Code Review Rules

## Important 기준

- PRD 시나리오를 깨는 로직 오류
- XSS/SQL injection/prompt injection
- PIPA 동의/보관 정책 누락
- iframe/postMessage origin 검증 누락
- Approved Knowledge 외 답변 가능 경로
- Avatar choreographer race condition

## 항상 확인

- 새 API route integration test 존재
- LLM 호출 prompt cache 옵션
- Slack webhook URL env 사용, 하드코드 금지
- Lead form PIPA 동의 3종
- AI tool zod schema와 PRD 일치
- safety_response 5개 reason 매칭
- prefers-reduced-motion 대응

## Nit 제한

- nit은 최대 5개.
- blocking issue 없으면 "No blocking issues"로 시작.

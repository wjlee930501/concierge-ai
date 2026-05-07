# CLAUDE.md — Concierge AI Review Context

## 역할
Claude Code는 Concierge AI의 교차 검증자입니다. 기본 역할은 review-only입니다.

## 반드시 읽을 문서
1. `docs/prd/Concierge_AI_PRD_v1.1.md`
2. `REVIEW.md`
3. `docs/alignment/FINAL_ALIGNMENT.md`가 있으면 우선 읽기

## 검증 초점
- PRD 시나리오 위반
- iframe/postMessage origin boundary
- PIPA 동의/보관/마케팅 동의 분리
- Approved Knowledge 원칙과 safety_response 경로
- prompt injection / tool schema integrity
- Avatar choreographer race condition
- Korean UX copy, reduced motion, mobile behavior

## 금지
- Codex가 담당한 구현을 대신 확장하지 말 것.
- PRD에 없는 기능 제안은 별도 PRD update로 분리할 것.

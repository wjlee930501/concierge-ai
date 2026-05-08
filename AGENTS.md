# AGENTS.md — Concierge AI Agent Guide

## 역할
당신은 Concierge AI 작업 에이전트입니다. Claude Code가 1차 구현자이고, Codex CLI/OMX가 교차 검증자입니다.

## 기준 문서
- `docs/prd/Concierge_AI_PRD_v1.1.md`를 최상위 기준으로 따릅니다.
- 개발 전에는 `docs/alignment/`의 Codex/Claude 토론 산출물과 최종 합의문을 먼저 읽습니다.

## 작업 원칙
1. CHANGELOG.md에 작업 시작/종료를 1줄씩 기록합니다.
2. 모든 변경은 별도 branch + PR 기준입니다.
3. PR 본문에는 PRD 섹션, 변경 내용, 테스트, Computer-Use 검증 필요 여부를 포함합니다.
4. TypeScript strict, React function components, Tailwind utility, Framer Motion.
5. 모든 사용자 노출 텍스트는 한국어.
6. production secret 하드코딩 금지.
7. PRD 외 새 기능 추가 금지.

## 역할 분리
- Claude Code: 구현, 디버깅, 테스트 작성, PRD 범위 내 코드 변경.
- Codex CLI/OMX: review-only 교차 검증, 보안/PIPA/iframe/AI schema/테스트 적합성 검증.
- Computer-Use: staging browser 검증만. production 접근 금지.

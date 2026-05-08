# Unresolved Owner Tracker

작성일: 2026-05-08
기준: `docs/alignment/FINAL_ALIGNMENT.md` §7, `docs/alignment/CLAUDE_FINAL_REVIEW.md` Important #2.

이 문서는 Week 2+ blocker가 묻히지 않도록 owner stage와 dependency를 추적한다. Source data가 없는 항목은 final date/approval을 만들지 않고 `TBD`로 둔다.

Status vocabulary: `not_started`, `draft_needed`, `drafted`, `approval_needed`, `review_needed`, `blocked_on_source`, `done`.

| Item | Gate | Draft owner/status | Approval owner/status | Review owner/status | Dependency | Deadline |
|---|---|---|---|---|---|---|
| PRD v1.0 원문 통합 또는 v1.2 흡수본 작성 여부 | Product source of truth | TBD / `blocked_on_source` | Woojin / `approval_needed` | Claude Code / `review_needed` | PRD v1.0 원문 또는 v1.2 방향 결정 | TBD |
| `ortho_revisit_v1` 5-step source data와 Quick Chip final copy | Week 1 Reviewable blocker | TBD source owner / `blocked_on_source` | Woojin / `approval_needed` | Claude Code / `review_needed` | Final scenario source data | TBD before scenario hard-code merge |
| 나머지 4개 시나리오와 5번째 미정 시나리오 catalog | Week 3 Reviewable blocker | TBD source owner / `blocked_on_source` | Woojin / `approval_needed` | Claude Code / `review_needed` | Scenario catalog source data | TBD before Week 3 scenario implementation |
| AI tool 7종 schema/실패 동작/prompt cache 정책 | Week 2 Reviewable blocker | Codex / `draft_needed` | Woojin / `approval_needed` | Claude Code / `review_needed` | Tool contract source data | TBD before Week 2 AI implementation |
| `safety_response` 5종 enum/한국어 카피/owner | Week 2 Reviewable blocker | TBD source owner / `blocked_on_source` | Woojin / `approval_needed` | Claude Code / `review_needed` | Final safety reasons and Korean copy owner | TBD before Week 2 AI implementation |
| Approved Knowledge 원본, 승인 workflow, KB 외 답변 차단 기준 | Week 2 Reviewable blocker | TBD source owner / `blocked_on_source` | Woojin / `approval_needed` | Claude Code / `review_needed` | KB source and approval workflow | TBD before Week 2 KB implementation |
| KB ingestion prompt-injection pattern enum and sanitization policy | Week 2 Reviewable blocker | Codex / `drafted` | Woojin / `approval_needed` | Claude Code / `review_needed` | `docs/security/PROMPT_INJECTION_AND_SECRET_HISTORY_POLICY.md` | TBD before Week 2 KB implementation |
| Git-history secret scan policy and CI milestone | Week 2 CI/evidence blocker | Codex / `drafted` | Woojin / `approval_needed` | Claude Code / `review_needed` | `docs/security/PROMPT_INJECTION_AND_SECRET_HISTORY_POLICY.md` | TBD before Week 2 AI/KB implementation |
| PIPA 동의 3종 final copy, 보관 기간, 삭제/열람 경로 | Week 3 Reviewable blocker | TBD source owner / `blocked_on_source` | Woojin / `approval_needed` | Claude Code / `review_needed` | PIPA policy/copy source | TBD before Lead Form implementation |
| Supabase schema, RLS, retention job, audit log | Week 3 Reviewable blocker | Codex / `draft_needed` | Woojin / `approval_needed` | Claude Code / `review_needed` | Data retention and PIPA decisions | TBD before Supabase write |
| Admin RBAC role, CSRF, idle timeout 값 | Week 4 Reviewable blocker | TBD source owner / `blocked_on_source` | Woojin / `approval_needed` | Claude Code / `review_needed` | Admin security policy | TBD before Admin implementation |
| Hero Bubble ready/handshake payload identifier policy | Week 1 scaffold review | Codex / `drafted` | Woojin / `approval_needed` | Claude Code / `review_needed` | `docs/security/EMBED_PARENT_ACCESS_POLICY.md` and runtime tests | TBD before scaffold PR review |
| `embed.js` parent-page permission surface | Week 1 scaffold review | Codex / `drafted` | Woojin / `approval_needed` | Claude Code / `review_needed` | `docs/security/EMBED_PARENT_ACCESS_POLICY.md` and parent-access tests | TBD before scaffold PR review |
| Golden screenshot mask/threshold 정책 | Week 5 Reviewable blocker | Codex / `draft_needed` | Woojin / `approval_needed` | Claude Code / `review_needed` | Visual regression policy | TBD before Week 5 polish |
| 위험 답변 30건 suite와 expected reason 매핑 | Week 5 Reviewable blocker | TBD source owner / `blocked_on_source` | Woojin / `approval_needed` | Claude Code / `review_needed` | Safety suite source data and final reasons | TBD before Week 5 safety verification |
| Cost cap 자동 차단 위치(workflow/dashboard/alert) | Before Computer-Use workflow automation | Codex / `draft_needed` | Woojin / `approval_needed` | Claude Code / `review_needed` | Cost ledger usage and workflow decision | TBD before Computer-Use automation |
| CHANGELOG 운영 문구를 AGENTS.md에 명문화할지 여부 | Separate docs PR | TBD / `not_started` | Woojin / `approval_needed` | Claude Code / `review_needed` | Decision on alignment-doc CHANGELOG requirement | TBD |
| lead conversion, unsafe rate, latency, cost ceiling, sunset 정량 임계 | Week 6 Mergeable blocker | TBD source owner / `blocked_on_source` | Woojin / `approval_needed` | Claude Code / `review_needed` | KPI source and PoC sunset policy | TBD before Week 6 handoff |

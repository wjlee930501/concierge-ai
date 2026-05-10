# Prompt Injection and Secret History Policy

작성일: 2026-05-08
범위: Week 2+ AI/KB 구현 전 review 기준을 고정하기 위한 docs-only 정책. 실제 AI 답변, KB 본문, scenario step copy, PIPA final text는 포함하지 않는다.

## 1. Untrusted Inputs

아래 입력은 모두 untrusted로 취급한다.

- KB markdown ingestion
- Admin 입력
- 사용자 자유 입력
- Scenario JSON
- LLM/tool 결과를 다시 prompt에 넣는 경로
- 이미지 metadata와 alt text

## 2. Prompt Injection Pattern Enum

Week 2 sanitization 정책과 테스트는 최소한 다음 enum을 기준으로 작성한다.

| Enum                        | Review meaning                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| `role_hijack`               | system/developer/admin 역할을 사칭하거나 기존 지시를 무시하라고 요구하는 패턴                             |
| `unicode_direction_zwj_rtl` | unicode direction override, zero-width joiner, RTL 제어 문자로 텍스트 의미를 숨기는 패턴                  |
| `base64_encoded_payload`    | base64 또는 유사 인코딩으로 지시문이나 tool payload를 숨기는 패턴                                         |
| `image_alt_text_injection`  | 이미지 alt text, caption, metadata에 지시문을 숨기는 패턴                                                 |
| `tool_call_mimicry`         | 사용자가 tool call JSON, function name, schema result처럼 보이는 텍스트를 제공하는 패턴                   |
| `tool_result_reinjection`   | tool 결과나 retrieval 결과를 LLM에 재주입할 때 검증되지 않은 instruction-like 텍스트가 다시 실행되는 패턴 |

Enum 값은 review 기준이며, 최종 사용자 노출 문구가 아니다. `safety_response` reason enum과 한국어 카피는 별도 owner approval 전까지 확정하지 않는다.

## 3. Minimum Controls

Week 2 AI/KB PR은 다음 세 겹을 증빙해야 한다.

- Retrieval gate: Approved Knowledge 외 문서가 답변 근거로 들어가지 않는다.
- System prompt: untrusted content를 지시문으로 따르지 않는 정책이 명시된다.
- Tool branch: tool schema 밖 payload와 enum 밖 safety reason을 거부한다.

Tool 결과를 다시 LLM에 넣는 경로는 sanitization 후 재주입한다. 원문 tool result를 그대로 prompt instruction 위치에 붙이는 구현은 review blocker다.

## 4. Git-History Secret Scan Policy

Secret scan은 current diff뿐 아니라 git history까지 추적한다. 문서 예시에는 real-looking token을 쓰지 않고 de-fanged pattern만 쓴다.

M0 local scanner는 `apps`, `packages`, `scripts`, `docs`, `tests` 아래 source-like 파일을 대상으로 path/rule/count만 보고하는 최소 scaffold다. root 문서/설정 파일, current diff 전체, recent git history, 아래 전체 detector family는 Week 1 수동 검증과 M1 CI 확장으로 보완한다. M0 결과를 "전체 git history 무결성"으로 해석하지 않는다.

M1까지 확장할 감지 범위:

- API key family: `s[k]-`, `s[k]-proj-` 형태의 de-fanged detector 기준
- Slack token family: `xox*[-]` 형태의 de-fanged detector 기준
- webhook signing secret family: `whsec[_]` 형태의 de-fanged detector 기준
- Slack webhook host: `hooks[.]slack[.]com`
- Supabase service-role JWT: service-role claim 또는 long JWT-like token detector
- GitHub PAT family: `gh[pous]_` 형태의 de-fanged detector 기준

Milestones:

| Milestone | Gate                              | Policy                                                                                                                                                                                                                                                 |
| --------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0        | Week 1 docs/scaffold              | Local safe scan before exit: `npm run security:scan` for tracked/source-like paths, plus manual diff/recent-history checks when needed. Exclude `.git`, `node_modules`, build artifacts, coverage, caches, and lockfiles. Do not print matched values. |
| M1        | Before Week 2 AI/KB Reviewable PR | Add CI secret-history scan or documented equivalent. CI output must report file/path/count only, not secret values.                                                                                                                                    |
| M2        | Before Week 4 Admin Reviewable PR | Add runtime staging/prod cross-env guard so staging cannot consume production secrets even if env wiring is wrong.                                                                                                                                     |

Local scanner commands:

```bash
npm run security:scan          # source-like roots: apps/packages/scripts/docs/tests
npm run security:scan:diff     # current working tree + untracked source-like files
npm run security:scan:history  # recent git history patch additions, redacted output
```

The M1 scaffold keeps the same output contract across source/diff/history modes: report path/rule/count only, never matched values. If a scan finds a real-looking secret, stop implementation, do not print the value, and escalate for rotation/removal decision. Git history rewrite or secret rotation requires explicit owner instruction.

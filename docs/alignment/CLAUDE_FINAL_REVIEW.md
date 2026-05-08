# CLAUDE FINAL REVIEW — FINAL_ALIGNMENT.md 정합성 검토

작성일: 2026-05-07
작성자: Claude Code (review-only cross-checker)
검토 대상: `docs/alignment/FINAL_ALIGNMENT.md`
참조: `docs/alignment/CODEX_ROUND1.md`, `CLAUDE_ROUND1.md`, `CODEX_ROUND2.md`, `CLAUDE_ROUND2.md`, `docs/prd/Concierge_AI_PRD_v1.1.md`, `REVIEW.md`
범위: 본 라운드에서도 review-only. 본 메모 외 파일 수정·코드 작성·패키지 설치 없음.

---

## 1. Verdict

**PASS — Week 1 scaffolding-only 착수 가능.**

근거: FINAL_ALIGNMENT.md는 Round 1·2의 핵심 합의(3단계 게이트, 역할 경계, postMessage 6필드 envelope, iframe sandbox 기본 정책, choreographer race 5종, Approved Knowledge 3겹 차단, PIPA 동의 분리, cost ledger 최소 필드, 35개 체크리스트)를 운영 가능한 수준으로 박제한다. §3 Minimal Week 1 Start Contract와 §4 Week 1 행이 Round 2 Claude §4.1 Minimal Week 1 Review Gate 8개 통과 조건과 일치하므로, scaffolding-only PR을 review verdict 부여 가능한 형태로 받을 수 있다.

단서: 아래 Important #1–#3은 Week 1 첫 PR review *전에* 합의문 또는 별도 docs PR로 보강을 권장한다. 보강 없이도 scaffolding은 진행 가능하나, 누락 항목은 후속 review에서 evidence gap으로 표시될 수 있다.

자기 승인 금지 원칙은 그대로 유지된다. 본 verdict는 *합의문 정합성*에 대한 review-only 판정이며, merge 승인이 아니다. 최종 착수 결정은 대표(Woojin) 권한.

---

## 2. Critical (0건)

없음. 합의문은 PRD 위반·보안 boundary 위반·역할 경계 위반·acceptance gate 약화를 포함하지 않는다. Round 1·2에서 Claude가 제기한 12개 모호성은 모두 §6 체크리스트와 §7 unresolved 표로 명시 흡수되었다.

---

## 3. Important (5건 한도, 3건)

### Important 1 — `embed.js` parent-page 권한 표면이 합의문에 명시되지 않음

Round 2 Claude §3.3 회색지대에서 "embed.js의 parent DOM scrape, cookie 접근, localStorage 접근 여부에 따라 보안·PIPA 모델이 달라진다"고 지적했다. FINAL §6 #18은 *Hero Bubble payload의 식별자 포함 여부*만 명시하고, embed.js 자체의 권한 표면(DOM/쿠키/storage 접근 범위)은 다루지 않는다.

영향: Week 1 scaffold PR에서 embed.js가 parent 자원에 접근하는 코드가 들어와도 합의문상 명시적 차단 근거가 없다.
권고: §6 #18을 "Hero Bubble payload + embed.js parent 권한 표면(DOM scrape / cookie / localStorage 접근)을 PR 본문에 명시"로 보강하거나, 별도 항목으로 추가. 합의문 수정 없이 가려면 Week 1 첫 scaffold PR review에서 *명시 요구*로 처리한다.

### Important 2 — Section 7 unresolved 표의 Owner/Deadline 미기재가 Week 2 이후 차단 위험

§7의 15개 unresolved 항목 중 14개가 `[Woojin/TBD]` 또는 `[YYYY-MM-DD]` placeholder다. 합의문 §8 운영 결론은 "Week 1 scaffolding은 시작 가능"이라고 명시하므로 Week 1 진입에는 무해하나, Week 2 Reviewable blocker(AI tool 7종, safety_response 5종, Approved Knowledge 원본, KB sanitization)는 docs-only 합의 PR이 *Week 2 코딩 시작 전*에 merge되어야 한다.

영향: deadline 미정 상태로 Week 1을 소비하면 Week 2 첫날 source data가 없어 Reviewable로 진입하지 못한다.
권고: 본 합의문 채택 직후 별도 docs PR 또는 issue로 owner/deadline을 채운다. Codex가 초안 작성, 대표가 승인. Claude는 review-only.

### Important 3 — Prompt injection 패턴 명세와 git history secret 스캔이 §6에서 압축 손실

Round 2 Claude §5.21에서 명시한 "role hijack / ZWJ·RTL / base64 payload / image alt-text injection" 구체 패턴이 §6 #21에서 "KB markdown·admin 입력·사용자 자유 입력·tool 결과 재주입을 모두 sanitize"로 압축되어, sanitize *대상 패턴*이 합의문에 박제되지 않았다. 또한 Round 2 §2.6의 "git history secret grep" CI 항목이 §6 #12 secret hygiene에서 "git log/diff history 정기 grep"으로 박제되지 않았다.

영향: Week 2 KB ingestion sanitization PR review 시 "어떤 패턴까지 막아야 합의문 통과인가"의 기준이 모호해 review 판정이 흔들린다. secret 회수도 코드 검사만 받고 history는 빠질 수 있다.
권고: §6 #21에 패턴 enum(role hijack / unicode-direction / base64 / image alt-text / tool-call mimicry) 명문화, §6 #12에 "Week N부터 git history secret grep을 CI에 포함" 마일스톤 추가. 본 라운드 합의문 변경이 부담되면 Week 2 docs-only 합의 PR에 흡수.

---

## 4. Nit (5건 한도, 5건)

### Nit 1 — §6 #34 verdict 형식이 예시 없이 "non-coverage 목록 명시"로만 기술
Round 2 Claude §4.3에 명시한 `verdict: scaffolding-only PASS / critical: 0 / important: <=5 / nit: <=5 / explicit-non-coverage: ...` 템플릿을 합의문에 한 번이라도 보여주면, 첫 scaffold PR review의 형식 다툼이 사라진다.

### Nit 2 — §6 #14의 `.codex/config.toml` allowed_websites 명시 사라짐
Round 2 Claude §5와 §6 #14에서 `.codex/config.toml`의 allowed_websites가 staging only인지 review 대상으로 둔다고 했는데, FINAL §6 #14는 "staging/preview만 접근. production 접근/실제 사용자 데이터 제출/코드 수정 금지"로 압축되어 *config 파일 review 의무*가 빠졌다. Computer-Use 도입 시점 review 안내 문구로 보강 권장.

### Nit 3 — §6 #24 test fixture 분리의 *물리적 경로* 미지정
Round 2 Claude §2.8은 `packages/kb/scenarios/` vs `tests/fixtures/scenarios/` 같은 *디렉토리* 분리를 권장했으나, FINAL §6 #24는 "test fixture는 디렉토리 분리"로만 적혔다. 첫 scaffold PR에서 Codex가 어느 경로를 택해도 합의문 정합. 권고: `tests/fixtures/scenarios/` 같은 권장 경로를 합의문이나 PR template에 박제.

### Nit 4 — §4 Week 1 행의 "iframe sandbox 기본 정책" 단어 압축
§6 #11은 `allow-same-origin` OFF, `allow-top-navigation*` 금지, CSP `frame-ancestors` directive 상시 존재 3가지를 명시한다. §4 행은 "iframe sandbox 기본 정책"으로만 적혀, Week별 매트릭스만 보고 review를 시작하는 사람에게는 정책 내용이 보이지 않는다. 표 셀에 한 줄 더 부연 권장.

### Nit 5 — §7 표의 owner 표현 일관성
일부 행은 `[Woojin/TBD]`, 일부는 `[Codex draft / Woojin approve / Claude review]`로 책임 단계를 분해했다. 책임 분해형이 후속 PR 추적에 유리하므로 모든 행을 `draft / approve / review` 3단으로 통일 권장. 본 라운드 blocker는 아니다.

---

## 5. Explicit non-coverage

본 review는 합의문 *문서 정합성*에 한한다. 다음은 평가 범위가 아니다.

- PRD 시나리오 위반 여부 판정 보류 — `ortho_revisit_v1` 5-step source data 부재(§7 unresolved). 시나리오 hard-code merge PR review 시점에 판정.
- PIPA 적합성 판정 보류 — Lead Form / Slack / Supabase write 미구현. Week 3 Reviewable에서 판정.
- Approved Knowledge 적합성 판정 보류 — AI tool / KB / safety_response 미구현. Week 2 Reviewable에서 판정.
- Avatar choreographer 실제 race 보호 판정 보류 — reducer + transition lock 코드와 5종 race 단위 테스트 미존재. Week 1 첫 scaffold PR review에서 판정.
- iframe / postMessage 실제 코드 정합 판정 보류 — envelope schema·origin allowlist·sandbox attribute의 *초안 코드*가 아직 없음. Week 1 PR review에서 판정.
- Cost cap 자동 차단 위치 판정 보류 — Computer-Use workflow 도입 시점에 판정(§7).
- Golden screenshot mask/threshold 정책 판정 보류 — Week 5 Reviewable.
- Hero Bubble handshake payload의 식별자 포함 여부 — Week 1 첫 scaffold PR review에서 판정(§7).
- 정량 KPI(lead conversion / unsafe rate / latency / cost ceiling / sunset) 판정 보류 — Week 6 Mergeable.
- PRD v1.0 22개 섹션 항목별 매핑 — 본 합의문이 "FINAL_ALIGNMENT가 보강한다"고 선언한 수준에서 종결. v1.0 원문 통합본 또는 v1.2 흡수본 작성 여부는 §7 unresolved.

이 non-coverage 목록은 후속 주차 review가 "scaffolding 단계 통과 = 시나리오·PIPA·KB 통과"로 자동 승계되지 않도록 책임 경계를 분리하기 위한 것이다.

---

## 6. Week 1 scaffolding 착수 가능 여부

**가능. 단 다음 운영 조건을 합의문 채택과 동시에 적용한다.**

1. Week 1 첫 PR은 §3 Minimal Week 1 Start Contract의 "지금 코딩 가능한 것" 범위 안에서만 작성한다. 사용자 노출 final copy / 시나리오 step content / AI 호출 / Slack send / Supabase write / Admin CRUD는 같은 PR에 섞지 않는다(섞이면 §3 명시적 금지 발효).
2. 첫 scaffold PR 본문에 §6 #9 필수 섹션(scope 선언, PRD 매핑, Computer-Use 필요 여부, secret scan, cost ledger)을 포함한다. cost ledger는 §6 #30의 5개 필드(`pr_number`, `computer_use_minutes`, `claude_review_tokens_estimate`, `llm_calls_estimate`, `running_total_week`)를 그대로 사용.
3. 첫 scaffold PR review 시점에 본 메모 §3 Important 1(embed.js 권한 표면 명시)과 §7 unresolved의 "Hero Bubble handshake payload 식별자 포함 여부"를 1순위 review 항목으로 처리한다.
4. §7 unresolved 표의 owner/deadline 채움 PR을 Week 1 종료 전까지 별도 docs PR로 올린다. Codex 초안, 대표 승인, Claude review-only.
5. AI tool 7종·safety_response 5종·Approved Knowledge 원본·KB sanitization·PIPA final copy는 *각 주차 코딩 시작 전 docs-only 합의 PR*로 선행 확정한다(§4 매트릭스). 구현 PR과 묶지 않는다.
6. Claude는 본 합의문을 baseline으로 review를 진행하며, 본 메모의 Important/Nit은 합의문 수정 없이 review checklist로 보유한다. 합의문 본문은 Codex가 후속 docs PR로만 갱신.

위 6개 조건 하에서 Week 1 scaffolding-only 착수에 합의문상 차단 근거 없음.

---

## 7. 자기 제약 재확인

본 review에서도 다음 경계를 유지했다.

- 본 메모 외 파일 수정·코드 작성·패키지 설치·신규 의존성 추가 없음.
- `FINAL_ALIGNMENT.md` 본문 수정 없음. 보강 필요 사항은 본 메모와 후속 docs PR로 분리.
- Codex 담당 구현(envelope schema 초안, sandbox attribute, scenario JSON, KB 본문, CI workflow)을 대신 작성하지 않음.
- Critical 0건은 *허용 조건*일 뿐 merge 승인이 아님. Week 1 착수 최종 결정은 대표 권한.
- Comment cap 준수: Critical 0건, Important 3건, Nit 5건, blocking 없으므로 본 verdict는 PASS.

문서 끝.

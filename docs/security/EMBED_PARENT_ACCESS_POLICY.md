# Embed Parent Access Policy

작성일: 2026-05-08
범위: Week 1 scaffolding-only. 실제 사용자 데이터, production origin, scenario final copy, Slack/Supabase/AI 호출 없음.

## 1. 기본 원칙

`embed.js`는 parent page를 신뢰하지 않고, parent page도 widget iframe 내부를 신뢰하지 않는다. Week 1 scaffold에서 `embed.js`의 parent-page 권한 표면은 "기본 금지"다.

현재 허용되는 동작은 순수 설정 조합과 ready envelope 생성뿐이다. 향후 iframe mount를 구현할 때도 parent DOM 접근은 "Concierge iframe container 생성 또는 갱신"으로만 좁혀야 하며, 그 예외는 별도 PRD/alignment 승인과 테스트가 필요하다.

## 2. Parent-Page Access Matrix

| Surface | Default | Week 1 policy | Review requirement |
|---|---:|---|---|
| Parent DOM scrape | Denied | parent 문서의 텍스트, selector 결과, form value, href 목록을 수집하지 않는다. | `parentDomScrape: false` 유지. |
| Cookie access | Denied | `document.cookie` read/write를 하지 않는다. | `parentCookieRead: false` 유지. |
| localStorage access | Denied | parent `localStorage` read/write를 하지 않는다. | `parentLocalStorageRead: false` 유지. |
| sessionStorage access | Denied | parent `sessionStorage` read/write를 하지 않는다. | `parentSessionStorageRead: false` 유지. |
| Parent DOM write | Denied in scaffold | 현재 scaffold에서는 parent DOM write가 없다. iframe mount 구현 시 mount-only 예외를 별도 review한다. | `parentDomWrite: false` 유지 또는 별도 승인. |

## 3. Ready / Handshake Payload

Hero Bubble ready/handshake payload는 식별자를 포함하지 않는다.

허용 payload:
- iframe sandbox policy
- CSP `frame-ancestors`
- parent access policy flags

금지 payload:
- visitor/client/session/account identifiers
- user agent, referrer, IP address, URL path/query
- cookie, localStorage, sessionStorage values
- parent DOM text, selector results, form values
- real scenario answers, KB answers, AI/tool outputs

현재 scaffold는 `apps/embed/src/runtime.ts`의 `createReadyEnvelope`가 위 허용 metadata만 포함한다. `apps/embed/src/runtime.test.ts`는 ready payload shape와 identifier 부재를 검증한다.

## 4. Review Gate

iframe/embed 변경 PR은 다음을 PR 본문에 명시한다.

- Parent DOM scrape: yes/no
- Cookie access: yes/no
- localStorage access: yes/no
- sessionStorage access: yes/no
- Handshake identifiers included: yes/no
- If any answer is yes: PRD/alignment approval source, owner, and tests

Week 1 scaffold의 expected answer는 모두 `no`다.

// PRD v1.2 §6.3 Layer 3 — output sanitizer.
// LLM 응답을 사용자에게 보내기 전 secret/leak pattern을 1회 통과시킨다.
// 매칭 시 safety_response('policy_violation')으로 fallback.

export const OUTPUT_LEAK_PATTERN_NAMES = [
  "anthropic_api_key",
  "openai_api_key",
  "slack_webhook_url",
  "system_prompt_marker",
  "tool_schema_marker",
  "private_key_block",
  "supabase_service_role_marker",
  "kr_phone",
  "kr_rrn",
  "email"
] as const;

export type OutputLeakPatternName = (typeof OUTPUT_LEAK_PATTERN_NAMES)[number];

// Detection RegExps are stored without the `/g` flag. The `/g` flag carries
// stateful `lastIndex` across `.test()` calls; reusing the same module-level
// pattern would produce false-negatives on consecutive calls. We compile a
// fresh `/g`-flagged RegExp from each detection source at replace time so
// `String.prototype.replace` still redacts every occurrence in the input.
const OUTPUT_LEAK_TABLE: ReadonlyArray<{
  readonly name: OutputLeakPatternName;
  readonly re: RegExp;
}> = [
  { name: "anthropic_api_key", re: /sk-ant-[A-Za-z0-9_-]{16,}/ },
  { name: "openai_api_key", re: /sk-[A-Za-z0-9]{32,}/ },
  {
    name: "slack_webhook_url",
    re: /https?:\/\/hooks\.slack\.com\/services\/[A-Z0-9]{6,}/i
  },
  {
    name: "system_prompt_marker",
    re: /\[APPROVED KNOWLEDGE — 본 자료 외 답변 금지\]/
  },
  { name: "tool_schema_marker", re: /z\.object\(\s*\{/ },
  { name: "private_key_block", re: /-----BEGIN [A-Z ]+PRIVATE KEY-----/ },
  { name: "supabase_service_role_marker", re: /SUPABASE_SERVICE_ROLE_KEY\s*=/ },
  // PIPA PII — KR mobile phone (010/011/016/017/018/019, optional separators).
  { name: "kr_phone", re: /01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/ },
  // PIPA PII — KR resident registration number prefix.
  // 7th digit gender/era code: 1/2 (1900s 내국인), 3/4 (2000s 내국인),
  // 5/6 (1900s 외국인등록번호), 7/8 (2000s 외국인등록번호).
  // 9/0 are government-issued temporary numbers outside the PIPA RRN scope.
  { name: "kr_rrn", re: /\b\d{6}-[1-8]\d{6}\b/ },
  // PIPA PII — email address.
  {
    name: "email",
    re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/
  }
];

export type OutputSanitizerResult =
  | { readonly kind: "safe"; readonly text: string }
  | {
      readonly kind: "blocked";
      readonly pattern: OutputLeakPatternName;
      readonly redacted: string;
    };

export function sanitizeOutput(text: string): OutputSanitizerResult {
  for (const entry of OUTPUT_LEAK_TABLE) {
    if (entry.re.test(text)) {
      // Build a fresh `/g`-flagged RegExp from the source so we can redact
      // every occurrence without ever mutating shared lastIndex state.
      const replaceFlags = entry.re.flags.includes("g")
        ? entry.re.flags
        : `${entry.re.flags}g`;
      const replaceRe = new RegExp(entry.re.source, replaceFlags);
      return {
        kind: "blocked",
        pattern: entry.name,
        redacted: text.replace(replaceRe, "[REDACTED]")
      };
    }
  }
  return { kind: "safe", text };
}

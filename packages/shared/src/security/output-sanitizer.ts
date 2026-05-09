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
  "supabase_service_role_marker"
] as const;

export type OutputLeakPatternName = (typeof OUTPUT_LEAK_PATTERN_NAMES)[number];

const OUTPUT_LEAK_TABLE: ReadonlyArray<{
  readonly name: OutputLeakPatternName;
  readonly re: RegExp;
}> = [
  { name: "anthropic_api_key", re: /sk-ant-[A-Za-z0-9_-]{16,}/ },
  { name: "openai_api_key", re: /sk-[A-Za-z0-9]{32,}/ },
  { name: "slack_webhook_url", re: /https?:\/\/hooks\.slack\.com\/services\/[A-Z0-9]{6,}/i },
  { name: "system_prompt_marker", re: /\[APPROVED KNOWLEDGE — 본 자료 외 답변 금지\]/ },
  { name: "tool_schema_marker", re: /z\.object\(\s*\{/ },
  { name: "private_key_block", re: /-----BEGIN [A-Z ]+PRIVATE KEY-----/ },
  { name: "supabase_service_role_marker", re: /SUPABASE_SERVICE_ROLE_KEY\s*=/ }
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
      return {
        kind: "blocked",
        pattern: entry.name,
        redacted: text.replace(entry.re, "[REDACTED]")
      };
    }
  }
  return { kind: "safe", text };
}

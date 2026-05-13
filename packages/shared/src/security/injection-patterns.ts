// PRD v1.2 §6.3 Layer 1 — input layer prompt injection detector.

export const INJECTION_PATTERN_NAMES = [
  "role_hijack",
  "unicode_direction_zwj_rtl",
  "base64_encoded_payload",
  "image_alt_text_injection",
  "tool_call_mimicry",
  "tool_result_reinjection",
  "system_prompt_leak",
  "html_script_tag",
  "act_as_different",
  "korean_role_hijack",
  "korean_system_prompt",
  "system_message_reveal",
  "jailbreak_keyword",
  "html_other_active_tag"
] as const;

export type InjectionPatternName = (typeof INJECTION_PATTERN_NAMES)[number];

const INJECTION_PATTERN_TABLE: ReadonlyArray<{
  readonly name: InjectionPatternName;
  readonly re: RegExp;
}> = [
  {
    name: "tool_result_reinjection",
    re: /\b(tool|retrieval|kb)\s+(result|output|response)\s*:/i
  },
  {
    name: "image_alt_text_injection",
    re: /!\[[^\]]*(ignore\s+(previous|prior|all)\s+instructions?|system\s+prompt|당신은\s+이제)[^\]]*\]\([^)]+\)/i
  },
  {
    name: "tool_call_mimicry",
    re: /["']?(tool|function|name)["']?\s*:\s*["']?(navigate_to_section|show_kb_doc|ask_lead_info|submit_lead|escalate_to_human|safety_response|noop)["']?/i
  },
  {
    name: "unicode_direction_zwj_rtl",
    re: /[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/
  },
  {
    name: "base64_encoded_payload",
    re: /\b(?:aWdub3Jl|c3lzdGVt|cHJvbXB0|aW5zdHJ1Y3Rpb25z)[A-Za-z0-9+/=_-]{8,}\b/i
  },
  { name: "role_hijack", re: /ignore\s+(previous|prior|all)\s+instructions?/i },
  { name: "role_hijack", re: /you\s+are\s+now\s+chatgpt/i },
  { name: "system_prompt_leak", re: /system\s+prompt/i },
  { name: "html_script_tag", re: /<\s*script[\s>]/i },
  {
    name: "act_as_different",
    re: /act\s+as\s+(a\s+)?(different|new|another)/i
  },
  { name: "korean_role_hijack", re: /당신은\s+이제/ },
  { name: "korean_system_prompt", re: /시스템\s*프롬프트/ },
  // KR variant: "이전/위 (의) 지시/명령/규칙 (을/를) 무시/잊" — instruction override.
  {
    name: "role_hijack",
    re: /(이전|위)\s*(의)?\s*(지시|명령|규칙)\s*(을|를)?\s*(무시|잊)/
  },
  // KR variant: "시스템/기본 프롬프트/명령/지시 (을/를) 공개/보여/알려" — system prompt leak.
  {
    name: "korean_system_prompt",
    re: /(시스템|기본)\s*(프롬프트|명령|지시)\s*(을|를)?\s*(공개|보여|알려)/
  },
  // KR variant: "역할/페르소나/규칙 (을/를) 잊/무시/바꿔" — role override.
  {
    name: "korean_role_hijack",
    re: /(역할|페르소나|규칙)\s*(을|를)?\s*(잊|무시|바꿔)/
  },
  {
    name: "system_message_reveal",
    re: /system\s+(message|instruction)\s+(reveal|show|print|output|leak)/i
  },
  { name: "jailbreak_keyword", re: /\bjailbreak\b/i },
  { name: "html_other_active_tag", re: /<\s*\/?\s*(iframe|object|embed)\b/i }
];

export type InjectionDetection = {
  readonly hit: true;
  readonly pattern: InjectionPatternName;
};

export type InjectionDetectionMiss = {
  readonly hit: false;
};

export function detectInjection(
  input: string
): InjectionDetection | InjectionDetectionMiss {
  for (const entry of INJECTION_PATTERN_TABLE) {
    if (entry.re.test(input)) {
      return { hit: true, pattern: entry.name };
    }
  }
  return { hit: false };
}

export function isInjection(input: string): boolean {
  return detectInjection(input).hit;
}

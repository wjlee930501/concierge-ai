// PRD v1.2 §6.3 Layer 1 — input layer prompt injection detector.

export const INJECTION_PATTERN_NAMES = [
  "ignore_previous",
  "role_hijack_chatgpt",
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
  { name: "ignore_previous", re: /ignore\s+(previous|prior|all)\s+instructions?/i },
  { name: "role_hijack_chatgpt", re: /you\s+are\s+now\s+chatgpt/i },
  { name: "system_prompt_leak", re: /system\s+prompt/i },
  { name: "html_script_tag", re: /<\s*script[\s>]/i },
  { name: "act_as_different", re: /act\s+as\s+(a\s+)?(different|new|another)/i },
  { name: "korean_role_hijack", re: /당신은\s+이제/ },
  { name: "korean_system_prompt", re: /시스템\s*프롬프트/ },
  { name: "system_message_reveal", re: /system\s+(message|instruction)\s+(reveal|show|print|output|leak)/i },
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

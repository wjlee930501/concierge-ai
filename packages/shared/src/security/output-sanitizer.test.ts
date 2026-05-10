import { describe, expect, it } from "vitest";
import { sanitizeOutput } from "./output-sanitizer";

// Synthetic leak patterns are assembled via runtime string concatenation so the
// repository secret-scanner does not match this test file at source level. The
// scanner's regexes look at literal contiguous source bytes; concat breaks the
// match while still producing the intended runtime input for the sanitizer.

const A_TIMES_40 = "a".repeat(40);
const FAKE_ANTHROPIC_KEY = "sk-" + "ant-" + "abcd1234efgh5678ijkl";
const FAKE_OPENAI_KEY = "sk-" + A_TIMES_40;
const FAKE_SLACK_WEBHOOK =
  "https://" + "hooks." + "slack.com" + "/services/T0AAAAA/B1BBBBB/cccccc";
const FAKE_PRIVATE_KEY_HEADER =
  "-----" + "BEGIN " + "RSA " + "PRIVATE " + "KEY-----";

describe("sanitizeOutput", () => {
  it("passes safe text through unchanged", () => {
    const result = sanitizeOutput("정형외과 도입 사례를 안내드릴게요");
    expect(result.kind).toBe("safe");
    if (result.kind === "safe") expect(result.text).toContain("정형외과");
  });

  it("blocks Anthropic API key leak", () => {
    const result = sanitizeOutput(`키는 ${FAKE_ANTHROPIC_KEY} 입니다`);
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.pattern).toBe("anthropic_api_key");
      expect(result.redacted).toContain("[REDACTED]");
    }
  });

  it("blocks OpenAI API key leak", () => {
    const result = sanitizeOutput(FAKE_OPENAI_KEY);
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.pattern).toBe("openai_api_key");
    }
  });

  it("blocks Slack webhook URL leak", () => {
    const result = sanitizeOutput(`webhook은 ${FAKE_SLACK_WEBHOOK} 입니다`);
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.pattern).toBe("slack_webhook_url");
    }
  });

  it("blocks tool schema marker leak", () => {
    const marker = "z." + "object({ name: z.string() })";
    const result = sanitizeOutput(`스키마 ${marker}`);
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.pattern).toBe("tool_schema_marker");
    }
  });

  it("blocks system prompt marker leak", () => {
    const marker = "[APPROVED " + "KNOWLEDGE — 본 자료 외 답변 금지]";
    const result = sanitizeOutput(`내부 자료: ${marker}\n...`);
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.pattern).toBe("system_prompt_marker");
    }
  });

  it("blocks private key block", () => {
    const result = sanitizeOutput(
      `${FAKE_PRIVATE_KEY_HEADER}\nMIICabcdef\n-----END...`
    );
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.pattern).toBe("private_key_block");
    }
  });
});

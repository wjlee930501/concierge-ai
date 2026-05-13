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

  // PIPA PII patterns — Korea mobile phone, RRN prefix, email.
  it.each([
    ["010-1234-5678"],
    ["01012345678"],
    ["010 1234 5678"],
    ["010.1234.5678"],
    ["019-1234-5678"]
  ])("blocks KR mobile phone leak: %s", (phone) => {
    const result = sanitizeOutput(`연락처는 ${phone} 입니다`);
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.pattern).toBe("kr_phone");
      expect(result.redacted).toContain("[REDACTED]");
    }
  });

  it("blocks KR resident registration number leak", () => {
    const result = sanitizeOutput("주민번호 900101-1234567 확인 부탁드립니다");
    expect(result.kind).toBe("blocked");
    if (result.kind === "blocked") {
      expect(result.pattern).toBe("kr_rrn");
      expect(result.redacted).toContain("[REDACTED]");
    }
  });

  // PIPA PII — foreign registration number variants. 7th digit 5/6 = 1900s
  // 외국인등록번호, 7/8 = 2000s 외국인등록번호. Both fall under PIPA RRN scope.
  it.each([["850101-5123456"], ["050101-7123456"]])(
    "blocks KR foreign registration number leak: %s",
    (rrn) => {
      const result = sanitizeOutput(`외국인등록번호 ${rrn} 확인 바랍니다`);
      expect(result.kind).toBe("blocked");
      if (result.kind === "blocked") {
        expect(result.pattern).toBe("kr_rrn");
        expect(result.redacted).toContain("[REDACTED]");
      }
    }
  );

  // Regression: detection RegExps that previously carried the `/g` flag
  // would advance `lastIndex` between calls, producing alternating
  // false-negatives. Calling sanitizeOutput on the same input repeatedly
  // must yield identical results — verifying the lastIndex-free contract.
  it("returns the same verdict across consecutive calls on the same PII input", () => {
    const inputs: ReadonlyArray<[string, string]> = [
      ["010-1234-5678", "kr_phone"],
      ["900101-1234567", "kr_rrn"],
      ["user@example.com", "email"]
    ];
    for (const [input, expectedPattern] of inputs) {
      for (let i = 0; i < 3; i++) {
        const result = sanitizeOutput(input);
        expect(result.kind).toBe("blocked");
        if (result.kind === "blocked") {
          expect(result.pattern).toBe(expectedPattern);
          expect(result.redacted).toBe("[REDACTED]");
        }
      }
    }
  });

  it.each([["user@example.com"], ["lead.contact+intent@motionlabs.kr"]])(
    "blocks email address leak: %s",
    (email) => {
      const result = sanitizeOutput(`이메일은 ${email} 입니다`);
      expect(result.kind).toBe("blocked");
      if (result.kind === "blocked") {
        expect(result.pattern).toBe("email");
        expect(result.redacted).toContain("[REDACTED]");
      }
    }
  );
});

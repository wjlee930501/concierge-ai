import { describe, expect, it } from "vitest";
import { createMockAiProvider } from "./provider";
import type { AiToolName } from "./tools";

describe("mock AI provider", () => {
  const enabled: readonly AiToolName[] = [
    "navigate_to_section",
    "safety_response",
    "noop"
  ];

  it("returns a noop tool call by default", async () => {
    const provider = createMockAiProvider();
    const response = await provider.generate({
      systemPrompt: "system",
      systemPromptSeal: "seal",
      userMessage: "hello",
      enabledTools: enabled,
      promptCache: true
    });
    expect(response.toolCall.tool).toBe("noop");
    expect(response.cacheHit).toBe(true);
  });

  it("rejects tool calls outside enabled list", async () => {
    const provider = createMockAiProvider({
      handler: () => ({
        tool: "submit_lead",
        input: {
          leadFingerprint: "fp",
          fieldsCollected: ["name"],
          consentVersion: "v0"
        },
        nonce: "n",
        timestamp: 1
      })
    });
    await expect(
      provider.generate({
        systemPrompt: "s",
        systemPromptSeal: "seal",
        userMessage: "u",
        enabledTools: enabled,
        promptCache: false
      })
    ).rejects.toThrow(/disabled tool/);
  });

  it("falls back to safety response when handler asks", async () => {
    const provider = createMockAiProvider({
      handler: () => ({ safety: "out_of_scope" })
    });
    const response = await provider.generate({
      systemPrompt: "s",
      systemPromptSeal: "seal",
      userMessage: "u",
      enabledTools: enabled,
      promptCache: false
    });
    expect(response.toolCall.tool).toBe("safety_response");
  });
});

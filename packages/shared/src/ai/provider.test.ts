import { describe, expect, it } from "vitest";
import { createMockAiProvider } from "./provider";
import type { AiToolName } from "./tools";

describe("mock AI provider (PRD v1.2)", () => {
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
          name: "n",
          phone: "p",
          specialty: "정형외과",
          consent_privacy: true,
          consent_marketing: false,
          conversation_summary: "summary"
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

  it("falls back to safety response with offer_handoff=true when handler asks", async () => {
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
    if (response.toolCall.tool === "safety_response") {
      expect(response.toolCall.input.offer_handoff).toBe(true);
    }
  });
});

import { describe, expect, it } from "vitest";
import {
  AI_TOOL_NAMES,
  aiToolSchemas,
  parseAiToolCall,
  safeParseAiToolCall
} from "./tools";

describe("aiToolSchemas", () => {
  it("declares exactly seven tools", () => {
    expect(AI_TOOL_NAMES).toHaveLength(7);
    expect(Object.keys(aiToolSchemas).sort()).toEqual([...AI_TOOL_NAMES].sort());
  });

  it("validates a navigate_to_section call", () => {
    const call = parseAiToolCall({
      tool: "navigate_to_section",
      input: { sectionId: "core", reason: "core message first" },
      nonce: "n-1",
      timestamp: 100
    });
    expect(call.tool).toBe("navigate_to_section");
  });

  it("rejects safety_response call without isPlaceholderCopy flag", () => {
    const result = safeParseAiToolCall({
      tool: "safety_response",
      input: {
        reason: "out_of_scope",
        message: "test",
        isPlaceholderCopy: "yes"
      },
      nonce: "n",
      timestamp: 1
    });
    expect(result.ok).toBe(false);
  });

  it("rejects unknown tool name", () => {
    const result = safeParseAiToolCall({
      tool: "delete_database",
      input: {},
      nonce: "n",
      timestamp: 1
    });
    expect(result.ok).toBe(false);
  });
});

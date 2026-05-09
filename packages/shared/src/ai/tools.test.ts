import { describe, expect, it } from "vitest";
import {
  AI_TOOL_NAMES,
  aiToolSchemas,
  parseAiToolCall,
  safeParseAiToolCall
} from "./tools";

describe("aiToolSchemas (PRD v1.2 §5.2)", () => {
  it("declares exactly seven tools", () => {
    expect(AI_TOOL_NAMES).toHaveLength(7);
    expect(Object.keys(aiToolSchemas).sort()).toEqual([...AI_TOOL_NAMES].sort());
  });

  it("validates a navigate_to_section call with required choices", () => {
    const call = parseAiToolCall({
      tool: "navigate_to_section",
      input: {
        section_id: "revisit-intro",
        transition_hint: "함께 보러 가실까요?",
        message: "Re:Visit 소개 섹션을 먼저 보여드릴게요.",
        choices: [
          { label: "사례 보기", next_action: "step_case" },
          { label: "기능 보기", next_action: "step_features" }
        ]
      },
      nonce: "n-1",
      timestamp: 100
    });
    expect(call.tool).toBe("navigate_to_section");
  });

  it("rejects navigate_to_section with fewer than 2 choices", () => {
    const result = safeParseAiToolCall({
      tool: "navigate_to_section",
      input: {
        section_id: "x",
        message: "y",
        choices: [{ label: "one", next_action: "next" }]
      },
      nonce: "n",
      timestamp: 1
    });
    expect(result.ok).toBe(false);
  });

  it("validates submit_lead with required PIPA flags", () => {
    const call = parseAiToolCall({
      tool: "submit_lead",
      input: {
        name: "홍길동",
        phone: "010-0000-0000",
        specialty: "정형외과",
        consent_privacy: true,
        consent_marketing: false,
        conversation_summary: "Re:Visit 도입 검토"
      },
      nonce: "n",
      timestamp: 1
    });
    expect(call.tool).toBe("submit_lead");
  });

  it("rejects submit_lead missing consent_privacy", () => {
    const result = safeParseAiToolCall({
      tool: "submit_lead",
      input: {
        name: "n",
        phone: "p",
        specialty: "s",
        consent_marketing: false,
        conversation_summary: "c"
      },
      nonce: "n",
      timestamp: 1
    });
    expect(result.ok).toBe(false);
  });

  it("validates safety_response with offer_handoff", () => {
    const result = safeParseAiToolCall({
      tool: "safety_response",
      input: {
        reason: "out_of_scope",
        message: "담당자가 안내드리겠습니다",
        offer_handoff: true
      },
      nonce: "n",
      timestamp: 1
    });
    expect(result.ok).toBe(true);
  });

  it("validates escalate_to_human with urgency enum", () => {
    const result = safeParseAiToolCall({
      tool: "escalate_to_human",
      input: {
        slack_channel: "#concierge-leads",
        summary: "hot lead",
        urgency: "hot",
        recommended_followup: "전화 연결"
      },
      nonce: "n",
      timestamp: 1
    });
    expect(result.ok).toBe(true);
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

  it("accepts capture_intent metadata silently", () => {
    const call = parseAiToolCall({
      tool: "noop",
      input: {},
      nonce: "n",
      timestamp: 1,
      metadata: {
        visitor_type: "clinic_owner",
        specialty: "orthopedics",
        lead_temperature: "warm",
        confidence: 0.85
      }
    });
    expect(call.metadata?.lead_temperature).toBe("warm");
  });
});

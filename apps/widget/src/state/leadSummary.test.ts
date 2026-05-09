import { describe, expect, it } from "vitest";
import { parseScenario } from "@conciergeai/shared";
import { buildLeadSummary } from "./leadSummary";

const scenario = parseScenario({
  id: "summary_test_v0",
  version: "0.0.1",
  isPlaceholder: true,
  heroBubble: {
    message: "안내",
    quickChips: [{ id: "chip_core", label: "핵심 기능 보기", nextStepId: "step_core" }]
  },
  chapters: [
    {
      id: "chapter_discovery",
      title: "문제 발견",
      sections: [
        {
          id: "section_reminder",
          title: "자동 리마인드",
          stepId: "step_core",
          beats: [
            {
              id: "beat_scroll",
              action: { type: "scroll_to", selector: "[data-section='reminder']" },
              bubbleMessage: { text: "예약 직후부터 안내합니다." }
            },
            {
              id: "beat_highlight",
              action: { type: "highlight", selector: "[data-section='reminder']" },
              bubbleMessage: { text: "직원이 매번 챙기지 않아도 됩니다." }
            }
          ]
        }
      ]
    }
  ],
  steps: [
    {
      id: "step_core",
      popover: { label: "Core", title: "자동 리마인드", body: "본문" },
      spotlightTarget: "[data-section='reminder']",
      avatarPoint: "right",
      choices: [
        { id: "lead", label: "상담", nextStepId: null },
        { id: "more", label: "더 보기", nextStepId: "step_contact" }
      ],
      isClosing: false
    },
    {
      id: "step_contact",
      popover: { label: "Contact", title: "상담", body: "본문" },
      spotlightTarget: "[data-section='contact']",
      avatarPoint: "left",
      choices: [],
      isClosing: true
    }
  ],
  leadForm: {
    title: "상담",
    subtitle: "안내",
    fields: [{ id: "message", label: "메시지", type: "textarea", required: false }],
    pipaConsents: [
      { id: "required", label: "필수", required: true },
      { id: "marketing", label: "선택", required: false },
      { id: "expanded", label: "상세", required: false }
    ],
    retentionDescription: "보관",
    submitLabel: "보내기",
    thanksMessage: "접수"
  }
});

describe("buildLeadSummary", () => {
  it("includes chapter, section, and beat context for sales qualification", () => {
    const summary = buildLeadSummary({
      scenario,
      interactions: [
        { kind: "chip", id: "chip_core", label: "핵심 기능 보기" },
        { kind: "step", id: "step_core", label: "자동 리마인드" }
      ]
    });

    expect(summary).toContain("핵심 기능 보기");
    expect(summary).toContain("문제 발견 > 자동 리마인드");
    expect(summary).toContain("예약 직후부터 안내합니다.");
    expect(summary).toContain("직원이 매번 챙기지 않아도 됩니다.");
  });
});

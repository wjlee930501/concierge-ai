export const motionlabsSectionMap = {
  hero: {
    label: "메인 메시지",
    selector: '[data-concierge-section="hero"]'
  },
  revisit: {
    label: "Re:Visit",
    selector: '[data-concierge-section="revisit"]'
  },
  newvisit: {
    label: "New:Visit / Re:Solve",
    selector: '[data-concierge-section="newvisit"]'
  },
  pxIntelligence: {
    label: "PX Intelligence",
    selector: '[data-concierge-section="px-intelligence"]'
  },
  contact: {
    label: "상담 신청",
    selector: '[data-concierge-section="contact"]'
  }
} as const;

export type MotionlabsSectionKey = keyof typeof motionlabsSectionMap;

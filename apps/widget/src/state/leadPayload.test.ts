import { describe, expect, it } from "vitest";
import { buildMockLeadPayload } from "./leadPayload";

describe("buildMockLeadPayload", () => {
  it("builds the guided conversion mock submit payload", () => {
    const payload = buildMockLeadPayload({
      intent: "revisit",
      fields: {
        hospitalName: "서울OO의원",
        name: "홍길동",
        phone: "010-0000-0000",
        specialty: "정형외과",
        region: "서울",
        interestArea: "revisit",
        preferredContactTime: "평일 오후",
        painPoint: "진료 후 환자 관리와 재방문율 개선"
      },
      consent: true,
      conversationSummary: "방문자는 Re:Visit에 관심을 보였고 상담을 요청함.",
      visitedSections: ["hero", "revisit", "contact"],
      createdAt: "2026-05-10T00:00:00.000Z"
    });

    expect(payload).toEqual({
      source: "concierge_ai",
      host: "motionlabs",
      intent: "revisit",
      leadTemperature: "warm",
      hospitalName: "서울OO의원",
      name: "홍길동",
      phone: "010-0000-0000",
      specialty: "정형외과",
      region: "서울",
      interestArea: "revisit",
      preferredContactTime: "평일 오후",
      painPoint: "진료 후 환자 관리와 재방문율 개선",
      consent: true,
      conversationSummary: "방문자는 Re:Visit에 관심을 보였고 상담을 요청함.",
      visitedSections: ["hero", "revisit", "contact"],
      createdAt: "2026-05-10T00:00:00.000Z"
    });
  });
});

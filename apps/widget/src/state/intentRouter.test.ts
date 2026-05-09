import { describe, expect, it } from "vitest";
import { routeConciergeIntent } from "./intentRouter";

describe("routeConciergeIntent", () => {
  it.each([
    ["재방문 CRM과 진료 후 안내가 궁금해요", "revisit"],
    ["신환 유치와 병원 성장 마케팅이 고민이에요", "newvisit"],
    ["PX 데이터와 경영 인사이트를 보고 싶어요", "px_intelligence"],
    ["가격 문의와 데모 상담을 받고 싶어요", "contact"]
  ] as const)("routes %s to %s", (query, expected) => {
    expect(routeConciergeIntent(query)).toBe(expected);
  });

  it("returns unknown for unrelated text instead of over-answering", () => {
    expect(routeConciergeIntent("점심 메뉴 추천해줘")).toBe("unknown");
  });
});

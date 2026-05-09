import { describe, expect, it } from "vitest";
import {
  buildRetrievalGate,
  isToolBranchAllowed,
  type ApprovedKnowledgeDocument
} from "./approved-knowledge";

const okDoc: ApprovedKnowledgeDocument = {
  id: "kb1",
  version: "v1",
  title: "Re:Visit 소개",
  body: "환자 안내 자동화로 재방문 비율을 높입니다.",
  isPlaceholder: false,
  approved: true
};

describe("buildRetrievalGate", () => {
  it("returns docs when query and docs are valid", () => {
    const result = buildRetrievalGate({
      query: "Re:Visit 도입 절차",
      availableDocs: [okDoc]
    });
    expect(result.ok).toBe(true);
  });

  it("blocks empty query", () => {
    const result = buildRetrievalGate({ query: "", availableDocs: [okDoc] });
    expect(result.ok).toBe(false);
  });

  it("blocks empty kb", () => {
    const result = buildRetrievalGate({ query: "hi", availableDocs: [] });
    expect(result.ok).toBe(false);
  });

  it("blocks docs that are not yet approved", () => {
    const pending = { ...okDoc, approved: false };
    const result = buildRetrievalGate({
      query: "hi",
      availableDocs: [pending]
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("not-approved");
  });

  it("does NOT reject medical-domain content (banned-vocab guard removed in v1.2)", () => {
    const medical = {
      ...okDoc,
      body: "정형외과 / 내과 / 환자 / 진료 안내 자동화"
    };
    const result = buildRetrievalGate({
      query: "정형외과 사례",
      availableDocs: [medical]
    });
    expect(result.ok).toBe(true);
  });
});

describe("isToolBranchAllowed", () => {
  it("allows safety_response and noop even with bad retrieval", () => {
    const bad = { ok: false as const, reason: "kb-empty" as const };
    expect(isToolBranchAllowed("safety_response", bad)).toBe(true);
    expect(isToolBranchAllowed("noop", bad)).toBe(true);
    expect(isToolBranchAllowed("submit_lead", bad)).toBe(false);
  });

  it("allows business tools when retrieval is ok", () => {
    const good = { ok: true as const, docs: [okDoc] };
    expect(isToolBranchAllowed("navigate_to_section", good)).toBe(true);
    expect(isToolBranchAllowed("submit_lead", good)).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildRetrievalGate,
  isApprovedKnowledgeBodySafe,
  isToolBranchAllowed,
  sealSystemPrompt
} from "./approved-knowledge";

const okDoc = {
  id: "kb1",
  version: "v1",
  title: "[PLACEHOLDER] doc",
  body: "[PLACEHOLDER] safe content",
  isPlaceholder: true,
  bannedVocabClean: true
};

describe("buildRetrievalGate", () => {
  it("returns docs when query and docs are valid", () => {
    const result = buildRetrievalGate({ query: "hello", availableDocs: [okDoc] });
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

  it("blocks docs with banned vocabulary", () => {
    const banned = { ...okDoc, body: "병원 안내", bannedVocabClean: false };
    const result = buildRetrievalGate({ query: "hi", availableDocs: [banned] });
    expect(result.ok).toBe(false);
  });
});

describe("sealSystemPrompt", () => {
  it("sanitizes external URLs and banned vocab", () => {
    const result = sealSystemPrompt({
      basePrompt: "base",
      approvedDocs: [
        { ...okDoc, body: "see https://example.com about 병원" }
      ]
    });
    expect(result.prompt).toContain("[REDACTED-URL]");
    expect(result.prompt).toContain("[REDACTED-BANNED]");
    expect(result.seal.startsWith("kb-seal:")).toBe(true);
  });
});

describe("isToolBranchAllowed", () => {
  it("allows safety_response and noop even with bad retrieval", () => {
    const bad = { ok: false as const, reason: "kb-empty" as const };
    expect(isToolBranchAllowed("safety_response", bad)).toBe(true);
    expect(isToolBranchAllowed("noop", bad)).toBe(true);
    expect(isToolBranchAllowed("submit_lead", bad)).toBe(false);
  });
});

describe("isApprovedKnowledgeBodySafe", () => {
  it("flags banned vocab", () => {
    expect(isApprovedKnowledgeBodySafe("safe text")).toBe(true);
    expect(isApprovedKnowledgeBodySafe("clinic info")).toBe(false);
  });
});

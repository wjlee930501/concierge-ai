import { afterEach, describe, expect, it } from "vitest";
import { isDevBuild } from "./isDevBuild";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
});

describe("isDevBuild", () => {
  it("returns true under vitest (NODE_ENV=test or import.meta.env.DEV)", () => {
    expect(isDevBuild()).toBe(true);
  });

  it("returns true when NODE_ENV is 'development'", () => {
    process.env.NODE_ENV = "development";
    expect(isDevBuild()).toBe(true);
  });

  it("returns true when NODE_ENV is 'test'", () => {
    process.env.NODE_ENV = "test";
    expect(isDevBuild()).toBe(true);
  });
});

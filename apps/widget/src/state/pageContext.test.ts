import { afterEach, describe, expect, it } from "vitest";
import { buildVariantGreetingSuffix, detectPageContext } from "./pageContext";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

afterEach(() => {
  /* nothing — tests pass their own storage */
});

describe("detectPageContext", () => {
  it("detects paid variant from utm_source", () => {
    const ctx = detectPageContext({
      url: "https://host.example.test/?utm_source=ads&utm_medium=cpc",
      referrer: "",
      storage: new MemoryStorage(),
      now: 1
    });
    expect(ctx.variant).toBe("paid");
    expect(ctx.utmSource).toBe("ads");
  });

  it("detects referral variant from external referrer", () => {
    const ctx = detectPageContext({
      url: "https://host.example.test/",
      referrer: "https://blog.example.test/post",
      storage: new MemoryStorage(),
      now: 1
    });
    expect(ctx.variant).toBe("referral");
    expect(ctx.referrerHost).toBe("blog.example.test");
  });

  it("detects returning visitor when stored timestamp is recent", () => {
    const storage = new MemoryStorage();
    storage.setItem("concierge.session.lastVisitAt", String(1_000_000));
    const ctx = detectPageContext({
      url: "https://host.example.test/",
      referrer: "",
      storage,
      now: 1_000_500
    });
    expect(ctx.variant).toBe("returning");
    expect(ctx.isReturningSession).toBe(true);
  });

  it("falls back to default variant", () => {
    const ctx = detectPageContext({
      url: "https://host.example.test/",
      referrer: "",
      storage: new MemoryStorage(),
      now: 1
    });
    expect(ctx.variant).toBe("default");
    expect(buildVariantGreetingSuffix(ctx)).toBeNull();
  });

  it("provides greeting suffix for paid variant", () => {
    const paid = detectPageContext({
      url: "https://host.example.test/?utm_source=ads",
      referrer: "",
      storage: new MemoryStorage(),
      now: 1
    });
    const suffix = buildVariantGreetingSuffix(paid);
    expect(typeof suffix).toBe("string");
    expect(suffix).toContain("ads");
  });
});

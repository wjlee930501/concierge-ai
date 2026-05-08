import { describe, expect, it } from "vitest";
import {
  DEFAULT_PARENT_PAGE_ACCESS_POLICY,
  assertNoParentPageAccess
} from "./parent-access";

describe("embed parent page access policy", () => {
  it("disables parent DOM scrape, cookie, localStorage, sessionStorage, and DOM write access by default", () => {
    expect(DEFAULT_PARENT_PAGE_ACCESS_POLICY).toEqual({
      parentDomScrape: false,
      parentCookieRead: false,
      parentLocalStorageRead: false,
      parentSessionStorageRead: false,
      parentDomWrite: false
    });
    expect(assertNoParentPageAccess()).toBe(DEFAULT_PARENT_PAGE_ACCESS_POLICY);
  });

  it("rejects any policy that enables parent page access", () => {
    expect(() =>
      assertNoParentPageAccess({
        parentDomScrape: true,
        parentCookieRead: false,
        parentLocalStorageRead: false,
        parentSessionStorageRead: false,
        parentDomWrite: false
      })
    ).toThrow(/disabled/u);
  });

  it("rejects sessionStorage access separately", () => {
    expect(() =>
      assertNoParentPageAccess({
        parentDomScrape: false,
        parentCookieRead: false,
        parentLocalStorageRead: false,
        parentSessionStorageRead: true,
        parentDomWrite: false
      })
    ).toThrow(/sessionStorage/u);
  });
});

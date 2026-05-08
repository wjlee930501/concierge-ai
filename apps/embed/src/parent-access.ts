export type ParentPageAccessPolicy = {
  readonly parentDomScrape: boolean;
  readonly parentCookieRead: boolean;
  readonly parentLocalStorageRead: boolean;
  readonly parentSessionStorageRead: boolean;
  readonly parentDomWrite: boolean;
};

export const DEFAULT_PARENT_PAGE_ACCESS_POLICY: ParentPageAccessPolicy =
  Object.freeze({
    parentDomScrape: false,
    parentCookieRead: false,
    parentLocalStorageRead: false,
    parentSessionStorageRead: false,
    parentDomWrite: false
  });

export function assertNoParentPageAccess(
  policy: ParentPageAccessPolicy = DEFAULT_PARENT_PAGE_ACCESS_POLICY
): ParentPageAccessPolicy {
  const forbiddenEntries = Object.entries(policy).filter(([, value]) => value);

  if (forbiddenEntries.length > 0) {
    throw new Error(
      "Parent page DOM, cookie, localStorage, and sessionStorage access is disabled"
    );
  }

  return policy;
}

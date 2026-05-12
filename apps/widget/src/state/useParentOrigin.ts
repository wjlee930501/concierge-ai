import { useMemo } from "react";
import { isOriginAllowed } from "@conciergeai/shared";

/**
 * Resolve the parent (host) origin under which this widget is embedded.
 *
 * Reads candidate origins from `document.referrer`, the
 * `window.location.ancestorOrigins` chain, and the first configured allowed
 * origin (in that order) and returns the first one that passes the runtime
 * `isOriginAllowed` check. Returns `null` when no candidate is allowed so
 * downstream `postMessage` calls fail closed.
 */
export function useParentOrigin(
  allowedOrigins: readonly string[]
): string | null {
  return useMemo(() => resolveParentOrigin(allowedOrigins), [allowedOrigins]);
}

export function resolveParentOrigin(
  allowedOrigins: readonly string[]
): string | null {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return allowedOrigins[0] ?? null;
  }

  const candidates = [
    document.referrer,
    getAncestorOrigin(),
    allowedOrigins[0] ?? null
  ];
  for (const candidate of candidates) {
    if (candidate === null || candidate.length === 0) continue;
    try {
      const origin = new URL(candidate).origin;
      if (isOriginAllowed(origin, allowedOrigins)) {
        return origin;
      }
    } catch {
      // Continue to the next source of parent-origin evidence.
    }
  }

  return null;
}

function getAncestorOrigin(): string | null {
  const location = window.location as Location & {
    readonly ancestorOrigins?: DOMStringList;
  };
  const ancestorOrigins = location.ancestorOrigins;
  if (ancestorOrigins === undefined || ancestorOrigins.length === 0) {
    return null;
  }
  return ancestorOrigins.item(0);
}

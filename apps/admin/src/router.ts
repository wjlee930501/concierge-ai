import { useEffect, useState } from "react";

export const ADMIN_ROUTES = [
  "dashboard",
  "scenarios",
  "kb",
  "audit",
  "settings"
] as const;

export type AdminRoute = (typeof ADMIN_ROUTES)[number];

export function isAdminRoute(value: string): value is AdminRoute {
  return (ADMIN_ROUTES as readonly string[]).includes(value);
}

export function readRouteFromHash(hash: string): AdminRoute {
  const cleaned = hash.replace(/^#\/?/, "");
  return isAdminRoute(cleaned) ? cleaned : "dashboard";
}

export function useAdminRoute(): {
  readonly route: AdminRoute;
  readonly setRoute: (route: AdminRoute) => void;
} {
  const [route, setRouteState] = useState<AdminRoute>(() =>
    typeof window === "undefined"
      ? "dashboard"
      : readRouteFromHash(window.location.hash)
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onHash = () => setRouteState(readRouteFromHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return {
    route,
    setRoute(next: AdminRoute): void {
      window.location.hash = `#/${next}`;
      setRouteState(next);
    }
  };
}

export const ADMIN_ROUTE_LABELS: Record<AdminRoute, string> = {
  dashboard: "대시보드",
  scenarios: "시나리오",
  kb: "Approved Knowledge",
  audit: "감사 로그",
  settings: "설정"
};

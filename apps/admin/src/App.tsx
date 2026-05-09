import type { JSX } from "react";
import {
  ADMIN_ROUTES,
  ADMIN_ROUTE_LABELS,
  useAdminRoute,
  type AdminRoute
} from "./router";
import { DashboardPage } from "./pages/DashboardPage";
import { ScenariosPage } from "./pages/ScenariosPage";
import { KbPage } from "./pages/KbPage";
import { AuditPage } from "./pages/AuditPage";
import { SettingsPage } from "./pages/SettingsPage";

const ROUTE_RENDERERS: Record<AdminRoute, () => JSX.Element> = {
  dashboard: DashboardPage,
  scenarios: ScenariosPage,
  kb: KbPage,
  audit: AuditPage,
  settings: SettingsPage
};

export function App(): JSX.Element {
  const { route, setRoute } = useAdminRoute();
  const Renderer = ROUTE_RENDERERS[route];

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-base font-black tracking-tight">
            Concierge AI Admin
            <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-yellow-800">
              placeholder
            </span>
          </div>
          <nav className="flex gap-1 text-sm">
            {ADMIN_ROUTES.map((id) => {
              const isActive = id === route;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRoute(id)}
                  className={
                    isActive
                      ? "rounded-md bg-ink px-3 py-1 font-bold text-white"
                      : "rounded-md px-3 py-1 font-semibold text-mist hover:bg-black/5"
                  }
                >
                  {ADMIN_ROUTE_LABELS[id]}
                </button>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Renderer />
      </main>
    </div>
  );
}

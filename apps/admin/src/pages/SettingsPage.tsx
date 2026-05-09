import type { JSX } from "react";
import { PlaceholderBanner } from "../components/PlaceholderBanner";

export function SettingsPage(): JSX.Element {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-black tracking-tight">설정</h1>
      <PlaceholderBanner />
      <ul className="grid gap-2 text-sm text-ink">
        <li>RBAC role 정의 — Phase 5 Reviewable blocker</li>
        <li>Slack staging webhook 연결 — Phase 5</li>
        <li>Cost cap 임계값 — Phase 6 KPI infra</li>
        <li>Anthropic / Supabase API key — Vercel env (코드 commit 금지)</li>
      </ul>
    </section>
  );
}

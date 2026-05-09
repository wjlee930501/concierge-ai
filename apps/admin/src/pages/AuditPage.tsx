import type { JSX } from "react";
import { PlaceholderBanner } from "../components/PlaceholderBanner";

export function AuditPage(): JSX.Element {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-black tracking-tight">감사 로그</h1>
      <PlaceholderBanner />
      <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-ink">
        Lead 제출, 시나리오 변경, KB 업데이트의 감사 로그는 Supabase audit table 도입 후 노출됩니다.
        현재 페이지는 라우트 stub 입니다.
      </div>
    </section>
  );
}

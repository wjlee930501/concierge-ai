import type { JSX } from "react";
import { PlaceholderBanner } from "../components/PlaceholderBanner";

export function KbPage(): JSX.Element {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-black tracking-tight">Approved Knowledge</h1>
      <PlaceholderBanner />
      <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-ink">
        Approved Knowledge 3겹 차단(retrieval gate / system prompt seal / tool branch)이 코드 측에는 준비되어 있으며,
        실제 KB 본문 ingest, 승인 워크플로, 금지 어휘 lint은 Phase 5에서 wire됩니다.
      </div>
    </section>
  );
}

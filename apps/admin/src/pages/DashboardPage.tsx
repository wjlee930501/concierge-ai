import type { JSX } from "react";
import { PlaceholderBanner } from "../components/PlaceholderBanner";

export function DashboardPage(): JSX.Element {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-black tracking-tight">대시보드</h1>
      <PlaceholderBanner />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "오늘 lead 수", value: "—" },
          { label: "주간 unsafe rate", value: "—" },
          { label: "주간 누적 cost", value: "—" }
        ].map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
          >
            <div className="text-xs font-bold uppercase tracking-wide text-mist">
              {card.label}
            </div>
            <div className="mt-2 text-3xl font-black tracking-tight text-ink">
              {card.value}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

import type { JSX } from "react";
import { SectionEyebrow } from "./primitives";

export function AnalyticsSection(): JSX.Element {
  return (
    <section
      data-concierge-section="px-intelligence"
      data-mc-section="data-analysis"
      id="section-analytics"
      className="bg-white px-6 py-24"
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <div>
          <SectionEyebrow label="환자 데이터 분석" />
          <h2 className="mt-3 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.18] tracking-[-0.03em]">
            우리 병원의 데이터를 보고
            <br />
            진짜 전략을 세우세요.
          </h2>
          <p className="mt-4 text-[14px] leading-[1.7] text-[#3b4d68]">
            진료과별 재방문율, 객단가, 노쇼율, 메시지 반응률을 한 화면에서. CRM
            의사결정에 필요한 단 한 장의 인사이트.
          </p>
        </div>
        <div className="rounded-[28px] border border-black/5 bg-bg p-6 shadow-[0_18px_40px_rgba(7,20,39,0.06)]">
          <div className="mb-3 flex items-center justify-between text-[11px] font-bold text-mist">
            <span>이번 달 인사이트</span>
            <span>2026.05</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { label: "재방문율", value: "+12%", color: "text-accent" },
              { label: "객단가", value: "+19%", color: "text-mint" },
              { label: "노쇼율", value: "−7%", color: "text-ink" },
              { label: "메시지 반응", value: "82%", color: "text-accent" }
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl bg-white px-4 py-3 shadow-[0_6px_18px_rgba(7,20,39,0.06)]"
              >
                <div className="text-[11px] text-mist">{kpi.label}</div>
                <div
                  className={`text-2xl font-black tracking-tight ${kpi.color}`}
                >
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

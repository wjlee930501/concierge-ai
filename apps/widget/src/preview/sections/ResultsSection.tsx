import type { JSX } from "react";

export function ResultsSection(): JSX.Element {
  const cards = [
    {
      headline: "환자 재방문율 +12%",
      meta: "서울 M 정형외과 · 도입 3개월"
    },
    {
      headline: "주요 항목 매출 +16%",
      meta: "서울 S 정형외과 · 도입 6개월"
    },
    {
      headline: "환자 객단가 +19%",
      meta: "경기 M 내과 · 6개월 전년동기 대비"
    }
  ];
  return (
    <section
      data-mc-section="case-data"
      id="section-results"
      className="bg-bg px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="mx-auto max-w-3xl text-center text-[clamp(24px,3vw,36px)] font-black leading-[1.2] tracking-[-0.03em]">
          500개+의 병의원이 경험한 매출 상승과 경영 효율화,
          <br />
          이제 우리 병원의 차례입니다.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((c, index) => (
            <div
              data-mc-card={
                index === 0
                  ? "ortho-revisit-12"
                  : index === 2
                    ? "im-revenue-19"
                    : undefined
              }
              key={c.headline}
              className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_18px_40px_rgba(7,20,39,0.06)]"
            >
              <div className="text-[clamp(28px,3vw,36px)] font-black tracking-tight text-accent">
                {c.headline}
              </div>
              <div className="mt-3 text-[12px] text-mist">{c.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

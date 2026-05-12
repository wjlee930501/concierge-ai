import type { JSX } from "react";
import { SectionEyebrow } from "./primitives";

export function NewVisitSection(): JSX.Element {
  const lanes = [
    {
      title: "신환 유입 진단",
      body: "검색·광고·콘텐츠 흐름에서 이탈 지점을 찾고 우선순위를 정합니다."
    },
    {
      title: "성장 프로젝트 설계",
      body: "진료과와 지역 경쟁 상황에 맞춰 실행 가능한 캠페인을 구성합니다."
    },
    {
      title: "운영 파트너십",
      body: "성과 데이터를 보며 병원 내부 운영과 외부 마케팅을 함께 조정합니다."
    }
  ];
  return (
    <section
      data-concierge-section="newvisit"
      data-mc-section="newvisit-growth"
      id="section-newvisit"
      className="bg-white px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow label="New:Visit / Re:Solve" />
        <div className="mt-3 grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <h2 className="text-[clamp(28px,3.4vw,42px)] font-black leading-[1.18] tracking-[-0.03em]">
              신환 유치와 병원 성장,
              <br />
              실행까지 함께 설계합니다.
            </h2>
            <p className="mt-4 text-[14px] leading-[1.7] text-[#3b4d68]">
              New:Visit / Re:Solve는 광고 대행만이 아니라 병원 성장 과제를 함께
              정의하고, 유입부터 상담 전환까지 실제 운영 흐름을 맞춥니다.
            </p>
          </div>
          <div className="grid gap-3">
            {lanes.map((lane, index) => (
              <article
                key={lane.title}
                className="rounded-2xl border border-black/5 bg-bg p-5 shadow-[0_10px_24px_rgba(7,20,39,0.05)]"
              >
                <div className="text-[11px] font-black uppercase tracking-wider text-accent">
                  0{index + 1}
                </div>
                <h3 className="mt-1 text-[15px] font-black text-ink">
                  {lane.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.6] text-[#3b4d68]">
                  {lane.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

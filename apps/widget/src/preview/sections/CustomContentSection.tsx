import type { JSX } from "react";
import { SectionEyebrow } from "./primitives";

export function CustomContentSection(): JSX.Element {
  const tabs = ["정형외과", "내과", "산부인과", "안과", "피부과"];
  return (
    <section
      data-mc-section="reminder-content"
      id="section-custom-content"
      className="bg-bg px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow label="맞춤 콘텐츠" />
        <h2 className="mt-3 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.18] tracking-[-0.03em]">
          콘텐츠 기반 맞춤 케어로
          <br />
          충성 고객을 만드세요.
        </h2>
        <div
          data-mc-section="specialty-tabs"
          className="mt-8 flex flex-wrap gap-2"
        >
          {tabs.map((t, i) => (
            <span
              data-mc-tab={
                i === 0
                  ? "orthopedics"
                  : i === 1
                    ? "internal-medicine"
                    : undefined
              }
              key={t}
              className={
                i === 0
                  ? "rounded-full bg-ink px-4 py-1.5 text-[12px] font-bold text-white"
                  : "rounded-full border border-black/10 bg-white px-4 py-1.5 text-[12px] font-bold text-mist"
              }
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { title: "바른 자세 만들기", kind: "VIDEO 02:14" },
            { title: "경추 스트레칭 가이드", kind: "VIDEO 03:08" },
            { title: "도수치료 후 주의사항", kind: "ARTICLE" }
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-[20px] border border-black/5 bg-white p-5 shadow-[0_10px_24px_rgba(7,20,39,0.06)]"
            >
              <div className="mb-3 h-28 rounded-lg bg-gradient-to-br from-[#0d243f] to-accent" />
              <div className="text-[10px] font-bold uppercase tracking-wider text-mint">
                {card.kind}
              </div>
              <div className="mt-1 text-[14px] font-black text-ink">
                {card.title}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[12px] text-mist">
          전체 87+개 진료과별 템플릿 라이브러리에서 골라 보내거나, 직접 새로
          만들어 사용할 수 있습니다.
        </p>
      </div>
    </section>
  );
}

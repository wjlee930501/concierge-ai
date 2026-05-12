import type { JSX } from "react";
import { SectionEyebrow } from "./primitives";

export function ValidationSection(): JSX.Element {
  return (
    <section id="section-validation" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <SectionEyebrow label="검증" />
        <h2 className="mt-3 text-[clamp(22px,2.6vw,30px)] font-black tracking-tight">
          리비짓은 원장님들로부터 검증 받은 환자 관리 솔루션입니다.
        </h2>
        <p className="mt-3 text-[14px] text-mist">
          실제 원장님들로부터 임상 효과와 안정성이 검증되었습니다.
        </p>
        <div className="mx-auto mt-8 inline-block rounded-2xl border border-accent/20 bg-bg px-8 py-10 text-[12px] text-mist shadow-[0_18px_40px_rgba(7,20,39,0.06)]">
          MEDICAL ADVISORY CERTIFICATION
          <div className="mt-3 text-[24px] font-black text-ink">
            Re:Visit · 2026
          </div>
        </div>
      </div>
    </section>
  );
}

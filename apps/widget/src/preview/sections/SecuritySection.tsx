import type { JSX } from "react";
import { SectionEyebrow, Badge } from "./primitives";

export function SecuritySection(): JSX.Element {
  return (
    <section
      data-mc-section="security"
      id="section-security"
      className="bg-bg px-6 py-24"
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <SectionEyebrow label="정보 보호" />
          <h2 className="mt-3 text-[clamp(24px,2.8vw,32px)] font-black leading-[1.2] tracking-[-0.03em]">
            우리 병원의 정보, 국제 기준에 맞춰
            <br />
            안전하게 보호하고 있습니다.
          </h2>
          <p className="mt-4 text-[14px] leading-[1.7] text-[#3b4d68]">
            ISO/IEC 27001 정보보호 관리체계 인증, AWS 글로벌 표준 인프라, 모든
            데이터 전송 구간 TLS 암호화.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Badge label="ISO 27001" />
          <Badge label="AWS" />
          <Badge label="TLS 1.3" />
        </div>
      </div>
    </section>
  );
}

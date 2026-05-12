import type { JSX } from "react";
import { SectionEyebrow } from "./primitives";

export function DemoSection(): JSX.Element {
  return (
    <section
      data-mc-section="crm-demo"
      id="section-demo"
      className="bg-gradient-to-br from-[#0d1f37] via-ink to-[#0a1226] px-6 py-24 text-white"
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <SectionEyebrow label="라이브 체험" tone="dark" />
          <h2 className="mx-auto mt-3 max-w-3xl text-[clamp(28px,3.4vw,42px)] font-black leading-[1.18] tracking-[-0.03em]">
            잘 되는 병원의 비밀, 리비짓을
            <br />
            지금 직접 받아보세요.
          </h2>
          <p className="mt-4 text-[14px] text-white/70">
            진료 과목별 템플릿을 골라 카카오 메시지로 직접 받아볼 수 있어요.
          </p>
        </div>
        <form className="mx-auto mt-10 grid max-w-2xl gap-3 rounded-[24px] border border-white/10 bg-white/5 p-6 backdrop-blur md:grid-cols-2">
          <input
            placeholder="이름"
            className="rounded-md bg-white/10 px-3 py-2 text-[13px] text-white placeholder:text-white/50"
          />
          <input
            placeholder="휴대폰 번호"
            className="rounded-md bg-white/10 px-3 py-2 text-[13px] text-white placeholder:text-white/50"
          />
          <select className="rounded-md bg-white/10 px-3 py-2 text-[13px] text-white md:col-span-2">
            <option>
              진료과 선택 — 정형외과 / 내과 / 산부인과 / 안과 / 피부과
            </option>
          </select>
          <select className="rounded-md bg-white/10 px-3 py-2 text-[13px] text-white md:col-span-2">
            <option>
              리마인드 템플릿 선택 — 도수치료 / 검진 결과 안내 / …
            </option>
          </select>
          <label className="flex items-center gap-2 text-[12px] text-white/70 md:col-span-2">
            <input type="checkbox" className="accent-mint" />
            테스트 메시지 발송을 위한 개인정보 수집·이용에 동의합니다.
          </label>
          <button
            type="button"
            className="rounded-full bg-mint px-5 py-3 text-[13px] font-extrabold text-ink md:col-span-2"
          >
            카카오 메시지로 받아보기
          </button>
        </form>
        <ul className="mx-auto mt-8 grid max-w-3xl gap-2 text-[13px] text-white/70 md:grid-cols-2">
          <li>· 유형별 맞춤 콘텐츠로 상담 시간 단축</li>
          <li>· 카카오 메시지로 SMS 대비 CRM 비용 절감</li>
          <li>· 발송 단순화로 직원 업무 부담 감소</li>
          <li>· 행동 데이터 기반 개인화 마케팅</li>
        </ul>
      </div>
    </section>
  );
}

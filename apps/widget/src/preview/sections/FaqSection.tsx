import type { JSX } from "react";

export function FaqSection(): JSX.Element {
  const faqs = [
    {
      q: "리비짓에서 제공하는 주요 기능은 무엇인가요?",
      a: "자동 리마인드, CRM, 맞춤 콘텐츠, 재방문 관리, 데이터 분석을 한 솔루션에서 제공합니다."
    },
    {
      q: "내과 / 정형외과 / 치과처럼 진료과마다 CRM 활용법이 다른가요?",
      a: "예, 진료과별로 별도 템플릿과 발송 전략을 제공합니다. 내과는 검진 리마인드, 정형외과는 운동 콘텐츠 등."
    },
    {
      q: "무료 체험이나 데모를 제공하나요?",
      a: "네, 라이브 데모와 현장 상담을 제공합니다. 위 폼에서 직접 받아 보실 수 있어요."
    },
    {
      q: "예약·재방문 리마인드 메시지를 직접 수정할 수 있나요?",
      a: "네, 모든 메시지 카피와 발송 시각을 자유롭게 편집·수정할 수 있습니다."
    },
    {
      q: "서비스 해지나 계약 변경은 어떻게 하나요?",
      a: "월 단위 구독으로, 언제든 해지 가능합니다. 해지 수수료는 없습니다."
    }
  ];
  return (
    <section
      data-concierge-section="contact"
      data-mc-section="faq"
      id="section-faq"
      className="bg-bg px-6 py-24"
    >
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-[clamp(22px,2.6vw,32px)] font-black tracking-tight">
          자주 묻는 질문
        </h2>
        <div className="mt-8 space-y-3">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_8px_22px_rgba(7,20,39,0.05)]"
            >
              <summary className="cursor-pointer list-none text-[14px] font-bold text-ink">
                Q. {f.q}
              </summary>
              <p className="mt-3 text-[13px] leading-[1.7] text-[#3b4d68]">
                A. {f.a}
              </p>
            </details>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <a
            data-mc-section="footer-cta"
            id="section-contact"
            href="#"
            className="rounded-full bg-ink px-6 py-3 text-[13px] font-extrabold text-white"
          >
            상담 신청하기 →
          </a>
        </div>
      </div>
    </section>
  );
}

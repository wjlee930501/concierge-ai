import type { JSX } from "react";

export function DoctorTestimonials(): JSX.Element {
  const cards = [
    {
      quote: "알림톡 자동화로 안내 누락 ‘제로’에 가까워졌습니다.",
      author: "정형외과 원장 A",
      meta: "도수치료 패키지 운영"
    },
    {
      quote: "재방문율과 매출 상승, 리비짓으로 가능했어요.",
      author: "내과 원장 B",
      meta: "건강검진·만성질환"
    },
    {
      quote: "짧은 진료 시간 안에서도 진심을 전달할 수 있어요.",
      author: "정형외과 원장 C",
      meta: "도수·체외충격파"
    }
  ];
  return (
    <section
      data-mc-section="customer-review"
      id="section-testimonials"
      className="bg-bg px-6 py-20"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-[clamp(22px,2.6vw,32px)] font-black tracking-tight">
          리비짓을 가장 먼저 도입한 원장님들의 후기를 확인하세요.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((c) => (
            <article
              key={c.author}
              className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_18px_40px_rgba(7,20,39,0.06)]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-ink to-accent text-[12px] font-black text-white">
                {c.author.slice(-1)}
              </div>
              <p className="text-[15px] font-bold leading-[1.55] text-ink">
                {c.quote}
              </p>
              <div className="mt-4 text-[12px] text-mist">
                <div className="font-bold">{c.author}</div>
                <div>{c.meta}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

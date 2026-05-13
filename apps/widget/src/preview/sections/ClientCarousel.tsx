import type { JSX } from "react";

export function ClientCarousel(): JSX.Element {
  const slots = Array.from({ length: 10 });
  return (
    <section
      data-mc-section="social-proof"
      id="section-clients"
      className="border-y border-black/5 bg-white py-14"
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-[clamp(22px,2.6vw,32px)] font-black tracking-tight">
          성공하는 병의원은 리비짓을 사용합니다.
        </h2>
        <p className="mt-2 text-center text-[14px] text-mist">
          500개+ 병의원이 리비짓을 선택했습니다.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          {slots.map((_, i) => (
            <div
              key={i}
              className="flex h-14 items-center justify-center rounded-md border border-black/5 bg-bg text-[11px] font-semibold text-mist"
            >
              모션랩스 도입 병원 {i + 1}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

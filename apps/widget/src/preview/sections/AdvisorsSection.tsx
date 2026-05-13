import type { JSX } from "react";

export function AdvisorsSection(): JSX.Element {
  const slots = Array.from({ length: 12 });
  return (
    <section
      data-mc-section="advisors"
      id="section-advisors"
      className="bg-white px-6 py-24"
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="mx-auto max-w-3xl text-center text-[clamp(22px,2.6vw,32px)] font-black tracking-tight">
          리비짓은 24명+의 자문 전문의가 함께하는 믿을 수 있는 솔루션입니다.
        </h2>
        <div
          data-mc-group="ortho-advisors"
          className="mt-10 grid grid-cols-3 gap-4 md:grid-cols-6"
        >
          {slots.map((_, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-bg to-accent/20" />
              <div className="mt-2 text-[12px] font-bold text-ink">
                전문의 {i + 1}
              </div>
              <div className="text-[10px] text-mist">정형외과</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

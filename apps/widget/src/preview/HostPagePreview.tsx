import type { JSX } from "react";

export function HostPagePreview(): JSX.Element {
  return (
    <div className="min-h-[180vh] text-ink">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white/80 px-6 py-5 backdrop-blur md:px-16">
        <div className="text-xl font-black tracking-tight">MotionLabs</div>
        <nav className="hidden gap-5 text-sm text-mist md:flex">
          <span>Work</span>
          <span>Approach</span>
          <span>Cases</span>
          <span>Contact</span>
        </nav>
      </header>

      <main>
        <section
          id="section-core"
          className="grid gap-12 px-6 py-24 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:px-16 md:py-32"
        >
          <div>
            <h1 className="m-0 max-w-[720px] text-[clamp(40px,6vw,80px)] font-black leading-[1.04] tracking-[-0.06em] text-balance">
              방문자가 길을 잃기 전에, 다음 행동을 먼저 제안합니다.
            </h1>
            <p className="mt-6 max-w-[560px] text-[clamp(16px,1.8vw,20px)] leading-[1.65] text-[#40536e]">
              MotionLabs Concierge AI는 홈페이지 위에 떠 있는 가상의 안내자처럼 방문 의도를 읽고, 필요한 섹션과 CTA를 즉시 안내하는 인터랙티브 경험 레이어입니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                id="section-demo"
                type="button"
                className="min-h-[48px] rounded-full bg-ink px-5 font-extrabold text-white"
              >
                데모 보기
              </button>
              <button
                id="section-contact"
                type="button"
                className="min-h-[48px] rounded-full border border-black/10 bg-white px-5 font-extrabold text-ink"
              >
                도입 상담
              </button>
            </div>
          </div>
          <div className="grid min-h-[400px] content-end rounded-[36px] bg-gradient-to-br from-ink to-accent p-6 text-white shadow-[0_36px_110px_rgba(7,20,39,0.24)]">
            <div className="rounded-[26px] border border-white/20 bg-white/15 p-6 backdrop-blur">
              <strong className="mb-2 block text-2xl font-black tracking-tight">
                Interactive Sales Guide
              </strong>
              <span className="text-sm opacity-90">
                Static homepage → intent-aware guided sales journey
              </span>
            </div>
          </div>
        </section>

        <section
          className="grid gap-5 px-6 pb-44 md:grid-cols-3 md:px-16"
          aria-label="홈페이지 본문 카드"
        >
          <article
            id="section-proof"
            className="min-h-[220px] rounded-[28px] border border-black/10 bg-white p-7 shadow-[0_16px_50px_rgba(7,20,39,0.06)]"
          >
            <h2 className="mb-3 text-xl font-black tracking-tight">성과와 근거</h2>
            <p className="m-0 text-mist leading-[1.62]">
              관심도가 올라간 방문자에게는 제품 설명보다 먼저 신뢰 근거와 사례를 보여줍니다.
            </p>
          </article>
          <article className="min-h-[220px] rounded-[28px] border border-black/10 bg-white p-7 shadow-[0_16px_50px_rgba(7,20,39,0.06)]">
            <h2 className="mb-3 text-xl font-black tracking-tight">접근 방식</h2>
            <p className="m-0 text-mist leading-[1.62]">
              팀 작업 흐름을 그대로 두고도 도입할 수 있는, 임베드 우선의 가벼운 인터랙션 레이어입니다.
            </p>
          </article>
          <article className="min-h-[220px] rounded-[28px] border border-black/10 bg-white p-7 shadow-[0_16px_50px_rgba(7,20,39,0.06)]">
            <h2 className="mb-3 text-xl font-black tracking-tight">전환 연결</h2>
            <p className="m-0 text-mist leading-[1.62]">
              충분히 설득된 방문자를 상담·데모·자료 요청 같은 실제 행동으로 연결합니다.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}

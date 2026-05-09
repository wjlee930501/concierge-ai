import type { JSX } from "react";

// motionlabs.kr 구조를 React로 재구성한 호스트 페이지 미리보기.
// 본 클론은 widget이 실제 모션랩스 홈페이지에 임베드됐을 때 어떻게 보일지
// 검증하기 위한 dev 전용 backdrop이다. 이미지 자산은 placeholder shape로
// 대체했고 (CORS / 자산 license 분리), 사용자 노출 한국어 카피는 모션랩스
// 사이트의 공개 표현을 참고해 재구성했다. 원본 정확한 카피·이미지 동기화는
// embed.js로 production motionlabs.kr DOM에 주입할 때 자연 해소된다.

export function HostPagePreview(): JSX.Element {
  return (
    <div className="font-sans text-ink" data-testid="host-page-preview">
      <SiteHeader />
      <main>
        <HeroSection />
        <ClientCarousel />
        <DoctorTestimonials />
        <AutoReminderSection />
        <CustomContentSection />
        <AnalyticsSection />
        <DemoSection />
        <ResultsSection />
        <AdvisorsSection />
        <SecuritySection />
        <ValidationSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader(): JSX.Element {
  const items = [
    "Re:Visit",
    "New:Visit",
    "Blog",
    "고객사례",
    "회사소개",
    "문의하기"
  ];
  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-block h-7 w-7 rounded-md bg-gradient-to-br from-accent to-ink" />
          <span className="text-base font-black tracking-tight">Re:Visit</span>
          <span className="text-[11px] font-bold text-mist">by MotionLabs</span>
        </div>
        <nav className="hidden gap-6 text-[13px] font-semibold text-mist md:flex">
          {items.map((it) => (
            <a key={it} href="#" className="hover:text-ink">
              {it}
            </a>
          ))}
        </nav>
        <a
          href="#section-contact"
          className="rounded-full bg-ink px-4 py-2 text-[12px] font-extrabold text-white"
        >
          소개서 다운받기
        </a>
      </div>
    </header>
  );
}

function HeroSection(): JSX.Element {
  return (
    <section
      data-mc-section="hero"
      id="section-hero"
      className="relative overflow-hidden bg-gradient-to-br from-white via-bg to-[#eef5ff] px-6 py-20 md:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
            모션랩스 Re:Visit
          </div>
          <h1 className="text-[clamp(34px,5vw,64px)] font-black leading-[1.08] tracking-[-0.04em] text-balance">
            어렵게 유치한 신규 환자,
            <br />
            놓치고 있진 않나요?
          </h1>
          <p className="mt-5 max-w-xl text-[clamp(15px,1.4vw,18px)] leading-[1.7] text-[#3b4d68]">
            매출로 이어지는 환자 관리 솔루션, 리비짓.
            500개+ 병의원이 검증한 알림톡 자동화·맞춤 콘텐츠·재방문 분석을 한
            번에.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#section-demo"
              className="rounded-full bg-ink px-5 py-3 text-[13px] font-extrabold text-white shadow-[0_12px_30px_rgba(7,20,39,0.20)]"
            >
              소개서 다운받기
            </a>
            <a
              href="#section-faq"
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-[13px] font-extrabold text-ink"
            >
              상담 신청하기
            </a>
          </div>
          <div className="mt-8 flex items-center gap-4 text-[12px] text-mist">
            <span className="flex items-center gap-1">
              <Dot color="bg-mint" /> 500+ 병의원 도입
            </span>
            <span className="flex items-center gap-1">
              <Dot color="bg-accent" /> ISO/IEC 27001
            </span>
            <span className="flex items-center gap-1">
              <Dot color="bg-ink" /> 자문 전문의 24명+
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_30px_80px_rgba(7,20,39,0.18)]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent">
                알림톡 미리보기
              </span>
              <span className="text-[10px] text-mist">KakaoTalk</span>
            </div>
            <div className="space-y-2 rounded-xl bg-[#f8f5e6] p-3 text-[12px] leading-snug text-ink">
              <div className="font-bold">[모션랩스 정형외과] 김XX님 안내</div>
              <div className="text-[#444]">
                도수치료 4회차 안내드려요. 진료 다음 날 적정 운동 영상도 함께
                보내드려요.
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button className="rounded-md bg-ink px-2 py-1.5 text-[11px] font-bold text-white">
                  운동 영상 보기
                </button>
                <button className="rounded-md border border-black/10 bg-white px-2 py-1.5 text-[11px] font-bold text-ink">
                  예약 변경
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-mist">
              <span>발송 예약 · 진료 다음날 10:30</span>
              <span>전송 완료 · 98.4%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Dot({ color }: { readonly color: string }): JSX.Element {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}

function ClientCarousel(): JSX.Element {
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

function DoctorTestimonials(): JSX.Element {
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

function AutoReminderSection(): JSX.Element {
  return (
    <section
      data-mc-section="auto-reminder"
      id="section-auto-reminder"
      className="bg-white px-6 py-24"
    >
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
        <div>
          <SectionEyebrow label="자동 리마인드" />
          <h2 className="mt-3 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.18] tracking-[-0.03em]">
            맞춤형 리마인드로
            <br />
            환자 노쇼를 방지하세요.
          </h2>
          <ul className="mt-6 grid gap-3 text-[14px] text-[#3b4d68]">
            <li className="flex gap-2">
              <CheckMark />
              진료 유형별 리마인드 콘텐츠 자동 매핑
            </li>
            <li className="flex gap-2">
              <CheckMark />
              제목·본문·CTA 버튼 직접 편집 가능
            </li>
            <li className="flex gap-2">
              <CheckMark />
              즉시 / N일 후 / 특정 시각 발송 스케줄링
            </li>
            <li className="flex gap-2">
              <CheckMark />
              발송 결과 대시보드로 한눈에 추적
            </li>
          </ul>
        </div>
        <div className="rounded-[28px] border border-black/5 bg-bg p-6 shadow-[0_18px_40px_rgba(7,20,39,0.06)]">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-accent">
            발송 스케줄
          </div>
          <div className="space-y-3">
            {[
              { when: "즉시", what: "예약 확정 안내", who: "신규 환자" },
              { when: "3일 후 10:30", what: "재방문 리마인드", who: "도수치료 환자" },
              { when: "7일 후 11:00", what: "운동 영상 안내", who: "정형외과 환자" }
            ].map((row) => (
              <div
                key={row.what}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[12px]"
              >
                <div className="font-bold text-ink">{row.what}</div>
                <div className="text-mist">{row.when}</div>
                <div className="text-[10px] font-bold text-accent">{row.who}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CustomContentSection(): JSX.Element {
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
        <div data-mc-section="specialty-tabs" className="mt-8 flex flex-wrap gap-2">
          {tabs.map((t, i) => (
            <span
              data-mc-tab={i === 0 ? "orthopedics" : i === 1 ? "internal-medicine" : undefined}
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

function AnalyticsSection(): JSX.Element {
  return (
    <section
      data-mc-section="data-analysis"
      id="section-analytics"
      className="bg-white px-6 py-24"
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
        <div>
          <SectionEyebrow label="환자 데이터 분석" />
          <h2 className="mt-3 text-[clamp(28px,3.4vw,42px)] font-black leading-[1.18] tracking-[-0.03em]">
            우리 병원의 데이터를 보고
            <br />
            진짜 전략을 세우세요.
          </h2>
          <p className="mt-4 text-[14px] leading-[1.7] text-[#3b4d68]">
            진료과별 재방문율, 객단가, 노쇼율, 메시지 반응률을 한 화면에서.
            CRM 의사결정에 필요한 단 한 장의 인사이트.
          </p>
        </div>
        <div className="rounded-[28px] border border-black/5 bg-bg p-6 shadow-[0_18px_40px_rgba(7,20,39,0.06)]">
          <div className="mb-3 flex items-center justify-between text-[11px] font-bold text-mist">
            <span>이번 달 인사이트</span>
            <span>2026.05</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { label: "재방문율", value: "+12%", color: "text-accent" },
              { label: "객단가", value: "+19%", color: "text-mint" },
              { label: "노쇼율", value: "−7%", color: "text-ink" },
              { label: "메시지 반응", value: "82%", color: "text-accent" }
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl bg-white px-4 py-3 shadow-[0_6px_18px_rgba(7,20,39,0.06)]"
              >
                <div className="text-[11px] text-mist">{kpi.label}</div>
                <div className={`text-2xl font-black tracking-tight ${kpi.color}`}>
                  {kpi.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoSection(): JSX.Element {
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
            <option>진료과 선택 — 정형외과 / 내과 / 산부인과 / 안과 / 피부과</option>
          </select>
          <select className="rounded-md bg-white/10 px-3 py-2 text-[13px] text-white md:col-span-2">
            <option>리마인드 템플릿 선택 — 도수치료 / 검진 결과 안내 / …</option>
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

function ResultsSection(): JSX.Element {
  const cards = [
    {
      headline: "환자 재방문율 +12%",
      meta: "서울 M 정형외과 · 도입 3개월"
    },
    {
      headline: "주요 항목 매출 +16%",
      meta: "서울 S 정형외과 · 도입 6개월"
    },
    {
      headline: "환자 객단가 +19%",
      meta: "경기 M 내과 · 6개월 전년동기 대비"
    }
  ];
  return (
    <section data-mc-section="case-data" id="section-results" className="bg-bg px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mx-auto max-w-3xl text-center text-[clamp(24px,3vw,36px)] font-black leading-[1.2] tracking-[-0.03em]">
          500개+의 병의원이 경험한 매출 상승과 경영 효율화,
          <br />
          이제 우리 병원의 차례입니다.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map((c, index) => (
            <div
              data-mc-card={
                index === 0 ? "ortho-revisit-12" : index === 2 ? "im-revenue-19" : undefined
              }
              key={c.headline}
              className="rounded-[24px] border border-black/5 bg-white p-6 shadow-[0_18px_40px_rgba(7,20,39,0.06)]"
            >
              <div className="text-[clamp(28px,3vw,36px)] font-black tracking-tight text-accent">
                {c.headline}
              </div>
              <div className="mt-3 text-[12px] text-mist">{c.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdvisorsSection(): JSX.Element {
  const slots = Array.from({ length: 12 });
  return (
    <section data-mc-section="advisors" id="section-advisors" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="mx-auto max-w-3xl text-center text-[clamp(22px,2.6vw,32px)] font-black tracking-tight">
          리비짓은 24명+의 자문 전문의가 함께하는 믿을 수 있는 솔루션입니다.
        </h2>
        <div data-mc-group="ortho-advisors" className="mt-10 grid grid-cols-3 gap-4 md:grid-cols-6">
          {slots.map((_, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-bg to-accent/20" />
              <div className="mt-2 text-[12px] font-bold text-ink">전문의 {i + 1}</div>
              <div className="text-[10px] text-mist">정형외과</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection(): JSX.Element {
  return (
    <section data-mc-section="security" id="section-security" className="bg-bg px-6 py-24">
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

function ValidationSection(): JSX.Element {
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

function FaqSection(): JSX.Element {
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
    <section data-mc-section="faq" id="section-faq" className="bg-bg px-6 py-24">
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

function SiteFooter(): JSX.Element {
  return (
    <footer className="bg-ink px-6 py-12 text-white/70">
      <div className="mx-auto grid max-w-6xl gap-8 text-[12px] md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-white">
            <span className="inline-block h-7 w-7 rounded-md bg-gradient-to-br from-accent to-white/40" />
            <span className="text-base font-black tracking-tight">Re:Visit</span>
            <span className="text-[10px] font-bold text-white/50">by MotionLabs</span>
          </div>
          <div>주식회사 모션랩스 (MotionLabs Inc.)</div>
          <div>대표: 이우진 · 사업자등록번호 466-88-01551</div>
          <div>서울 성동구 아차산로 38, 406호 (성수동1가, 개풍빌딩)</div>
          <div className="mt-2">support@motionlabs.kr · 070-8671-0100</div>
        </div>
        <div>
          <div className="mb-3 font-bold text-white">제품</div>
          <ul className="space-y-1.5">
            <li>Re:Visit</li>
            <li>New:Visit</li>
            <li>Blog</li>
            <li>고객사례</li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-bold text-white">정책</div>
          <ul className="space-y-1.5">
            <li>FAQ</li>
            <li>채용</li>
            <li>이용약관</li>
            <li>개인정보 처리방침</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl text-[11px] text-white/40">
        Copyrightⓒ 2026 Motionlabs. All Rights Reserved.
      </div>
    </footer>
  );
}

function SectionEyebrow(props: {
  readonly label: string;
  readonly tone?: "light" | "dark";
}): JSX.Element {
  const tone = props.tone ?? "light";
  const cls =
    tone === "dark"
      ? "inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-mint"
      : "inline-flex rounded-full border border-accent/20 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent";
  return <div className={cls}>{props.label}</div>;
}

function CheckMark(): JSX.Element {
  return (
    <span className="mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full bg-mint/20 text-center text-[10px] font-black leading-4 text-emerald-700">
      ✓
    </span>
  );
}

function Badge(props: { readonly label: string }): JSX.Element {
  return (
    <div className="flex aspect-square items-center justify-center rounded-2xl border border-black/5 bg-white text-center text-[12px] font-extrabold text-ink shadow-[0_10px_24px_rgba(7,20,39,0.06)]">
      {props.label}
    </div>
  );
}

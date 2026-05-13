import type { JSX } from "react";
import { Dot } from "./primitives";

export function HeroSection(): JSX.Element {
  return (
    <section
      data-concierge-section="hero"
      data-mc-section="hero"
      id="section-hero"
      className="relative overflow-hidden bg-gradient-to-br from-white via-bg to-[#eef5ff] px-6 pb-[360px] pt-20 md:pb-48 md:pt-28"
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent">
            모션랩스 Re:Visit
          </div>
          <h1 className="text-[clamp(34px,5vw,64px)] font-black leading-[1.08] tracking-[-0.04em] text-balance">
            환자 경험 관리가
            <br />곧 병원 경영입니다
          </h1>
          <p className="mt-5 max-w-xl text-[clamp(15px,1.4vw,18px)] leading-[1.7] text-[#3b4d68]">
            매출로 이어지는 환자 관리 솔루션, 리비짓. 500개+ 병의원이 검증한
            알림톡 자동화·맞춤 콘텐츠·재방문 분석을 한 번에.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#section-demo"
              className="rounded-full bg-ink px-5 py-3 text-[13px] font-extrabold text-white shadow-[0_7px_18px_rgba(7,20,39,0.12)]"
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
        <div className="relative hidden md:block">
          <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_18px_48px_rgba(7,20,39,0.10)]">
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

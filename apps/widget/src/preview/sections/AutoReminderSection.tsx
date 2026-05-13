import type { JSX } from "react";
import { SectionEyebrow, CheckMark } from "./primitives";

export function AutoReminderSection(): JSX.Element {
  return (
    <section
      data-concierge-section="revisit"
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
              {
                when: "3일 후 10:30",
                what: "재방문 리마인드",
                who: "도수치료 환자"
              },
              {
                when: "7일 후 11:00",
                what: "운동 영상 안내",
                who: "정형외과 환자"
              }
            ].map((row) => (
              <div
                key={row.what}
                className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[12px]"
              >
                <div className="font-bold text-ink">{row.what}</div>
                <div className="text-mist">{row.when}</div>
                <div className="text-[10px] font-bold text-accent">
                  {row.who}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

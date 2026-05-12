import type { JSX } from "react";

export function SiteFooter(): JSX.Element {
  return (
    <footer className="bg-ink px-6 py-12 text-white/70">
      <div className="mx-auto grid max-w-6xl gap-8 text-[12px] md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-white">
            <span className="inline-block h-7 w-7 rounded-md bg-gradient-to-br from-accent to-white/40" />
            <span className="text-base font-black tracking-tight">
              Re:Visit
            </span>
            <span className="text-[10px] font-bold text-white/50">
              by MotionLabs
            </span>
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

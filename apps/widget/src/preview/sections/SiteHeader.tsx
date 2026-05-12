import type { JSX } from "react";

export function SiteHeader(): JSX.Element {
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

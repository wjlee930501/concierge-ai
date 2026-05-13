import type { JSX } from "react";
import { SiteHeader } from "./sections/SiteHeader";
import { HeroSection } from "./sections/HeroSection";
import { ClientCarousel } from "./sections/ClientCarousel";
import { DoctorTestimonials } from "./sections/DoctorTestimonials";
import { AutoReminderSection } from "./sections/AutoReminderSection";
import { CustomContentSection } from "./sections/CustomContentSection";
import { NewVisitSection } from "./sections/NewVisitSection";
import { AnalyticsSection } from "./sections/AnalyticsSection";
import { DemoSection } from "./sections/DemoSection";
import { ResultsSection } from "./sections/ResultsSection";
import { AdvisorsSection } from "./sections/AdvisorsSection";
import { SecuritySection } from "./sections/SecuritySection";
import { ValidationSection } from "./sections/ValidationSection";
import { FaqSection } from "./sections/FaqSection";
import { SiteFooter } from "./sections/SiteFooter";

// motionlabs.kr 구조를 React로 재구성한 호스트 페이지 미리보기.
// 본 클론은 widget이 실제 모션랩스 홈페이지에 임베드됐을 때 어떻게 보일지
// 검증하기 위한 dev 전용 backdrop이다. 이미지 자산은 placeholder shape로
// 대체했고 (CORS / 자산 license 분리), 사용자 노출 한국어 카피는 모션랩스
// 사이트의 공개 표현을 참고해 재구성했다. 원본 정확한 카피·이미지 동기화는
// embed.js로 production motionlabs.kr DOM에 주입할 때 자연 해소된다.
//
// 본 파일은 ordering + scaffold만 보유한다. 각 섹션 구현은
// `./sections/*` 로 분리되어 있다 (PR#3 widget decomposition).

export function HostPagePreview(): JSX.Element {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-white via-[#f6f9ff] to-[#eef5ff] font-sans text-ink"
      data-testid="host-page-preview"
    >
      <SiteHeader />
      <main>
        <HeroSection />
        <ClientCarousel />
        <DoctorTestimonials />
        <AutoReminderSection />
        <CustomContentSection />
        <NewVisitSection />
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

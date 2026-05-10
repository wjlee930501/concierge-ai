import {
  expect,
  test,
  type Frame,
  type FrameLocator,
  type Page
} from "@playwright/test";

const HERO_COPY =
  "어떤 고민으로 오셨나요? 모션랩스의 솔루션을 상황에 맞게 안내해드릴게요.";
const REVISIT_CHIP = "기존 환자 재방문을 높이고 싶어요";

declare global {
  interface Window {
    __HOST_LAST_LEAD_PAYLOAD__?: unknown;
  }
}

test("기본 진입에서 Concierge Bubble이 표시되고 닫을 수 있다", async ({
  page
}) => {
  const { widget } = await openFixture(page);

  await expect(widget.getByText(HERO_COPY)).toBeVisible();
  await widget
    .getByRole("button", { name: "안내 없이 그냥 둘러보기" })
    .click({ force: true });
  await expect(
    widget.getByRole("button", { name: "Concierge AI 안내 다시 받기" })
  ).toBeVisible();
});

test("Re:Visit Quick Chip이 host scroll, spotlight, popover, lead CTA로 이어진다", async ({
  page
}) => {
  const { widget } = await openFixture(page);

  await startRevisitFlow(page, widget);
  await expect(widget.getByText(/Re:Visit은 진료 후 안내/u)).toBeVisible();
  await expect(
    widget.getByRole("button", { name: "상담 신청하기" })
  ).toBeVisible();
});

test("Lead Form은 필수값과 동의 후 mock submit payload를 남긴다", async ({
  page
}) => {
  const { widget, frame } = await openFixture(page);

  await startRevisitFlow(page, widget);
  await widget
    .getByRole("button", { name: "상담 신청하기" })
    .click({ force: true });

  const submit = widget.getByRole("button", { name: "상담 신청 보내기" });
  await expect(submit).toBeDisabled();

  await widget.getByLabel(/병원명/u).fill("서울OO의원");
  await widget.getByLabel(/이름/u).fill("홍길동");
  await widget.getByLabel(/연락처/u).fill("010-0000-0000");
  await widget.getByLabel(/관심 분야/u).selectOption("revisit");
  await expect(submit).toBeDisabled();

  await widget.getByLabel(/개인정보 수집/u).check();
  await expect(submit).toBeEnabled();
  await submit.click({ force: true });

  await expect(widget.getByText(/상담 신청이 접수되었습니다/u)).toBeVisible();
  const payload = await frame.evaluate(
    () => window.__CONCIERGE_LAST_MOCK_LEAD__
  );
  expect(payload).toMatchObject({
    source: "concierge_ai",
    host: "motionlabs",
    intent: "revisit",
    hospitalName: "서울OO의원",
    name: "홍길동",
    phone: "010-0000-0000",
    interestArea: "revisit",
    consent: true,
    visitedSections: ["hero", "revisit", "contact"]
  });
  const hostLead = await page.evaluate(() => window.__HOST_LAST_LEAD_PAYLOAD__);
  expect(hostLead).toMatchObject({
    lead: {
      source: "concierge_ai",
      host: "motionlabs",
      intent: "revisit",
      hospitalName: "서울OO의원",
      phone: "010-0000-0000",
      consent: true
    }
  });
});

test("mock submit 실패 상태를 UI로 확인할 수 있다", async ({ page }) => {
  const { widget, frame } = await openFixture(page);

  await startRevisitFlow(page, widget);
  await widget
    .getByRole("button", { name: "상담 신청하기" })
    .click({ force: true });
  await frame.evaluate(() => {
    window.__CONCIERGE_MOCK_SUBMIT_SHOULD_FAIL__ = true;
  });
  await widget.getByLabel(/병원명/u).fill("서울OO의원");
  await widget.getByLabel(/이름/u).fill("홍길동");
  await widget.getByLabel(/연락처/u).fill("010-0000-0000");
  await widget.getByLabel(/관심 분야/u).selectOption("revisit");
  await widget.getByLabel(/개인정보 수집/u).check();
  await widget
    .getByRole("button", { name: "상담 신청 보내기" })
    .click({ force: true });

  await expect(widget.getByText(/mock submit 실패 상태입니다/u)).toBeVisible();
});

test("iframe hitbox가 host CTA와 spotlight 영역 클릭을 막지 않는다", async ({
  page
}) => {
  const { widget } = await openFixture(page);

  await page.getByTestId("host-cta").click();
  await expect(page.locator("#host-click-count")).toHaveText("1");

  await startRevisitFlow(page, widget);
  await page.getByTestId("revisit-host-cta").click();
  await expect(page.locator("#revisit-click-count")).toHaveText("1");
});

test("375px 모바일 viewport에서도 chip 선택과 lead form 입력이 가능하다", async ({
  page
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const { widget } = await openFixture(page);

  await widget.getByRole("button", { name: REVISIT_CHIP }).click({
    force: true
  });
  await expect(
    widget.getByRole("button", { name: "상담 신청하기" })
  ).toBeVisible({ timeout: 15_000 });
  await widget
    .getByRole("button", { name: "상담 신청하기" })
    .click({ force: true });
  await widget.getByLabel(/병원명/u).fill("모바일의원");
  await expect(widget.getByLabel(/병원명/u)).toHaveValue("모바일의원");
});

test("prefers-reduced-motion에서는 말풍선 floating loop가 꺼진다", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { widget } = await openFixture(page);

  await expect(widget.locator('[data-testid="speech-pill"]')).toHaveAttribute(
    "data-polish-breathing",
    "false"
  );
});

async function openFixture(page: Page): Promise<{
  readonly widget: FrameLocator;
  readonly frame: Frame;
}> {
  await page.goto("/host-fixture.html");
  await expect(page.locator('[data-testid="embed-host-ready"]')).toHaveText(
    "ready"
  );
  await expect(page.locator("[data-concierge-section]")).toHaveCount(5);
  const widget = page.frameLocator("#concierge-ai-widget");
  await expect(widget.getByText(HERO_COPY)).toBeVisible({ timeout: 9_000 });
  const iframe = await page.locator("#concierge-ai-widget").elementHandle();
  const frame = await iframe?.contentFrame();
  if (frame === null || frame === undefined) {
    throw new Error("Concierge iframe frame was not available");
  }
  return { widget, frame };
}

async function startRevisitFlow(
  page: Page,
  widget: FrameLocator
): Promise<void> {
  await widget.getByRole("button", { name: REVISIT_CHIP }).click({
    force: true
  });
  const revisitSection = page.locator('[data-concierge-section="revisit"]');
  await expect(revisitSection).toHaveClass(/concierge-driver-highlight/u);
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const section = document.querySelector(
          '[data-concierge-section="revisit"]'
        );
        return section?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      })
    )
    .toBeLessThan(520);
  await expect(
    widget.getByRole("button", { name: "상담 신청하기" })
  ).toBeVisible({ timeout: 15_000 });
}

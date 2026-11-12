import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });
});

const closeSheet = async (page: Page) => {
  await page.getByTestId('sheet').getByLabel('close').click({ position: { x: 5, y: 5 } });
  await expect(page.getByTestId('sheet')).toBeHidden();
};
/** Goes back until the phone home screen is showing (the number of screens differs per app). */
const goHome = async (page: Page) => {
  for (let i = 0; i < 5; i++) {
    if (await page.getByTestId('home-screen').isVisible()) return;
    await page.getByTestId('back').first().click();
  }
  await expect(page.getByTestId('home-screen')).toBeVisible();
};

async function investigate(page: Page) {
  await page.goto('/');
  await page.getByTestId('start-case4').click();
  await expect(page.getByTestId('toast')).toBeVisible({ timeout: 6000 });
  // message: E6 (sloppy), sender: E1 (unsaved number) - both point the wrong way
  await page.getByTestId('app-messages').click();
  await page.getByTestId('thread-row-t-driver').click();
  await page.getByTestId('collect-E6').click();
  await page.getByTestId('sender-button').click();
  await page.getByTestId('collect-E1').click();
  await closeSheet(page);
  await goHome(page);
  // orders: E2 (list row) and E3 (details)
  await page.getByTestId('app-orders').click();
  await page.getByTestId('collect-E2').click();
  await page.getByTestId('order-open-o-zahw-3').click();
  await page.getByTestId('collect-E3').click();
  await goHome(page);
  // official site: E4
  await page.getByTestId('app-browser').click();
  await page.getByTestId('bookmark-wathba-official').click();
  await page.getByTestId('site-nav-drivers').click();
  await page.getByTestId('collect-E4').click();
  await goHome(page);
  // call the official number: E5
  await page.getByTestId('app-dialer').click();
  await page.getByTestId('call-920000033').click();
  await expect(page.getByTestId('collect-E5')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('collect-E5').click();
  await page.getByTestId('end-call').click();
  await goHome(page);
}

async function link(page: Page, a: string, b: string, deduction: string) {
  await page.getByTestId('app-notebook').click();
  await page.getByTestId('link-mode').click();
  await page.locator(`[data-evidence-card="${a}"]`).click();
  await page.locator(`[data-evidence-card="${b}"]`).click();
  await expect(page.locator(`[data-deduction="${deduction}"]`)).toBeVisible();
}

async function stamp(page: Page, verdict: 'scam' | 'legit', proof: string) {
  await page.getByTestId('go-verdict').click();
  await page.getByTestId(`verdict-${verdict}`).click();
  await page.getByTestId(`proof-${proof}`).click();
  const slider = page.getByRole('slider');
  await slider.focus();
  await slider.press('ArrowRight');
  await page.getByTestId('stamp-verdict').click();
}

test('case 4 (legit): proving it is genuine, best decision, and the legit debrief', async ({ page }) => {
  await investigate(page);
  await link(page, 'E2', 'E3', 'D1');
  await stamp(page, 'legit', 'D1');
  await expect(page.getByTestId('verdict-outcome-full')).toBeVisible();
  await page.getByTestId('to-decision').click();
  await page.getByTestId('decision-check-app-then-door').click();
  await expect(page.getByTestId('other-channel-badge')).toBeVisible();
  await expect(page.getByTestId('to-debrief')).toContainText(/ليش كانت سليمة|Why was it genuine/);
  await page.getByTestId('to-debrief').click();
  await expect(page.getByTestId('legit-note')).toBeVisible();
  await expect(page.getByTestId('misleading-reveal')).toBeVisible();
});

test('case 4: judging it a scam is wrong, and ignoring a genuine message has a cost', async ({ page }) => {
  await investigate(page);
  await link(page, 'E2', 'E3', 'D1');
  await stamp(page, 'scam', 'D1');
  await expect(page.getByTestId('verdict-outcome-wrong')).toBeVisible();
  await page.getByTestId('to-decision').click();
  await page.getByTestId('decision-ignore').click();
  await expect(page.getByTestId('outcome-rating-risky')).toBeVisible();
});

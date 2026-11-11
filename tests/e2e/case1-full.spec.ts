import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
  });
});

const seriousViolations = async (page: Page) => {
  const r = await new AxeBuilder({ page }).analyze();
  return r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
};

async function closeSheet(page: Page) {
  await page.getByTestId('sheet').getByLabel('close').click({ position: { x: 5, y: 5 } });
  await expect(page.getByTestId('sheet')).toBeHidden();
}

/** Collects E1 (sender), E2 (link) then E3/E4 (orders), links E3+E4 and returns to the notebook. */
async function investigateBest(page: Page) {
  await expect(page.getByTestId('toast')).toBeVisible({ timeout: 6000 });
  await page.getByTestId('app-messages').click();
  await page.getByTestId('thread-row-t-rafeef').click();
  await page.getByTestId('sender-button').click();
  await page.getByTestId('collect-E1').click();
  await closeSheet(page);
  await page.getByTestId('link-L1').click();
  await page.getByTestId('collect-E2').click();
  await closeSheet(page);
  await page.getByTestId('back').first().click();
  await page.getByTestId('back').first().click();

  await page.getByTestId('app-orders').click();
  await page.getByTestId('collect-E3').click(); // summary row: "there is an order" (misleading)
  await page.getByTestId('order-open-o-zahw-1').click();
  await page.getByTestId('collect-E4').click(); // details: a different carrier
  await page.getByTestId('back').first().click();
  await page.getByTestId('back').first().click();

  await page.getByTestId('app-notebook').click();
  await page.getByTestId('link-mode').click();
  await page.locator('[data-evidence-card="E3"]').click();
  await page.locator('[data-evidence-card="E4"]').click();
  await expect(page.locator('[data-deduction="D1"]')).toBeVisible();
}

async function playVerdictAndDecision(page: Page, decisionId: string) {
  await page.getByTestId('go-verdict').click();
  await page.getByTestId('verdict-scam').click();
  await page.getByTestId('proof-D1').click();
  const slider = page.getByRole('slider');
  await slider.focus();
  await slider.press('ArrowRight');
  await page.getByTestId('stamp-verdict').click();
  await expect(page.getByTestId('verdict-result')).toBeVisible();
  await page.getByTestId('to-decision').click();
  await page.getByTestId(`decision-${decisionId}`).click();
}

test('case 1 best path: evidence -> deduction -> verdict -> best decision -> debrief', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-case1').click();
  await investigateBest(page);
  expect(await seriousViolations(page)).toEqual([]);
  await playVerdictAndDecision(page, 'official-app-report');
  await expect(page.getByTestId('outcome-screen')).toContainText('وثبة');
  await page.getByTestId('to-debrief').click();
  await expect(page.getByTestId('debrief-screen')).toBeVisible();
});

test('case 1 worst path: paying is rated harmful and costs money', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-case1').click();
  await investigateBest(page);
  await playVerdictAndDecision(page, 'pay');
  await expect(page.getByTestId('effects')).toContainText('2,300');
});

test('paper theme can be chosen from the in-phone Settings app', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-case1').click();
  await page.getByTestId('app-settings').click();
  await page.getByTestId('setting-theme-light').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await seriousViolations(page)).toEqual([]);
  await page.getByTestId('setting-theme-dark').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

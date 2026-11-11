import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Smoke path from phase 0: intro -> case 1 -> message -> sender sheet -> link
 * inspector -> notebook. Also RTL screenshots and an axe scan. The tester
 * extends this with best/worst paths per case in later phases.
 */

test.beforeEach(async ({ page }) => {
  // Deterministic screenshots: no drifting background or flying notes.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
  });
});

test('intro renders in Arabic RTL with no critical a11y violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByTestId('start-game')).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  await expect(page).toHaveScreenshot('intro.png', { fullPage: true });
});

test('case 1: message arrives, evidence can be collected into the notebook', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-case1').click();
  await expect(page.getByTestId('phone')).toBeVisible();
  await expect(page.getByTestId('toast')).toBeVisible({ timeout: 5000 });

  await page.getByTestId('app-messages').click();
  await page.getByTestId('thread-row-t-rafeef').click();
  await expect(page.getByTestId('msg-m-rafeef-1')).toContainText('رفيف إكسبرس');

  // Sender sheet -> E1
  await page.getByTestId('sender-button').click();
  await expect(page.getByTestId('sender-sheet')).toBeVisible();
  await page.getByTestId('collect-E1').click();
  await expect(page.getByTestId('collect-E1')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('sheet').getByLabel('close').click({ position: { x: 5, y: 5 } });
  await expect(page.getByTestId('sheet')).toBeHidden();

  // Link inspector -> E2 (never navigates away)
  await page.getByTestId('link-L1').click();
  await expect(page.getByTestId('link-sheet')).toBeVisible();
  await expect(page.getByTestId('url-breakdown')).toContainText('rafeef-express-pay.example');
  await page.getByTestId('collect-E2').click();
  expect(page.url()).toContain('localhost');
  await page.getByTestId('sheet').getByLabel('close').click({ position: { x: 5, y: 5 } });
  await expect(page.getByTestId('sheet')).toBeHidden();

  // Notebook shows both cards
  await page.getByTestId('back').first().click();
  await page.getByTestId('back').first().click();
  await page.getByTestId('app-notebook').click();
  await expect(page.locator('[data-evidence-card="E1"]')).toBeVisible();
  await expect(page.locator('[data-evidence-card="E2"]')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  await expect(page).toHaveScreenshot('notebook.png');
});

test('no real external links or tel: anchors are rendered', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-case1').click();
  await page.getByTestId('app-messages').click();
  await page.getByTestId('thread-row-t-rafeef').click();
  const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
  expect(hrefs.filter((h) => !h.startsWith('#'))).toEqual([]);
});

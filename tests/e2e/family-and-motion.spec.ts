import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });
});

test('family card opens from the intro, has 3 questions + the other-channel habit, and passes axe', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('open-family-card').click();
  await expect(page.getByTestId('family-card')).toBeVisible();
  await expect(page.getByTestId('family-general').locator('li')).toHaveCount(3);
  await expect(page.getByTestId('family-habit')).toBeVisible();
  await expect(page.getByTestId('family-print')).toBeVisible();
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
});

test('family mode link plays one case', async ({ page }) => {
  await page.goto('/?mode=family&case=case2');
  await expect(page.getByTestId('phone')).toBeVisible();
  await expect(page.getByTestId('case-context')).toContainText('انتحال');
});

test('reduced motion: evidence still collects and nothing is left flying', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByTestId('start-case1').click();
  await expect(page.getByTestId('toast')).toBeVisible({ timeout: 6000 });
  await page.getByTestId('app-messages').click();
  await page.getByTestId('thread-row-t-rafeef').click();
  await page.getByTestId('sender-button').click();
  await page.getByTestId('collect-E1').click();
  await expect(page.getByTestId('collect-E1')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('flying-evidence')).toHaveCSS('opacity', '0');
});

test('with motion on, the evidence note flies and ends hidden', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-case1').click();
  await expect(page.getByTestId('toast')).toBeVisible({ timeout: 6000 });
  await page.getByTestId('app-messages').click();
  await page.getByTestId('thread-row-t-rafeef').click();
  await page.getByTestId('sender-button').click();
  await page.getByTestId('collect-E1').click();
  await expect(page.getByTestId('flying-evidence')).toHaveCSS('opacity', '0', { timeout: 3000 });
});

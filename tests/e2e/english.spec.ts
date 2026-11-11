import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('?lang=en switches to a left-to-right English UI without serious a11y issues', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await page.goto('/?lang=en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Real or Ruse?');
  await page.getByTestId('start-case1').click();
  await expect(page.getByTestId('toast')).toBeVisible({ timeout: 6000 });
  await expect(page.getByTestId('toast')).toContainText('Rafeef Express');
  const r = await new AxeBuilder({ page }).analyze();
  expect(r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  await expect(page).toHaveScreenshot('english-case.png');
});

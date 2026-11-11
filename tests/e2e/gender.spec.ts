import { test, expect } from '@playwright/test';

test('a boy can pick "ولد" on the intro and the game addresses him in the masculine', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      if (!sessionStorage.getItem('c')) {
        localStorage.clear();
        sessionStorage.setItem('c', '1');
      }
    } catch {
      /* ignore */
    }
  });
  await page.goto('/');
  await expect(page.getByTestId('start-game')).toContainText('ابدئي');
  await page.getByTestId('gender-m').click();
  await expect(page.getByTestId('start-game')).toContainText('ابدأ');
  await expect(page.getByTestId('gender-m')).toHaveAttribute('aria-checked', 'true');
  await page.reload();
  await expect(page.getByTestId('start-game')).toContainText('ابدأ'); // remembered
  await page.getByTestId('start-game').click();
  await expect(page.getByTestId('toast')).toBeVisible({ timeout: 6000 });
  await expect(page.getByTestId('toast')).toContainText('سدّد');
  await expect(page.getByTestId('toast')).not.toContainText('سدّدي');
});

test('the picker is hidden in English', async ({ page }) => {
  await page.goto('/?lang=en');
  await expect(page.getByTestId('gender-picker')).toHaveCount(0);
});

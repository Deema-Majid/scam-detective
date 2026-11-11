import { test, expect } from '@playwright/test';

// Clear storage once per test (not on every navigation), so state survives goto/reload.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      if (!sessionStorage.getItem('e2e-cleared')) {
        localStorage.clear();
        sessionStorage.setItem('e2e-cleared', '1');
      }
    } catch {
      /* ignore */
    }
  });
});

test('family link then the plain link starts a normal session on the intro', async ({ page }) => {
  await page.goto('/?mode=family&case=case2');
  await expect(page.getByTestId('phone')).toBeVisible();
  await page.goto('/');
  await expect(page.getByTestId('open-family-card')).toBeVisible();
  await expect(page.getByTestId('phone')).toHaveCount(0);
});

test('tester link then the plain link starts a normal session on the intro', async ({ page }) => {
  await page.goto('/?tester=1');
  await expect(page.getByTestId('tester-code-screen')).toBeVisible();
  await page.goto('/');
  await expect(page.getByTestId('open-family-card')).toBeVisible();
  await expect(page.getByTestId('tester-code-screen')).toHaveCount(0);
});

test('reloading inside tester mode resumes where the player was', async ({ page }) => {
  await page.goto('/?tester=1');
  await page.getByTestId('tester-code-input').fill('t427');
  await page.getByTestId('age-16-18').click();
  await page.getByTestId('tester-code-next').click();
  await expect(page.getByTestId('consent-screen')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('consent-screen')).toBeVisible();
});

test('family mode has an exit button that returns to the intro and drops the URL param', async ({ page }) => {
  await page.goto('/?mode=family&case=case1');
  await expect(page.getByTestId('phone')).toBeVisible();
  await page.locator('[data-testid^="family-exit"]:visible').click();
  await expect(page.getByTestId('open-family-card')).toBeVisible();
  expect(page.url()).not.toContain('mode=family');
  await page.reload();
  await expect(page.getByTestId('open-family-card')).toBeVisible();
  await expect(page.getByTestId('phone')).toHaveCount(0);
});

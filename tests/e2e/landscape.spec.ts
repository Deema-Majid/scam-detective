import { test, expect } from '@playwright/test';

/** A landscape phone (short window) must get the full-height phone, not a ~200px framed one. */
for (const [w, h] of [[667, 375], [844, 390]]) {
  test(`landscape ${w}x${h}: the phone uses the whole height`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('/');
    await page.getByTestId('start-case1').tap();
    await expect(page.getByTestId('phone')).toBeVisible();
    const box = await page.getByTestId('phone').boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(h - 2);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    expect(sw).toBe(true);
    await ctx.close();
  });
}

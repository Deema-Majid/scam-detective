import { test, expect } from '@playwright/test';

/** The confidence slider must grow to the RIGHT in both languages, and the yellow fill must end at the thumb. */
for (const lang of ['ar', 'en']) {
  test(`confidence slider direction and fill (${lang})`, async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.clear();
      } catch {
        /* ignore */
      }
    });
    await page.goto(`/?lang=${lang}`);
    await page.getByTestId('start-case1').click();
    await expect(page.getByTestId('toast')).toBeVisible({ timeout: 6000 });
    await page.getByTestId('app-messages').click();
    await page.getByTestId('thread-row-t-rafeef').click();
    await page.getByTestId('sender-button').click();
    await page.getByTestId('collect-E1').click();
    await page.getByTestId('sheet').getByLabel('close').click({ position: { x: 5, y: 5 } });
    await page.getByTestId('link-L1').click();
    await page.getByTestId('collect-E2').click();
    await page.getByTestId('sheet').getByLabel('close').click({ position: { x: 5, y: 5 } });
    await page.getByTestId('back').first().click();
    await page.getByTestId('back').first().click();
    await page.getByTestId('app-notebook').click();
    await page.getByTestId('go-verdict').click();
    await page.getByTestId('verdict-scam').click();

    const slider = page.getByRole('slider');
    const box = await slider.boundingBox();
    expect(box).not.toBeNull();
    const y = box!.y + box!.height / 2;
    // Drag from the middle to the far RIGHT: confidence must go UP to 100.
    await page.mouse.move(box!.x + box!.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width - 2, y, { steps: 8 });
    await page.mouse.up();
    await expect(slider).toHaveValue('100');
    // And to the far LEFT: down to 50.
    await page.mouse.move(box!.x + box!.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(box!.x + 2, y, { steps: 8 });
    await page.mouse.up();
    await expect(slider).toHaveValue('50');
    // Thumb and fill agree: at 75 the fill is 50% of the track.
    await slider.focus();
    for (let i = 0; i < 5; i++) await slider.press('ArrowRight');
    await expect(slider).toHaveValue('75');
    const fill = await slider.evaluate((el) => (el as HTMLElement).style.getPropertyValue('--fill'));
    expect(fill).toBe('50%');
  });
}

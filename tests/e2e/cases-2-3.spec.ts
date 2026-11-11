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

async function closeSheet(page: Page) {
  await page.getByTestId('sheet').getByLabel('close').click({ position: { x: 5, y: 5 } });
  await expect(page.getByTestId('sheet')).toBeHidden();
}
const backToHome = async (page: Page) => {
  await page.getByTestId('back').first().click();
  await page.getByTestId('back').first().click();
};

async function verdictAndDecision(page: Page, proof: string, decisionId: string) {
  await page.getByTestId('go-verdict').click();
  await page.getByTestId('verdict-scam').click();
  await page.getByTestId(`proof-${proof}`).click();
  const slider = page.getByRole('slider');
  await slider.focus();
  await slider.press('ArrowRight');
  await page.getByTestId('stamp-verdict').click();
  await page.getByTestId('to-decision').click();
  await page.getByTestId(`decision-${decisionId}`).click();
}

test('case 2: old chat + old number expose the impersonation; the bank alert is a distractor', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-case2').click();
  await expect(page.getByTestId('toast')).toBeVisible({ timeout: 6000 });
  await page.getByTestId('app-chats').click();

  // New number: E4 on the second message, E1 from the sender sheet, E6 by asking a personal question.
  await page.getByTestId('thread-row-t-newnum').click();
  await page.getByTestId('collect-E4').click();
  await page.getByTestId('reply-r-cat').click();
  await page.getByTestId('collect-E6').click();
  await page.getByTestId('sender-button').click();
  await page.getByTestId('collect-E1').click();
  await closeSheet(page);
  await backToHome(page);

  // Old chat with Reema: E2 (whole thread) and E3 (message from the old number).
  await page.getByTestId('app-chats').click();
  await page.getByTestId('thread-row-t-reema').click();
  await page.getByTestId('collect-E2').click();
  await page.getByTestId('collect-E3').click();
  await backToHome(page);

  // Call the OLD saved number: E5.
  await page.getByTestId('app-dialer').click();
  await page.getByTestId('call-0500000021').click();
  await expect(page.getByTestId('collect-E5')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('collect-E5').click();
  await page.getByTestId('end-call').click();
  await page.getByTestId('back').first().click();

  await page.getByTestId('app-notebook').click();
  await page.getByTestId('link-mode').click();
  await page.locator('[data-evidence-card="E3"]').click();
  await page.locator('[data-evidence-card="E2"]').click();
  await expect(page.locator('[data-deduction="D1"]')).toBeVisible();

  await verdictAndDecision(page, 'D1', 'call-old-tell-family');
  await page.getByTestId('to-debrief').click();
  await expect(page.getByTestId('debrief-screen')).toBeVisible();
});

test('case 3 reached through the intro list is playable and the distractor note is absent', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-case3').click();
  await expect(page.getByTestId('toast')).toBeVisible({ timeout: 6000 });
  await page.getByTestId('app-messages').click();
  await page.getByTestId('thread-row-t-rewards').click();
  await page.getByTestId('sender-button').click();
  await page.getByTestId('collect-E1').click();
  await closeSheet(page);
  // Opening the claim link inside the simulation triggers the bank OTP message (event interrupt).
  await page.getByTestId('link-L1').click();
  await page.getByTestId('collect-E2').click();
  await page.getByTestId('open-in-sim').click();
  await expect(page.getByTestId('toast')).toBeVisible({ timeout: 8000 });
  await expect(page.getByTestId('toast')).toContainText('4821');
});

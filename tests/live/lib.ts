import { expect, type Page } from '@playwright/test';

export const B = '/scam-detective/';
export const URLS = {
  normal: B,
  tester: B + '?tester=1',
  family1: B + '?mode=family&case=case1',
  family2: B + '?mode=family&case=case2',
  family3: B + '?mode=family&case=case3',
  en: B + '?lang=en',
};

export async function fresh(page: Page, url = B) {
  await page.goto(B);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

export async function closeSheet(page: Page) {
  await page.getByTestId('sheet').getByLabel('close').click({ position: { x: 5, y: 5 } });
  await expect(page.getByTestId('sheet')).toBeHidden();
}
export const back = async (page: Page, n = 1) => { for (let i = 0; i < n; i++) await page.getByTestId('back').first().click(); };
export const home = async (page: Page) => { while (!(await page.getByTestId('home-screen').isVisible())) { await page.getByTestId('back').first().click(); } };

export async function toastWait(page: Page) { await expect(page.getByTestId('toast')).toBeVisible({ timeout: 20000 }); }

export async function linkPair(page: Page, a: string, b: string) {
  await page.getByTestId('app-notebook').click();
  await page.getByTestId('link-mode').click();
  await page.locator(`[data-evidence-card="${a}"]`).click();
  await page.locator(`[data-evidence-card="${b}"]`).click();
}

/** Case 1: E1,E2 (+E3,E4 -> D1). */
export async function case1Core(page: Page) {
  await toastWait(page);
  await page.getByTestId('app-messages').click();
  await page.getByTestId('thread-row-t-rafeef').click();
  await page.getByTestId('sender-button').click();
  await page.getByTestId('collect-E1').click();
  await closeSheet(page);
  await page.getByTestId('link-L1').click();
  await page.getByTestId('collect-E2').click();
  await closeSheet(page);
  await back(page, 2);
  await page.getByTestId('app-orders').click();
  await page.getByTestId('collect-E3').click();
  await page.getByTestId('order-open-o-zahw-1').click();
  await page.getByTestId('collect-E4').click();
  await back(page, 2);
  await linkPair(page, 'E3', 'E4');
  await expect(page.locator('[data-deduction="D1"]')).toBeVisible();
}

export async function case2Core(page: Page) {
  await toastWait(page);
  await page.getByTestId('app-chats').click();
  await page.getByTestId('thread-row-t-newnum').click();
  await page.getByTestId('collect-E4').click();
  await page.getByTestId('reply-r-cat').click();
  await page.getByTestId('collect-E6').click();
  await page.getByTestId('sender-button').click();
  await page.getByTestId('collect-E1').click();
  await closeSheet(page);
  await back(page, 2);
  await page.getByTestId('app-chats').click();
  await page.getByTestId('thread-row-t-reema').click();
  await page.getByTestId('collect-E2').click();
  await page.getByTestId('collect-E3').click();
  await back(page, 2);
  await page.getByTestId('app-dialer').click();
  await page.getByTestId('call-0500000021').click();
  await expect(page.getByTestId('collect-E5')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('collect-E5').click();
  await page.getByTestId('end-call').click();
  await back(page);
  await linkPair(page, 'E3', 'E2');
  await expect(page.locator('[data-deduction="D1"]')).toBeVisible();
}

export async function case3Core(page: Page) {
  await toastWait(page);
  await page.getByTestId('app-messages').click();
  await page.getByTestId('thread-row-t-rewards').click();
  await page.getByTestId('sender-button').click();
  await page.getByTestId('collect-E1').click();
  await closeSheet(page);
  await page.getByTestId('link-L1').click();
  await page.getByTestId('collect-E2').click();
  await page.getByTestId('open-in-sim').click();
  await home(page);
  await page.getByTestId('app-browser').click();
  await page.getByTestId('bookmark-lamha-official').click();
  await page.getByTestId('site-nav-contests').click();
  await page.getByTestId('collect-E3').click();
  await home(page);
  await page.getByTestId('app-orders').click();
  await page.getByTestId('orders-tab-contests').click();
  await page.getByTestId('collect-E4').click();
  await home(page);
  await linkPair(page, 'E3', 'E4');
  await expect(page.locator('[data-deduction="D1"]')).toBeVisible();
}

export const CORE = { case1: case1Core, case2: case2Core, case3: case3Core } as const;

export async function verdict(page: Page, o: { truth: 'scam' | 'legit'; proof: string[]; conf: number }) {
  await page.getByTestId('go-verdict').click();
  await page.getByTestId(`verdict-${o.truth}`).click();
  for (const p of o.proof) await page.getByTestId(`proof-${p}`).click();
  await page.getByTestId('confidence').fill(String(o.conf));
  await page.getByTestId('stamp-verdict').click();
  await expect(page.getByTestId('verdict-result')).toBeVisible();
}

export async function screenText(page: Page, id: string) {
  return (await page.getByTestId(id).innerText()).replace(/\s+/g, ' ');
}

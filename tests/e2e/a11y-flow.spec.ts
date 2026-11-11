import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility of the case screens: axe (serious/critical = 0) on the notebook,
 * verdict, decision, outcome (+ what-if), debrief, summary, and the sheet focus
 * rules (focus moves in, Tab is trapped, Escape closes and returns focus, the
 * background is inert). Also the physical keyboard on the dialer keypad.
 * State is seeded through localStorage so each screen opens directly.
 */
const base = (caseId: string, phase: string, extra: Record<string, unknown> = {}) => ({
  caseId, phase, startedAt: 1, collected: ['E1', 'E2'], deductions: ['D1'], toolsUsed: ['sender', 'link'], openedLinks: [], interruptFired: true, ...extra,
});
const verdict = { truth: 'scam', confidence: 0.8, proof: ['D1'] };
const done2 = { ...base('case2', 'debrief', { finishedAt: 61000, verdict, decisionId: 'call-old-tell-family' }) };

async function seed(page: Page, lang: 'ar' | 'en', run: Record<string, unknown> | null, screen = 'case') {
  const runs: Record<string, unknown> = { case2: done2 };
  if (run) runs.case1 = run;
  await page.addInitScript(
    ([game, settings]) => {
      if (!sessionStorage.getItem('seeded')) {
        sessionStorage.setItem('seeded', '1');
        localStorage.setItem('sd-game', JSON.stringify({ state: { startedAt: 1, caseOrder: ['case1', 'case2', 'case3'], techniqueMap: {}, mode: 'normal', ...game }, version: 1 }));
        localStorage.setItem('sd-settings', JSON.stringify({ state: settings, version: 0 }));
      }
    },
    [{ screen, currentCaseId: run ? 'case1' : undefined, runs }, { lang, theme: 'dark', gender: 'f', sound: false, reducedMotion: true }] as const,
  );
  await page.goto(lang === 'en' ? '/?lang=en' : '/');
}

async function serious(page: Page) {
  const r = await new AxeBuilder({ page }).analyze();
  return r.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
}

const SCREENS: [string, Record<string, unknown> | null, string, string][] = [
  ['verdict', base('case1', 'verdict'), 'case', 'verdict-screen'],
  ['verdict result', base('case1', 'decision', { verdict }), 'case', 'verdict-result'],
  ['outcome', base('case1', 'outcome', { verdict, decisionId: 'pay' }), 'case', 'outcome-screen'],
  ['debrief', base('case1', 'debrief', { verdict, decisionId: 'official-app-report' }), 'case', 'debrief-screen'],
  ['summary', null, 'summary', 'summary-screen'],
];

for (const lang of ['ar', 'en'] as const) {
  for (const [name, run, screen, testid] of SCREENS) {
    test(`axe: ${name} has no serious/critical violations (${lang})`, async ({ page }) => {
      await seed(page, lang, run, screen);
      await expect(page.getByTestId(testid)).toBeVisible();
      await page.waitForTimeout(300);
      expect(await serious(page)).toEqual([]);
      if (screen === 'case') {
        await expect(page.locator('main')).toHaveCount(1);
        await expect(page.locator('h1')).toHaveCount(1);
      }
    });
  }

  test(`axe: outcome with what-if open (${lang})`, async ({ page }) => {
    await seed(page, lang, base('case1', 'outcome', { verdict, decisionId: 'pay' }));
    await page.getByTestId('what-if').click();
    await expect(page.getByTestId('alt-timelines')).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });

  test(`axe: decision choices (${lang})`, async ({ page }) => {
    await seed(page, lang, base('case1', 'decision', { verdict }));
    await page.getByTestId('to-decision').click();
    await expect(page.getByTestId('decision-screen')).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });

  test(`axe: notebook (${lang})`, async ({ page }) => {
    await seed(page, lang, base('case1', 'investigating'));
    await page.getByTestId('app-notebook').click();
    await expect(page.getByTestId('notebook')).toBeVisible();
    expect(await serious(page)).toEqual([]);
  });
}

test('sheet: focus moves in, Tab is trapped, background is inert, Escape closes and restores focus', async ({ page }) => {
  await seed(page, 'ar', base('case1', 'investigating', { collected: [], deductions: [] }));
  await page.getByTestId('app-messages').click();
  await page.getByTestId('thread-row-t-rafeef').click();
  const opener = page.getByTestId('sender-button');
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeFocused();
  // Tab many times: focus never leaves the dialog.
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  }
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
  // Background is inert.
  expect(await page.evaluate(() => document.querySelectorAll('[inert]').length)).toBeGreaterThan(0);
  // Collecting disables the button; Escape must still work.
  await page.getByTestId('collect-E1').click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('sheet')).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.evaluate(() => document.querySelectorAll('[inert]').length)).toBe(0);
});

test('dialer: physical keyboard types digits, Backspace deletes, Enter calls', async ({ page }) => {
  await seed(page, 'ar', base('case1', 'investigating', { collected: [], deductions: [] }));
  await page.getByTestId('app-dialer').click();
  await page.keyboard.press('9');
  await page.keyboard.press('2');
  await page.keyboard.press('0');
  await page.keyboard.press('5');
  await page.keyboard.press('Backspace');
  await expect(page.getByTestId('keypad-display')).toHaveText('920');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('end-call')).toBeVisible();
});

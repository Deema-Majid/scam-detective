import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * Tester mode end to end (build-plan §15.2/15.4): code -> consent -> pre-test ->
 * (cases) -> post-test -> feedback -> results code. The three cases are injected
 * as finished runs through localStorage so the test stays fast; the cases
 * themselves are covered by case1-full and cases-2-3. The code the screen shows
 * is saved to test-results/ so analysis/analyze.py can be run on it.
 */
async function answerTest(page: Page, which: 'pre' | 'post') {
  await expect(page.getByTestId(`${which}test-screen`)).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.getByTestId('test-verdict-scam').click();
    const slider = page.getByRole('slider');
    await slider.focus();
    await slider.press('ArrowRight');
    await page.getByTestId('test-actions').locator('button').nth(2).click();
    await page.getByTestId('test-next').click();
  }
}

test('tester flow produces a results code', async ({ page }) => {
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
  await page.goto('/?tester=1');
  await expect(page.getByTestId('tester-code-screen')).toBeVisible();
  await page.getByTestId('tester-code-input').fill('t427');
  await page.getByTestId('age-16-18').click();
  await page.getByTestId('tester-code-next').click();

  await expect(page.getByTestId('consent-screen')).toBeVisible();
  await page.getByTestId('consent-agree').check();
  await page.getByTestId('consent-start').click();

  await answerTest(page, 'pre');

  // Inject finished case runs, then continue from the post-test like the real game would.
  await page.evaluate(() => {
    const raw = localStorage.getItem('sd-game');
    const parsed = raw ? JSON.parse(raw) : { state: {}, version: 1 };
    const mk = (caseId: string, proof: string[], decisionId: string) => ({
      caseId,
      phase: 'debrief',
      startedAt: 1,
      finishedAt: 61000,
      collected: ['E1', 'E2'],
      deductions: proof,
      toolsUsed: ['sender', 'link'],
      openedLinks: [],
      interruptFired: true,
      verdict: { truth: 'scam', confidence: 0.8, proof },
      decisionId,
    });
    parsed.state.runs = {
      case1: mk('case1', ['D1'], 'official-app-report'),
      case2: mk('case2', ['D1'], 'call-old-tell-family'),
      case3: mk('case3', ['D1'], 'refuse-freeze-report'),
    };
    // What nextCase() does after the last case in tester mode (covered by tests/unit/gameStore.test.ts).
    parsed.state.post = { form: parsed.state.tester.forms.post, answers: [], startedAt: 2 };
    parsed.state.screen = 'posttest';
    parsed.state.currentCaseId = undefined;
    localStorage.setItem('sd-game', JSON.stringify(parsed));
  });
  await page.reload();

  await page.getByTestId('test-next').isVisible().catch(() => undefined);
  await answerTest(page, 'post');

  await expect(page.getByTestId('feedback-screen')).toBeVisible();
  for (let i = 0; i < 3; i++) await page.getByTestId(`feedback-open-${i}`).fill(`synthetic answer ${i}`);
  for (let i = 0; i < 5; i++) await page.getByTestId(`feedback-likert-${i}-4`).click();
  await page.getByTestId('feedback-submit').click();

  await expect(page.getByTestId('results-code-screen')).toBeVisible();
  const code = (await page.getByTestId('results-code').inputValue()).trim();
  expect(code).toMatch(/^SD[01]\.[A-Za-z0-9_-]+$/);
  expect(code).not.toMatch(/t427|T-0427/i); // the code is encoded, not plain text
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/e2e-results-code.txt', code + '\n', 'utf8');
});

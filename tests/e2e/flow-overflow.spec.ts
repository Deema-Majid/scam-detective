import { test, expect, type Page } from '@playwright/test';

/**
 * Every out-of-phone flow screen must fit the viewport width: no horizontal
 * scroll and no visible control outside the screen. Checked in Arabic and
 * English and in both themes. State is injected through localStorage so each
 * screen opens directly (the flows themselves are covered by tester-flow etc.).
 */
const run = (caseId: string, decisionId: string) => ({
  caseId, phase: 'debrief', startedAt: 1, finishedAt: 61000, collected: ['E1', 'E2'], deductions: ['D1'],
  toolsUsed: ['sender', 'link'], openedLinks: [], interruptFired: true,
  verdict: { truth: 'scam', confidence: 0.8, proof: ['D1'] }, decisionId,
});
const runs = {
  case1: run('case1', 'official-app-report'),
  case2: run('case2', 'call-old-tell-family'),
  case3: run('case3', 'refuse-freeze-report'),
};
const tester = { code: 'T-0427', age: '13-15', consentAt: 1, forms: { pre: 'A', post: 'B' } };
const test_ = (form: string) => ({ form, answers: [], startedAt: 1 });
const feedback = { open: ['a', 'b', 'c'], likert: [4, 4, 4, 4, 4] };

type Shape = { url: string; state: Record<string, unknown> };
const SCREENS: Record<string, Shape> = {
  'tester-code': { url: '/?tester=1', state: { mode: 'tester', screen: 'tester-code' } },
  consent: { url: '/?tester=1', state: { mode: 'tester', screen: 'consent', tester: { ...tester, consentAt: undefined } } },
  pretest: { url: '/?tester=1', state: { mode: 'tester', screen: 'pretest', tester, pre: test_('A') } },
  posttest: { url: '/?tester=1', state: { mode: 'tester', screen: 'posttest', tester, pre: test_('A'), post: test_('B'), runs } },
  feedback: { url: '/?tester=1', state: { mode: 'tester', screen: 'feedback', tester, runs } },
  'results-code': { url: '/?tester=1', state: { mode: 'tester', screen: 'results-code', tester, runs, feedback } },
  summary: { url: '/', state: { mode: 'normal', screen: 'summary', runs } },
  'family-card': { url: '/?mode=family&case=case1', state: { mode: 'family', screen: 'family-card', caseOrder: ['case1'], runs: { case1: runs.case1 } } },
};

async function measure(page: Page) {
  const vw = page.viewportSize()!.width;
  return page.evaluate((vw) => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('main *'))) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width <= 1 || r.height <= 1) continue; // sr-only
      if (r.right > vw + 1 || r.left < -1) out.push(`${el.tagName}[${el.getAttribute('data-testid') ?? ''}] ${Math.round(r.left)}..${Math.round(r.right)}`);
    }
    return { scrollWidth: document.documentElement.scrollWidth, vw, out: out.slice(0, 8) };
  }, vw);
}

for (const [name, shape] of Object.entries(SCREENS)) {
  for (const lang of ['ar', 'en'] as const) {
    for (const theme of ['dark', 'light'] as const) {
      test(`no horizontal overflow: ${name} / ${lang} / ${theme}`, async ({ page }) => {
        await page.addInitScript(
          ([game, settings]) => {
            if (!sessionStorage.getItem('seeded')) {
              sessionStorage.setItem('seeded', '1');
              localStorage.setItem('sd-game', JSON.stringify({ state: { startedAt: 1, caseOrder: ['case1', 'case2', 'case3'], runs: {}, techniqueMap: {}, ...game }, version: 1 }));
              localStorage.setItem('sd-settings', JSON.stringify({ state: settings, version: 0 }));
            }
          },
          [shape.state, { lang, theme, gender: 'f', sound: false, reducedMotion: true }] as const,
        );
        await page.goto(shape.url + (lang === 'en' ? (shape.url.includes('?') ? '&' : '?') + 'lang=en' : ''));
        await expect(page.locator('main').first()).toBeVisible();
        await page.waitForTimeout(300);
        const m = await measure(page);
        expect(m.out, `elements outside ${m.vw}px`).toEqual([]);
        expect(m.scrollWidth).toBeLessThanOrEqual(m.vw);
      });
    }
  }
}

test('tester code input fits and age buttons are tappable', async ({ page }) => {
  await page.goto('/?tester=1');
  await page.getByTestId('age-13-15').click(); // would throw "intercepts pointer events" when overflowing
  await expect(page.getByTestId('age-13-15')).toHaveAttribute('aria-pressed', 'true');
});

test('tester code: Arabic digits are accepted and a bad code shows an error', async ({ page }) => {
  await page.goto('/?tester=1');
  const input = page.getByTestId('tester-code-input');
  await input.fill('abc');
  await expect(page.getByTestId('tester-code-error')).toContainText(/\S/);
  await expect(page.getByTestId('tester-code-next')).toBeDisabled();
  await input.fill('٠٤٢٧');
  await expect(page.getByTestId('tester-code-error')).toHaveText('');
  await input.press('Enter');
  await expect(page.getByTestId('consent-screen')).toBeVisible();
});

test('normal play then ?tester=1 starts a clean tester session (no earlier case in the results code)', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('sd-game', JSON.stringify({ state: { mode: 'normal', screen: 'intro', startedAt: 1, caseOrder: ['case1', 'case2', 'case3'], runs: { case1: { caseId: 'case1', phase: 'debrief', startedAt: 1, finishedAt: 2, collected: [], deductions: [], toolsUsed: [], openedLinks: [], interruptFired: true, verdict: { truth: 'scam', confidence: 0.9, proof: [] }, decisionId: 'official-app-report' } }, techniqueMap: {} }, version: 1 }));
    }
  });
  await page.goto('/?tester=1');
  await expect(page.getByTestId('tester-code-screen')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sd-game')!).state);
  expect(saved.mode).toBe('tester');
  expect(Object.keys(saved.runs)).toEqual([]);
  expect(saved.pre).toBeUndefined();
});

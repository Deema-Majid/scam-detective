import { test, expect, type Page } from '@playwright/test';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { B, URLS, fresh, CORE, verdict } from './lib';

const D = 'C:/Users/almaa/Projects/scam-detective/docs/qa/data/';
const LOG = D + 'tester.log';
const log = (s: string) => appendFileSync(LOG, s + '\n', 'utf8');
mkdirSync(D + 'codes', { recursive: true });

async function enterCode(page: Page, code: string, age?: string) {
  await page.getByTestId('tester-code-input').fill(code);
  await page.getByTestId('tester-code-input').blur();
  if (age) await page.getByTestId(`age-${age}`).click();
}

async function answerTest(page: Page, which: 'pre' | 'post', n = 6, ids?: string[]) {
  await expect(page.getByTestId(`${which}test-screen`)).toBeVisible();
  for (let i = 0; i < n; i++) {
    const id = await page.locator('[data-testid^="test-item-"]').first().getAttribute('data-testid');
    ids?.push(id!);
    await page.getByTestId(i % 2 ? 'test-verdict-legit' : 'test-verdict-scam').click();
    await page.getByTestId('test-confidence').fill(String(60 + (i % 5) * 10));
    await page.getByTestId('test-actions').locator('button').nth(i % 3).click();
    await page.getByTestId('test-next').click();
  }
}

test('invalid / edge codes', async ({ page }) => {
  await fresh(page, URLS.tester);
  await expect(page.getByTestId('tester-code-screen')).toBeVisible();
  const next = page.getByTestId('tester-code-next');
  const cases = ['', 'abc', 'T-1', 't427', 'T-0427', '٠٤٢٧', 'T-٠٤٢٧', 'T-427', 'T 427', '12', '1', 'T-12345', 'T-1234567', 'T-0000', '<b>x</b>', 'T-1; DROP', '   ', 'T--1', 'ت-0427', '0427 ', 'TT-0427', 'T-00001'];
  for (const c of cases) {
    await page.getByTestId('tester-code-input').fill(c);
    const before = await next.isDisabled();
    await page.getByTestId('tester-code-input').blur();
    const val = await page.getByTestId('tester-code-input').inputValue();
    log(`code ${JSON.stringify(c)} -> enabledBeforeBlur=${!before} afterBlur="${val}" enabled=${!(await next.isDisabled())}`);
  }
});

test('no consent / guardian under 16', async ({ page }) => {
  await fresh(page, URLS.tester);
  await enterCode(page, 'T-0010', '13-15');
  await page.getByTestId('tester-code-next').click();
  await expect(page.getByTestId('consent-start')).toBeDisabled();
  await page.getByTestId('consent-agree').check();
  await expect(page.getByTestId('consent-start')).toBeDisabled();
  await expect(page.getByTestId('consent-guardian')).toBeVisible();
  await page.getByTestId('consent-guardian').check();
  await expect(page.getByTestId('consent-start')).toBeEnabled();
  await page.getByTestId('consent-guardian').uncheck();
  await expect(page.getByTestId('consent-start')).toBeDisabled();
  log('guardian gating: OK');
  await fresh(page, URLS.tester);
  await enterCode(page, 'T-0011', '16-18');
  await page.getByTestId('tester-code-next').click();
  await expect(page.getByTestId('consent-guardian')).toHaveCount(0);
  await fresh(page, URLS.tester);
  await enterCode(page, 'T-0012', '13-15');
  await page.getByTestId('age-none').click();
  await page.getByTestId('tester-code-next').click();
  await expect(page.getByTestId('consent-guardian')).toHaveCount(0);
});

for (const [code, expectPre] of [['T-0001', 'A'], ['T-0002', 'B'], ['T-0427', 'A'], ['T-1000', 'B']] as const) {
  test(`A/B assignment ${code}`, async ({ page }) => {
    await fresh(page, URLS.tester);
    await enterCode(page, code);
    await page.getByTestId('tester-code-next').click();
    await page.getByTestId('consent-agree').check();
    await page.getByTestId('consent-start').click();
    const ids: string[] = [];
    await answerTest(page, 'pre', 1, ids);
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('sd-game')!).state);
    log(`AB ${code}: pre form=${st.pre.form} post form=${st.tester.forms.post} firstItem=${ids[0]} (expected pre ${expectPre})`);
    expect(st.pre.form).toBe(expectPre);
    expect(st.tester.forms.post).toBe(expectPre === 'A' ? 'B' : 'A');
  });
}

test('reload during pretest keeps answers and resumes', async ({ page }) => {
  await fresh(page, URLS.tester);
  await enterCode(page, 'T-0099', '19+');
  await page.getByTestId('tester-code-next').click();
  await page.getByTestId('consent-agree').check();
  await page.getByTestId('consent-start').click();
  await answerTest(page, 'pre', 3);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('pretest-screen')).toBeVisible();
  const prog = await page.getByTestId('test-progress').innerText();
  log(`reload pretest after 3 answers -> progress "${prog}"`);
  expect(prog).toMatch(/4/);
  await fresh(page, URLS.tester);
  await enterCode(page, 'T-0098');
  await page.getByTestId('tester-code-next').click();
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('consent-screen')).toBeVisible();
});

async function fullTester(page: Page, code: string, age: string | undefined, label: string, o: { feedbackText?: string } = {}) {
  await fresh(page, URLS.tester);
  await enterCode(page, code, age);
  await page.getByTestId('tester-code-next').click();
  await page.getByTestId('consent-agree').check();
  if (age === '13-15') await page.getByTestId('consent-guardian').check();
  await page.getByTestId('consent-start').click();
  await answerTest(page, 'pre');
  for (const id of ['case1', 'case2', 'case3'] as const) {
    await CORE[id](page);
    if (id === 'case2') {
      await page.getByTestId('go-verdict').click();
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('verdict-screen')).toBeVisible();
      await page.getByTestId('verdict-scam').click();
      await page.getByTestId('proof-D1').click();
      await page.getByTestId('confidence').fill('70');
      await page.getByTestId('stamp-verdict').click();
      await page.getByTestId('to-decision').click();
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('decision-screen')).toBeVisible();
    } else {
      await verdict(page, { truth: 'scam', proof: ['D1'], conf: id === 'case1' ? 90 : 55 });
      await page.getByTestId('to-decision').click();
    }
    const dec = { case1: 'official-app-report', case2: 'call-old-tell-family', case3: 'pay-fee' }[id];
    await page.getByTestId(`decision-${dec}`).click();
    await page.getByTestId('to-debrief').click();
    await page.getByTestId('next-case').click();
  }
  await answerTest(page, 'post');
  await expect(page.getByTestId('feedback-screen')).toBeVisible();
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('feedback-screen')).toBeVisible();
  await expect(page.getByTestId('feedback-submit')).toBeDisabled();
  for (let i = 0; i < 3; i++) await page.getByTestId(`feedback-open-${i}`).fill(o.feedbackText ?? `answer ${i}`);
  for (let i = 0; i < 5; i++) await page.getByTestId(`feedback-likert-${i}-${(i % 5) + 1}`).click();
  await page.getByTestId('feedback-submit').click();
  await expect(page.getByTestId('results-code-screen')).toBeVisible();
  await expect(page.getByTestId('results-code')).not.toHaveValue('');
  const codeTxt = (await page.getByTestId('results-code').inputValue()).trim();
  writeFileSync(D + `codes/${label}.txt`, codeTxt + '\n', 'utf8');
  log(`${label}: code length=${codeTxt.length} prefix=${codeTxt.slice(0, 4)}`);
  return codeTxt;
}

test('full tester run ODD code (A then B) with real cases + results', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const code = await fullTester(page, 'T-0427', '16-18', 'odd-T0427');
  await page.getByTestId('results-copy').click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  log(`clipboard equals code: ${clip.trim() === code}`);
  expect(clip.trim()).toBe(code);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByTestId('results-download').click()]);
  await dl.saveAs(D + 'codes/odd-T0427.json');
  log(`download filename=${dl.suggestedFilename()}`);
  await page.reload();
  await page.waitForLoadState('networkidle');
  const again = (await page.getByTestId('results-code').inputValue()).trim();
  log(`results code after reload same=${again === code} len=${again.length}`);
  await page.getByTestId('results-to-summary').click();
  log(`summary after tester: ${(await page.getByTestId('summary-screen').innerText()).replace(/\s+/g, ' ').slice(0, 500)}`);
});

test('full tester run EVEN code (B then A), age 13-15', async ({ page }) => {
  await fullTester(page, '2', '13-15', 'even-T0002');
});
test('full tester run no age, free text with fake PII typed in feedback', async ({ page }) => {
  await fullTester(page, 'T-0777', undefined, 'noage-T0777', { feedbackText: 'اسمي سارة 0500000001 sara@example.com' });
});

test('normal session then ?tester=1: do old runs leak into tester results?', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('start-case1').click();
  await CORE.case1(page);
  await verdict(page, { truth: 'scam', proof: ['D1'], conf: 80 });
  await page.getByTestId('to-decision').click();
  await page.getByTestId('decision-pay').click();
  await page.goto(URLS.tester);
  await page.waitForLoadState('networkidle');
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('sd-game')!).state);
  log(`after normal case1 then ?tester=1: screen=${s.screen} mode=${s.mode} runs=${Object.keys(s.runs)} caseOrder=${s.caseOrder}`);
  await page.goto(B);
  await page.waitForLoadState('networkidle');
  const s2 = await page.evaluate(() => JSON.parse(localStorage.getItem('sd-game')!).state);
  log(`then plain URL: screen=${s2.screen} mode=${s2.mode}`);
});

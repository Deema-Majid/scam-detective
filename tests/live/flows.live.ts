import { test, expect } from '@playwright/test';
import { appendFileSync } from 'node:fs';
import { fresh, CORE, verdict, screenText, URLS } from './lib';

const LOG = 'C:/Users/almaa/Projects/scam-detective/docs/qa/data/flows.log';
const log = (s: string) => appendFileSync(LOG, s + '\n', 'utf8');

const DEC: Record<string, string[]> = {
  case1: ['pay', 'call-msg-number', 'ignore', 'official-app-report'],
  case2: ['transfer', 'ask-personal', 'call-old-tell-family', 'block-only'],
  case3: ['share-otp', 'pay-fee', 'ignore', 'refuse-freeze-report'],
};
const BEST: Record<string, string> = { case1: 'official-app-report', case2: 'call-old-tell-family', case3: 'refuse-freeze-report' };

for (const id of ['case1', 'case2', 'case3'] as const) {
  // every decision after a correct+proven verdict
  for (const dec of DEC[id]) {
    test(`${id}: scam+D1 conf90 -> decision ${dec}`, async ({ page }) => {
      const errs: string[] = []; page.on('pageerror', (e) => errs.push(String(e)));
      await fresh(page);
      await page.getByTestId(`start-${id}`).click();
      await CORE[id](page);
      await verdict(page, { truth: 'scam', proof: ['D1'], conf: 90 });
      log(`[${id}] full/D1/90 mirror: ${await screenText(page, 'confidence-mirror')} | result: ${await screenText(page, 'verdict-result')}`);
      await page.getByTestId('to-decision').click();
      log(`[${id}] decision options: ${await screenText(page, 'decision-options')}`);
      await page.getByTestId(`decision-${dec}`).click();
      await expect(page.getByTestId('outcome-screen')).toBeVisible();
      log(`[${id}] decision=${dec} effects: ${await screenText(page, 'effects')} | timeline: ${await screenText(page, 'outcome-timeline')}`);
      // what-if is locked in normal mode on first case
      log(`[${id}] what-if disabled=${await page.getByTestId('what-if').isDisabled()}`);
      await page.getByTestId('to-debrief').click();
      await expect(page.getByTestId('debrief-screen')).toBeVisible();
      if (dec === BEST[id]) log(`[${id}] debrief: ${await screenText(page, 'debrief-screen')}`);
      await page.getByTestId('next-case').click();
      expect(errs).toEqual([]);
    });
  }
  test(`${id}: scam, NO proof (partial), conf 100`, async ({ page }) => {
    await fresh(page);
    await page.getByTestId(`start-${id}`).click();
    await CORE[id](page);
    await verdict(page, { truth: 'scam', proof: [], conf: 100 });
    log(`[${id}] partial/noproof/100: ${await screenText(page, 'verdict-result')}`);
    await expect(page.getByTestId('verdict-outcome-partial')).toBeVisible();
  });
  test(`${id}: scam, with ONE weak evidence (insufficient proof), conf 50`, async ({ page }) => {
    await fresh(page);
    await page.getByTestId(`start-${id}`).click();
    await CORE[id](page);
    await verdict(page, { truth: 'scam', proof: ['E1'], conf: 50 });
    log(`[${id}] partial/E1/50: ${await screenText(page, 'verdict-result')}`);
    await expect(page.getByTestId('verdict-outcome-partial')).toBeVisible();
  });
  test(`${id}: WRONG verdict legit conf 100`, async ({ page }) => {
    await fresh(page);
    await page.getByTestId(`start-${id}`).click();
    await CORE[id](page);
    await verdict(page, { truth: 'legit', proof: [], conf: 100 });
    log(`[${id}] wrong/legit/100: ${await screenText(page, 'verdict-result')}`);
    await expect(page.getByTestId('verdict-outcome-wrong')).toBeVisible();
    await page.getByTestId('to-decision').click();
    await page.getByTestId(`decision-${BEST[id]}`).click();
    await page.getByTestId('to-debrief').click();
    log(`[${id}] wrong debrief: ${await screenText(page, 'debrief-screen')}`);
  });
  test(`${id}: WRONG verdict legit with proof D1 chosen`, async ({ page }) => {
    await fresh(page);
    await page.getByTestId(`start-${id}`).click();
    await CORE[id](page);
    await verdict(page, { truth: 'legit', proof: ['D1'], conf: 50 });
    log(`[${id}] wrong/legit/D1/50: ${await screenText(page, 'verdict-result')}`);
    await expect(page.getByTestId('verdict-outcome-wrong')).toBeVisible();
  });
}

test('full normal session case1->2->3->summary with Brier + other-channel counter', async ({ page }) => {
  await fresh(page);
  const plan = [['case1', 'official-app-report', 90], ['case2', 'call-old-tell-family', 60], ['case3', 'pay-fee', 80]] as const;
  for (let i = 0; i < 3; i++) {
    const [id, dec, conf] = plan[i];
    await page.getByTestId(`start-${id}`).click().catch(async () => { /* next-case auto-starts */ });
    await CORE[id](page);
    await verdict(page, { truth: 'scam', proof: ['D1'], conf });
    await page.getByTestId('to-decision').click();
    await page.getByTestId(`decision-${dec}`).click();
    if (i > 0) { await expect(page.getByTestId('what-if')).toBeEnabled(); await page.getByTestId('what-if').click(); log(`[session] what-if ${id}: ${(await screenText(page, 'alt-timelines')).slice(0, 300)}`); }
    await page.getByTestId('to-debrief').click();
    await page.getByTestId('next-case').click();
  }
  await expect(page.getByTestId('summary-screen')).toBeVisible();
  log(`[session] summary: ${await screenText(page, 'summary-screen')}`);
  log(`[session] brier=${await screenText(page, 'summary-brier')} other=${await screenText(page, 'summary-other-channel')}`);
});

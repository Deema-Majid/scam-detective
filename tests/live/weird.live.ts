import { test, expect, type Page } from '@playwright/test';
import { appendFileSync } from 'node:fs';
import { B, URLS, fresh, CORE, verdict, closeSheet, back, home, toastWait, screenText } from './lib';

const OUT = 'C:/Users/almaa/Projects/scam-detective/docs/qa/';
const LOG = OUT + 'data/weird.log';
const log = (s: string) => appendFileSync(LOG, s + '\n', 'utf8');
const state = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('sd-game')!).state);
const txt = async (page: Page, id: string) => ((await page.getByTestId(id).first().innerText().catch(() => 'N/A')) as string).replace(/\s+/g, ' ');

test('rapid repeated clicks on collect / stamp / decision / debrief / next', async ({ page }) => {
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await fresh(page);
  await page.getByTestId('start-case1').click();
  await toastWait(page);
  await page.getByTestId('app-messages').click();
  await page.getByTestId('thread-row-t-rafeef').click();
  await page.getByTestId('sender-button').click();
  for (let i = 0; i < 12; i++) await page.getByTestId('collect-E1').click({ force: true, noWaitAfter: true }).catch(() => undefined);
  let s = await state(page);
  log(`rapid collect E1 x12 -> collected=${JSON.stringify(s.runs.case1.collected)}`);
  expect(s.runs.case1.collected.filter((x: string) => x === 'E1').length).toBe(1);
  await closeSheet(page);
  await back(page, 2);
  await CORE.case1(page).catch((e) => log('case1Core second time: ' + String(e).slice(0, 150)));
  await page.getByTestId('go-verdict').dblclick();
  await page.getByTestId('verdict-scam').click();
  await page.getByTestId('proof-D1').click();
  await page.getByTestId('confidence').fill('80');
  const stamp = page.getByTestId('stamp-verdict');
  for (let i = 0; i < 6; i++) await stamp.click({ force: true, noWaitAfter: true, timeout: 1500 }).catch(() => undefined);
  await expect(page.getByTestId('verdict-result')).toBeVisible();
  s = await state(page);
  log(`rapid stamp x6 -> phase=${s.runs.case1.phase} verdict=${JSON.stringify(s.runs.case1.verdict)}`);
  await page.getByTestId('to-decision').dblclick();
  const d = page.getByTestId('decision-pay');
  await d.click();
  await d.click({ timeout: 1500 }).catch(() => log('second decision click: element gone (expected)'));
  s = await state(page);
  log(`after decision double click: phase=${s.runs.case1.phase} decision=${s.runs.case1.decisionId}`);
  await page.getByTestId('to-debrief').dblclick();
  await page.getByTestId('next-case').dblclick();
  s = await state(page);
  log(`after next-case dblclick: screen=${s.screen} current=${s.currentCaseId} phases=${JSON.stringify(Object.fromEntries(Object.entries(s.runs).map(([k, v]: any) => [k, v.phase])))}`);
  log(`pageerrors during rapid clicks: ${JSON.stringify(errs)}`);
});

test('reload in every phase keeps state', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('start-case1').click();
  await page.reload();
  await page.waitForLoadState('networkidle');
  log(`reload at incoming: home visible=${await page.getByTestId('home-screen').isVisible()} screen=${(await state(page)).screen} phase=${(await state(page)).runs.case1.phase}`);
  await toastWait(page);
  await page.getByTestId('app-messages').click();
  await page.getByTestId('thread-row-t-rafeef').click();
  await page.getByTestId('sender-button').click();
  await page.getByTestId('collect-E1').click();
  await closeSheet(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  let s = await state(page);
  log(`reload mid-investigation: collected=${JSON.stringify(s.runs.case1.collected)} home=${await page.getByTestId('home-screen').isVisible()} timeToToast`);
  await page.getByTestId('app-notebook').click();
  log(`notebook after reload: counter=${await txt(page, 'notebook-counter')}`);
  await home(page);
  await CORE.case1(page).catch((e) => log('case1Core after reload: ' + String(e).slice(0, 200)));
  await page.getByTestId('go-verdict').click();
  await page.reload();
  await page.waitForLoadState('networkidle');
  log(`reload at verdict: verdict-screen=${await page.getByTestId('verdict-screen').isVisible()}`);
  await page.getByTestId('verdict-scam').click();
  await page.getByTestId('proof-D1').click();
  await page.getByTestId('confidence').fill('85');
  await page.getByTestId('stamp-verdict').click();
  await expect(page.getByTestId('verdict-result')).toBeVisible();
  await page.reload();
  await page.waitForLoadState('networkidle');
  s = await state(page);
  log(`reload at verdict-result step: phase=${s.runs.case1.phase} visible: decision=${await page.getByTestId('decision-screen').isVisible()} verdict-result=${await page.getByTestId('verdict-result').isVisible()}`);
  if (await page.getByTestId('to-decision').isVisible()) await page.getByTestId('to-decision').click();
  await page.getByTestId('decision-ignore').click();
  await page.reload();
  await page.waitForLoadState('networkidle');
  log(`reload at outcome: ${await page.getByTestId('outcome-screen').isVisible()}`);
  await page.getByTestId('to-debrief').click();
  await page.reload();
  await page.waitForLoadState('networkidle');
  log(`reload at debrief: ${await page.getByTestId('debrief-screen').isVisible()}`);
  await page.getByTestId('next-case').click();
  await page.reload();
  await page.waitForLoadState('networkidle');
  s = await state(page);
  log(`reload at case2 incoming: screen=${s.screen} current=${s.currentCaseId}`);
  await home(page).catch(() => undefined);
  // finish quickly, reload on summary
  await page.evaluate(() => {
    const g = JSON.parse(localStorage.getItem('sd-game')!);
    g.state.screen = 'summary';
    localStorage.setItem('sd-game', JSON.stringify(g));
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  log(`reload on summary: ${await page.getByTestId('summary-screen').isVisible()} reset visible=${await page.getByTestId('summary-reset').isVisible()}`);
  await page.getByTestId('summary-reset').click();
  s = await state(page);
  log(`after summary-reset: screen=${s.screen} runs=${Object.keys(s.runs).length}`);
});

test('browser back / forward behaviour', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('start-case1').click();
  await page.getByTestId('app-messages').click();
  await page.goBack();
  await page.waitForTimeout(500);
  log(`browser back from case: url=${page.url()} body=${(await page.locator('body').innerText()).slice(0, 80).replace(/\s+/g, ' ')}`);
  await page.goForward().catch(() => undefined);
  await page.waitForTimeout(500);
  log(`browser forward: url=${page.url()} home=${await page.getByTestId('home-screen').isVisible().catch(() => false)} messagesList=${await page.getByTestId('messages-list').isVisible().catch(() => false)}`);
});

test('notebook empty, early go-verdict, verdict without proof/confidence', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('start-case2').click();
  await page.getByTestId('app-notebook').click();
  log(`empty notebook text: ${await txt(page, 'notebook')}`);
  await page.getByTestId('link-mode').click();
  log(`link-mode with no evidence: ${await txt(page, 'notebook-paper')}`);
  await page.getByTestId('go-verdict').click();
  log(`early verdict screen (0 evidence): proofChips="${await txt(page, 'proof-chips')}" stampDisabled=${await page.getByTestId('stamp-verdict').isDisabled()}`);
  await expect(page.getByTestId('stamp-verdict')).toBeDisabled();
  await page.getByTestId('verdict-scam').click();
  await expect(page.getByTestId('stamp-verdict')).toBeDisabled(); // slider not moved
  log(`after choose scam only: stampDisabled=${await page.getByTestId('stamp-verdict').isDisabled()} hint=${await txt(page, 'verdict-screen')}`);
  // slider at default via keyboard
  await page.getByTestId('confidence').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('stamp-verdict')).toBeEnabled();
  await page.getByTestId('stamp-verdict').click();
  await expect(page.getByTestId('verdict-result')).toBeVisible();
  log(`verdict with zero evidence -> ${await txt(page, 'verdict-result')}`);
  await page.getByTestId('to-decision').click();
  await page.getByTestId('decision-block-only').click();
  await page.getByTestId('to-debrief').click();
  log(`debrief with zero evidence: ${(await txt(page, 'debrief-screen')).slice(0, 400)}`);
});

test('notebook linking: self-link, wrong pairs x5 -> hint, un-collected', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('start-case1').click();
  await CORE.case1(page);
  // current: E1,E2,E3,E4 collected; D1 unlocked. Wrong pairs:
  const link = async (a: string, b: string) => {
    await page.locator(`[data-evidence-card="${a}"]`).click();
    await page.locator(`[data-evidence-card="${b}"]`).click();
  };
  const pairs: [string, string][] = [['E1', 'E1'], ['E1', 'E2'], ['E1', 'E3'], ['E2', 'E3'], ['E1', 'E4']];
  for (const [a, b] of pairs) {
    await link(a, b);
    log(`pair ${a}+${b}: hint="${await txt(page, 'link-hint')}" deductions=${(await state(page)).runs.case1.deductions}`);
  }
  log(`notebook text after 5 wrong: ${(await txt(page, 'notebook')).slice(0, 500)}`);
  await page.screenshot({ path: OUT + 'shots/weird-notebook-after-wrong.png' });
  // relink the same right pair again
  await link('E3', 'E4');
  log(`relink E3+E4 again: deductions=${(await state(page)).runs.case1.deductions}`);
});

test('dialer: unknown number, message number (risky), keyboard entry, short number', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('start-case1').click();
  await page.getByTestId('app-dialer').click();
  log(`dialer initial: ${await txt(page, 'dialer')}`);
  const call = page.getByTestId('keypad-call');
  await expect(call).toBeDisabled();
  for (const k of ['1', '2']) await page.getByTestId(`key-${k}`).click();
  await expect(call).toBeDisabled();
  await page.keyboard.type('345678901');
  log(`keyboard typed "345678901" -> display="${await txt(page, 'keypad-display')}"`);
  for (let i = 0; i < 20; i++) await page.getByTestId('key-5').click();
  log(`after 20 more key presses display length: ${(await page.getByTestId('keypad-display').innerText()).length} -> "${await txt(page, 'keypad-display')}"`);
  for (let i = 0; i < 25; i++) await page.getByTestId('keypad-delete').click();
  log(`after delete x25: "${await txt(page, 'keypad-display')}" callDisabled=${await call.isDisabled()}`);
  // star/hash
  await page.getByTestId('key-star').click(); await page.getByTestId('key-1').click(); await page.getByTestId('key-hash').click(); await page.getByTestId('key-2').click();
  log(`star/hash display: "${await txt(page, 'keypad-display')}" disabled=${await call.isDisabled()}`);
  for (let i = 0; i < 6; i++) await page.getByTestId('keypad-delete').click();
  // unknown number
  for (const k of ['5', '5', '5', '1', '2', '3']) await page.getByTestId(`key-${k}`).click();
  await call.click();
  await page.waitForTimeout(3500);
  log(`unknown number call: ${await txt(page, 'call-screen')}`);
  await page.screenshot({ path: OUT + 'shots/weird-unknown-call.png' });
  await page.getByTestId('end-call').click();
  // typed official number via keypad
  for (const k of '920000011'.split('')) await page.getByTestId(`key-${k}`).click();
  await call.click();
  await page.waitForTimeout(7500);
  log(`typed 920000011 (official): ${await txt(page, 'call-screen')} | E6 collect visible=${await page.getByTestId('collect-E6').isVisible()}`);
  await page.getByTestId('end-call').click();
  // typed message number 0500000011
  for (const k of '0500000011'.split('')) await page.getByTestId(`key-${k}`).click();
  await call.click();
  await page.waitForTimeout(6000);
  log(`typed message number (risky): ${await txt(page, 'call-screen')} | risky-note=${await txt(page, 'risky-note')}`);
  await page.getByTestId('end-call').click();
  // reload during call
  for (const k of '0500000011'.split('')) await page.getByTestId(`key-${k}`).click();
  await call.click();
  await page.reload();
  await page.waitForLoadState('networkidle');
  log(`reload during call: home=${await page.getByTestId('home-screen').isVisible()} call-screen=${await page.getByTestId('call-screen').isVisible()}`);
});

test('fake site form: fill fake data does not store or send', async ({ page }) => {
  const posts: string[] = [];
  page.on('request', (r) => { if (r.method() !== 'GET') posts.push(r.method() + ' ' + r.url()); });
  await fresh(page);
  await page.getByTestId('start-case1').click();
  await toastWait(page);
  await page.getByTestId('app-messages').click();
  await page.getByTestId('thread-row-t-rafeef').click();
  await page.getByTestId('link-L1').click();
  await page.getByTestId('open-in-sim').click();
  log(`fake site: ${(await txt(page, 'browser')).slice(0, 300)}`);
  await expect(page.getByTestId('fake-form')).toBeVisible();
  await expect(page.getByTestId('fake-submit')).toBeDisabled();
  // typing into fields?
  const fields = page.locator('[data-testid^="fake-field-"]');
  log(`fake fields count=${await fields.count()} tags=${await fields.evaluateAll((e) => e.map((x) => x.tagName + ':' + (x as HTMLInputElement).readOnly + ':' + (x as HTMLInputElement).type))}`);
  await page.getByTestId('fill-fake').click();
  log(`filled values: ${await fields.evaluateAll((e) => e.map((x) => (x as HTMLInputElement).value ?? x.textContent))}`);
  await page.getByTestId('fake-submit').click();
  log(`submitted: ${await txt(page, 'fake-submitted')}`);
  const ls = await page.evaluate(() => JSON.stringify(localStorage));
  const hasFake = /4242|cvv|\b123\b|card/i.test(ls);
  log(`localStorage contains fake form data? ${hasFake} ; non-GET requests: ${JSON.stringify(posts)}`);
  await page.reload();
  await page.waitForLoadState('networkidle');
  log(`localStorage after reload still lacks card data: ${!/4242/.test(await page.evaluate(() => JSON.stringify(localStorage)))}`);
  await page.screenshot({ path: OUT + 'shots/weird-fake-form.png', fullPage: true });
});

test('browser app: bookmarks, address bar, site nav, external-looking link', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('start-case1').click();
  await page.getByTestId('app-browser').click();
  log(`browser: ${await txt(page, 'browser')}`);
  await page.getByTestId('bookmark-rafeef-official').click();
  log(`official site: ${(await txt(page, 'address-bar'))} | ${(await txt(page, 'phone')).slice(0, 300)}`);
  const navs = page.locator('[data-testid^="site-nav-"]');
  for (let i = 0; i < await navs.count(); i++) { await navs.nth(i).click(); log(`nav ${i}: ${(await txt(page, 'address-bar'))}`); }
  const externalHrefs = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
  log(`anchors in browser app: ${JSON.stringify(externalHrefs)}`);
});

test('interrupt timing: after reload past 45s, during sheet, during call', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('start-case1').click();
  // age the run by 50s
  await page.evaluate(() => {
    const g = JSON.parse(localStorage.getItem('sd-game')!);
    g.state.runs.case1.startedAt -= 50000;
    localStorage.setItem('sd-game', JSON.stringify(g));
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  const sOld = await state(page);
  log(`reload past 45s: interruptFired=${sOld.runs.case1.interruptFired} toastVisible=${await page.getByTestId('toast').isVisible()} phase=${sOld.runs.case1.phase}`);
  // fresh: open call then wait for 45s? simulate by aging + open call
  await fresh(page);
  await page.getByTestId('start-case1').click();
  await page.getByTestId('app-dialer').click();
  for (const k of '920000011'.split('')) await page.getByTestId(`key-${k}`).click();
  await page.getByTestId('keypad-call').click();
  await page.evaluate(() => { const g = JSON.parse(localStorage.getItem('sd-game')!); g.state.runs.case1.startedAt -= 60000; localStorage.setItem('sd-game', JSON.stringify(g)); });
  // zustand state in memory not changed by localStorage edit; so wait natural 47s instead:
  await page.waitForTimeout(48000);
  const mid = await state(page);
  log(`during call at ~48s: interruptFired=${mid.runs.case1.interruptFired} toast=${await page.getByTestId('toast').isVisible()}`);
  await page.getByTestId('end-call').click();
  await page.waitForTimeout(2000);
  const after = await state(page);
  log(`after ending call: interruptFired=${after.runs.case1.interruptFired} toast=${await page.getByTestId('toast').isVisible()}`);
  if (await page.getByTestId('toast').isVisible()) {
    log(`toast text: ${await txt(page, 'toast')}`);
    await page.screenshot({ path: OUT + 'shots/weird-interrupt-toast.png' });
    await page.getByTestId('toast').click();
    log(`after click toast: thread view ${(await txt(page, 'phone')).slice(0, 300)} E8 collect visible=${await page.getByTestId('collect-E8').isVisible().catch(() => false)}`);
  }
});

test('interrupt does not fire during verdict phase; toast covers/obscures?', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('start-case2').click();
  await page.getByTestId('go-verdict').click();
  await page.waitForTimeout(500);
  const s = await state(page);
  log(`case2 early verdict: phase=${s.runs.case2.phase} interruptFired=${s.runs.case2.interruptFired}`);
});

test('settings mid-case: theme, language, gender, motion persist and do not break flow', async ({ page }) => {
  await fresh(page);
  await page.getByTestId('start-case2').click();
  await page.getByTestId('app-settings').click();
  log(`settings: ${await txt(page, 'settings')}`);
  const before = await page.locator('html').evaluate((h) => `${h.lang}/${h.dir}/${h.dataset.theme}`);
  await page.getByTestId('setting-theme-light').click();
  await page.getByTestId('setting-gender-m').click();
  await page.getByTestId('setting-lang-en').click();
  const after = await page.locator('html').evaluate((h) => `${h.lang}/${h.dir}/${h.dataset.theme}`);
  log(`html before=${before} after=${after}`);
  await page.screenshot({ path: OUT + 'shots/weird-settings-en-light.png', fullPage: true });
  log(`context text EN: ${await txt(page, 'case-context')}`);
  await page.getByTestId('back').first().click();
  await page.getByTestId('app-chats').click();
  await page.getByTestId('thread-row-t-newnum').click();
  log(`EN thread text m: ${(await txt(page, 'phone')).slice(0, 500)}`);
  await page.screenshot({ path: OUT + 'shots/weird-thread-en-male-light.png' });
  await home(page);
  await page.getByTestId('app-settings').click();
  await page.getByTestId('setting-lang-ar').click();
  await page.getByTestId('setting-gender-f').click();
  await page.getByTestId('setting-theme-dark').click();
  await page.getByTestId('back').first().click();
  const s = await state(page);
  log(`state kept after settings flips: phase=${s.runs.case2.phase} collected=${s.runs.case2.collected}`);
  // then reload keeps settings
  await page.getByTestId('app-settings').click();
  await page.getByTestId('setting-lang-en').click();
  await page.reload();
  await page.waitForLoadState('networkidle');
  log(`after reload lang=${await page.locator('html').evaluate((h) => h.lang)} ; opened ?lang... (store persisted)`);
});

test('reduced motion setting (in-app switch) in full verdict flow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fresh(page);
  await page.getByTestId('start-case1').click();
  await CORE.case1(page);
  await verdict(page, { truth: 'scam', proof: ['D1'], conf: 80 });
  await page.getByTestId('to-decision').click();
  await page.getByTestId('decision-official-app-report').click();
  await expect(page.getByTestId('outcome-screen')).toBeVisible();
  const anim = await page.evaluate(() => document.getAnimations().filter((a) => (a as any).playState === 'running' && a.effect && (a.effect.getTiming().iterations === Infinity)).length);
  log(`reduced motion: infinite running CSS animations on outcome = ${anim}`);
});

test('family mode: all three cases, missing case, card + print', async ({ page }) => {
  for (const [name, url] of [['case1', URLS.family1], ['case2', URLS.family2], ['case3', URLS.family3], ['missing', B + '?mode=family&case=zzz'], ['empty', B + '?mode=family&case='], ['noCaseParam', B + '?mode=family']]) {
    await fresh(page, url);
    const s = await state(page);
    log(`family ${name}: mode=${s.mode} current=${s.currentCaseId} caseOrder=${s.caseOrder} screen=${s.screen} ctx=${await txt(page, 'case-context')}`);
  }
  // finish family case2 -> card
  await fresh(page, URLS.family2);
  await CORE.case2(page);
  await verdict(page, { truth: 'scam', proof: ['D1'], conf: 90 });
  await page.getByTestId('to-decision').click();
  await page.getByTestId('decision-call-old-tell-family').click();
  log(`family what-if enabled directly: ${await page.getByTestId('what-if').isEnabled()}`);
  await page.getByTestId('to-debrief').click();
  log(`family debrief buttons: ${await page.locator('[data-testid="next-case"], [data-testid="open-summary"]').evaluateAll((e) => e.map((x) => x.textContent))}`);
  await page.getByTestId('next-case').click();
  await expect(page.getByTestId('family-card')).toBeVisible();
  log(`family card: ${(await txt(page, 'family-card')).slice(0, 700)}`);
  await page.screenshot({ path: OUT + 'shots/weird-family-card.png', fullPage: true });
  await page.emulateMedia({ media: 'print' });
  const printHidden = await page.evaluate(() => [...document.querySelectorAll('.no-print')].map((e) => getComputedStyle(e).display));
  log(`print media: .no-print displays=${JSON.stringify(printHidden)}`);
  await page.pdf({ path: OUT + 'data/family-card.pdf', format: 'A4' }).catch((e) => log('pdf err ' + e));
  await page.emulateMedia({ media: 'screen' });
  await page.getByTestId('family-back').click();
  log(`family-back goes to: ${(await state(page)).screen} / ${(await state(page)).mode}`);
});

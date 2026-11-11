import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { appendFileSync } from 'node:fs';
import { B, URLS, fresh } from './lib';

const OUT = 'C:/Users/almaa/Projects/scam-detective/docs/qa/';
const LOG = OUT + 'data/general.log';
const log = (s: string) => appendFileSync(LOG, s + '\n', 'utf8');

function seedSettings(page: Page, theme: 'dark' | 'light', lang = 'ar') {
  return page.addInitScript(([t, l]) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('sd-settings', JSON.stringify({ state: { lang: l, gender: 'f', theme: t, sound: false, reducedMotion: false }, version: 0 }));
      sessionStorage.setItem('seeded', '1');
    }
  }, [theme, lang]);
}

async function pageChecks(page: Page, label: string) {
  const info = await page.evaluate(() => {
    const de = document.documentElement;
    const over = de.scrollWidth - window.innerWidth;
    const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    const clipped = [...document.querySelectorAll('body *')].filter((e) => {
      const cs = getComputedStyle(e as Element);
      return (e as HTMLElement).scrollWidth > (e as HTMLElement).clientWidth + 2 && ['hidden', 'clip'].includes(cs.overflowX) && (e as HTMLElement).clientWidth > 0 && !(e as HTMLElement).className.toString().includes('line-clamp');
    }).slice(0, 5).map((e) => (e as HTMLElement).tagName + '.' + (e as HTMLElement).className.toString().slice(0, 50) + ' "' + ((e as HTMLElement).innerText || '').slice(0, 30) + '"');
    const small = [...document.querySelectorAll('button, [role=button], input, a')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 24 || r.width < 24); }).slice(0, 5).map((e) => (e.getAttribute('data-testid') ?? e.tagName));
    return { over, links, lang: de.lang, dir: de.dir, theme: de.dataset.theme, clipped, small };
  });
  log(`${label}: overflowX=${info.over} lang=${info.lang} dir=${info.dir} theme=${info.theme} links=${JSON.stringify(info.links)} clipped=${JSON.stringify(info.clipped)} tinyTargets=${JSON.stringify(info.small)}`);
  return info;
}

const pages: [string, string][] = [['normal', URLS.normal], ['tester', URLS.tester], ['family1', URLS.family1], ['family2', URLS.family2], ['family3', URLS.family3], ['en', URLS.en], ['family-missing', B + '?mode=family&case=nope'], ['family-en', B + '?mode=family&case=case2&lang=en'], ['tester-en', B + '?tester=1&lang=en']];

for (const theme of ['dark', 'light'] as const) {
  for (const [name, url] of pages) {
    test(`load ${name} ${theme}: console, network, links, overflow, axe, screenshot`, async ({ page }, ti) => {
      const errors: string[] = []; const reqs = new Set<string>();
      page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errors.push(m.type() + ': ' + m.text()); });
      page.on('pageerror', (e) => errors.push('pageerror: ' + e));
      page.on('request', (r) => reqs.add(r.url()));
      await seedSettings(page, theme, url.includes('lang=en') ? 'en' : 'ar');
      await page.goto(url); await page.waitForLoadState('networkidle'); await page.waitForTimeout(800);
      const label = `${ti.project.name}|${name}|${theme}`;
      const info = await pageChecks(page, label);
      const ext = [...reqs].filter((u) => !u.startsWith('https://deema-majid.github.io/') && !u.startsWith('data:') && !u.startsWith('blob:'));
      log(`${label}: externalRequests=${JSON.stringify(ext)} consoleIssues=${JSON.stringify(errors)} totalReqs=${reqs.size}`);
      const ax = await new AxeBuilder({ page }).analyze();
      log(`${label}: axe=${JSON.stringify(ax.violations.map((v) => [v.id, v.impact, v.nodes.length, v.nodes[0]?.target]))}`);
      await page.screenshot({ path: `${OUT}shots/${ti.project.name}-${name}-${theme}.png`, fullPage: true });
      expect(ext).toEqual([]); expect(errors).toEqual([]); expect(info.over).toBeLessThanOrEqual(0);
      expect(info.links.filter((h) => h && !h.startsWith('#'))).toEqual([]);
    });
  }
}

test('window.open / tel: / external anchors never used while playing case 1 (instrumented)', async ({ page }) => {
  await page.addInitScript(() => { (window as any).__opened = []; window.open = ((...a: any[]) => { (window as any).__opened.push(a); return null; }) as any; });
  await fresh(page);
  await page.getByTestId('start-case1').click();
  await page.waitForTimeout(500);
  const hrefs = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')));
  expect(hrefs.filter((h) => h && !h.startsWith('#'))).toEqual([]);
  expect(await page.evaluate(() => (window as any).__opened)).toEqual([]);
});

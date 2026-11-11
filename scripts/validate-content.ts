/**
 * Content validator (build-plan §10). Run: npm run validate:content [-- --require-en]
 * Exit code 1 on any failure. Warnings never fail the build.
 *
 * Fails when:
 *  - a case can be settled by one piece of evidence, or has no solvable path
 *  - any URL/domain is outside .example, or the UI has an external <a href> / tel:
 *  - an i18n key is missing in ar (and in en with --require-en or REQUIRE_EN=1)
 *  - scam-supporting evidence has no technique, or a brand is not in docs/brand-check.md
 *  - the test bank is unbalanced
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CASES as REGISTERED } from '../src/content/cases';
import { case2 } from '../src/content/cases/case2';
import { case3 } from '../src/content/cases/case3';
import { case4 } from '../src/content/cases/case4';
import { TEST_BANK } from '../src/content/test-bank';
import { TECHNIQUES } from '../src/content/techniques';
import ar from '../src/i18n/ar.json';
import en from '../src/i18n/en.json';
import { hasBrokenMarker } from '../src/i18n/genderMarkers';
import { isProofSufficient } from '../src/engine/scoring';
import type { Case } from '../src/engine/types';

const requireEn = process.argv.includes('--require-en') || process.env.REQUIRE_EN === '1';
/** --drafts: also validate unregistered cases with their draft strings (docs/content-drafts). */
const withDrafts = process.argv.includes('--drafts');
const CASES = withDrafts ? [...REGISTERED, ...[case2, case3, case4].filter((c) => !REGISTERED.some((r) => r.id === c.id))] : REGISTERED;
const errors: string[] = [];
const warnings: string[] = [];
const fail = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

const arDict: Record<string, string> = withDrafts
  ? {
      ...(JSON.parse(readFileSync('docs/content-drafts/cases-2-3.ar.json', 'utf8')) as Record<string, string>),
      ...(JSON.parse(readFileSync('docs/content-drafts/case4.ar.json', 'utf8')) as Record<string, string>),
      ...(ar as Record<string, string>),
    }
  : (ar as Record<string, string>);
const enDict = en as Record<string, string>;
const usedKeys = new Set<string>();
const key = (k: string | undefined, where: string) => {
  if (!k) return;
  usedKeys.add(k);
  if (!(k in arDict)) fail(`${where}: missing ar key "${k}"`);
  else if (requireEn && !(k in enDict)) fail(`${where}: missing en key "${k}"`);
};

/* ---------- URLs ---------- */
function checkUrl(url: string, where: string) {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith('.example')) fail(`${where}: URL host "${u.hostname}" is not .example`);
  } catch {
    fail(`${where}: invalid URL "${url}"`);
  }
}
function checkDomain(domain: string, where: string) {
  if (!domain.endsWith('.example')) fail(`${where}: domain "${domain}" is not .example`);
}
function checkTextUrls(dict: Record<string, string>, label: string) {
  for (const [k, v] of Object.entries(dict)) {
    for (const m of v.matchAll(/https?:\/\/[^\s"'»«)]+/g)) checkUrl(m[0].replace(/[.,،]$/, ''), `${label}:${k}`);
    if (/\btel:/i.test(v)) fail(`${label}:${k} contains tel:`);
    if (hasBrokenMarker(v)) fail(`${label}:${k} has a broken gender marker`);
  }
}
checkTextUrls(arDict, 'ar.json');
checkTextUrls(enDict, 'en.json');

/* ---------- Source scan for real links ---------- */
function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css|html)$/.test(name)) out.push(p);
  }
  return out;
}
for (const file of walk('src').concat(['index.html'])) {
  const src = readFileSync(file, 'utf8');
  for (const [i, line] of src.split('\n').entries()) {
    if (/\btel:/.test(line)) fail(`${file}:${i + 1}: tel: link`);
    if (/href=["'{]/.test(line) && !/href=["']#/.test(line)) fail(`${file}:${i + 1}: href must only point to #anchors (no real links)`);
    if (/window\.open\(|location\.href\s*=/.test(line)) fail(`${file}:${i + 1}: navigation to external pages is not allowed`);
    if (/https?:\/\/(?!localhost)/.test(line) && !/\.example/.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line) && !/fonts|w3\.org/.test(line))
      warn(`${file}:${i + 1}: contains a non-.example URL (check it is not loaded at runtime)`);
  }
}

/* ---------- Cases ---------- */
const brandDoc = readFileSync('docs/brand-check.md', 'utf8');
for (const [k, v] of Object.entries(arDict)) {
  if (k.startsWith('brand.') && !brandDoc.includes(v)) fail(`brand "${v}" (${k}) is not recorded in docs/brand-check.md`);
}

function surfaces(c: Case): Map<string, string[]> {
  const m = new Map<string, string[]>();
  const add = (ids: string[] | undefined, where: string) => {
    for (const id of ids ?? []) m.set(id, [...(m.get(id) ?? []), where]);
  };
  const w = c.world;
  for (const ct of w.contacts) add(ct.evidence, `contact:${ct.id}`);
  for (const th of w.threads) {
    add(th.evidence, `thread:${th.id}`);
    for (const msg of th.messages) {
      add(msg.evidence, `message:${msg.id}`);
      for (const l of msg.links ?? []) add(l.evidence, `link:${l.id}`);
    }
    for (const r of th.replies ?? []) add(r.evidence, `reply:${r.id}`);
  }
  for (const o of w.orders) {
    add(o.evidence?.summary, `order:${o.id}`);
    add(o.evidence?.details, `order-details:${o.id}`);
  }
  for (const p of w.participations) add(p.evidence, `participation:${p.id}`);
  for (const s of w.sites) for (const p of s.pages) for (const b of p.blocks) add(b.evidence, `site:${s.id}${p.path}`);
  for (const call of w.calls) add(call.evidence, `call:${call.number}`);
  if (c.interrupt) {
    add(c.interrupt.evidence, 'interrupt');
    add(c.interrupt.message.evidence, 'interrupt-message');
    for (const l of c.interrupt.message.links ?? []) add(l.evidence, `interrupt-link:${l.id}`);
  }
  return m;
}

for (const c of CASES) {
  const where = `case ${c.id}`;
  key(c.titleKey, where);
  key(c.introKey, where);
  key(c.setupKey, where);
  key(c.planKey, where);
  c.familyQuestionKeys.forEach((k) => key(k, where));

  const evIds = new Set<string>();
  for (const e of c.evidence) {
    if (evIds.has(e.id)) fail(`${where}: duplicate evidence id ${e.id}`);
    evIds.add(e.id);
    key(e.titleKey, `${where} ${e.id}`);
    key(e.bodyKey, `${where} ${e.id}`);
    if (!c.tools.includes(e.tool)) fail(`${where}: evidence ${e.id} uses tool "${e.tool}" not listed in case.tools`);
    // Scam cases: every honest piece of evidence must expose a technique. Legit cases have no scammer tricks.
    if (c.truth === 'scam' && e.supports === c.truth && !e.misleading && !(e.techniques?.length)) fail(`${where}: evidence ${e.id} supports the truth but reveals no technique`);
    if (c.truth === 'legit' && (e.techniques?.length ?? 0) > 0) fail(`${where}: legit case evidence ${e.id} must not list scam techniques`);
    for (const t of e.techniques ?? []) if (!(t in TECHNIQUES)) fail(`${where}: evidence ${e.id} has unknown technique ${t}`);
  }

  // Rule 5.2: no single piece of evidence settles a case; it must be solvable by linking.
  for (const e of c.evidence) {
    if (isProofSufficient(c, c.truth, [e.id])) fail(`${where}: evidence ${e.id} alone is sufficient proof (not allowed)`);
  }
  const proving = c.deductions.filter((d) => d.proves === c.truth);
  if (proving.length === 0) fail(`${where}: no deduction proves the truth (${c.truth})`);
  for (const d of c.deductions) {
    key(d.conclusionKey, `${where} ${d.id}`);
    for (const id of d.pair) if (!evIds.has(id)) fail(`${where}: deduction ${d.id} references unknown evidence ${id}`);
    if (d.pair[0] === d.pair[1]) fail(`${where}: deduction ${d.id} pairs evidence with itself`);
  }
  const pairKeys = new Set<string>();
  for (const d of c.deductions) {
    const k = [...d.pair].sort().join('+');
    if (pairKeys.has(k)) fail(`${where}: two deductions share the pair ${k}`);
    pairKeys.add(k);
  }

  // Solvable path: every evidence is reachable from some surface in the world.
  const sf = surfaces(c);
  for (const id of evIds) if (!sf.has(id)) fail(`${where}: evidence ${id} is not offered anywhere in the world`);
  for (const [id, wheres] of sf) if (!evIds.has(id)) fail(`${where}: ${wheres.join(',')} offers unknown evidence ${id}`);
  for (const tool of c.tools) {
    if (tool === 'interrupt') {
      if (!c.interrupt) fail(`${where}: tools include interrupt but no interrupt is defined`);
      continue;
    }
    if (!c.evidence.some((e) => e.tool === tool)) warn(`${where}: tool "${tool}" yields no evidence`);
  }
  if (c.interrupt && !c.tools.includes('interrupt')) fail(`${where}: interrupt defined but "interrupt" not in tools`);
  if (c.interrupt) {
    if (!c.world.threads.some((t) => t.id === c.interrupt!.threadId)) fail(`${where}: interrupt thread ${c.interrupt.threadId} does not exist`);
    key(c.interrupt.message.bodyKey, `${where} interrupt`);
    key(c.interrupt.message.timeKey, `${where} interrupt`);
    if (c.interrupt.relevant && !(c.interrupt.evidence?.length || c.interrupt.message.evidence?.length)) fail(`${where}: relevant interrupt offers no evidence`);
  }

  if (c.truth === 'legit' && !c.evidence.some((e) => e.misleading && e.supports === 'scam')) fail(`${where}: a legit case needs misleading evidence that points to a scam`);
  if (c.truth === 'legit' && c.techniques.length > 0) fail(`${where}: a legit case must have an empty techniques list`);

  // Decisions
  const best = c.decisions.filter((d) => d.rating === 'best');
  if (best.length !== 1) fail(`${where}: expected exactly one "best" decision, found ${best.length}`);
  if (best[0] && !best[0].usesOtherChannel) fail(`${where}: the best decision must use another channel`);
  if (c.decisions.length !== 4) warn(`${where}: ${c.decisions.length} decisions (plan expects 4)`);
  for (const d of c.decisions) {
    key(d.textKey, `${where} decision ${d.id}`);
    key(d.outcomeKey, `${where} decision ${d.id}`);
    key(d.altTimelineKey, `${where} decision ${d.id}`);
  }
  for (const t of c.techniques) {
    if (!(t in TECHNIQUES)) fail(`${where}: unknown technique ${t}`);
    if (!c.evidence.some((e) => e.techniques?.includes(t))) warn(`${where}: technique "${t}" is never revealed by evidence`);
  }

  // World keys and URLs
  const w = c.world;
  for (const ct of w.contacts) {
    key(ct.nameKey, `${where} contact ${ct.id}`);
    for (const f of ct.facts ?? []) {
      key(f.labelKey, `${where} contact ${ct.id}`);
      key(f.valueKey, `${where} contact ${ct.id}`);
    }
    if (ct.number && !/^(05 0000 00\d\d|9200 000\d\d)$/.test(ct.number)) fail(`${where}: contact ${ct.id} number "${ct.number}" is not in the obviously-fake pattern`);
  }
  const contactIds = new Set(w.contacts.map((x) => x.id));
  for (const th of w.threads) {
    if (!contactIds.has(th.contactId)) fail(`${where}: thread ${th.id} has unknown contact ${th.contactId}`);
    for (const msg of th.messages) {
      key(msg.bodyKey, `${where} message ${msg.id}`);
      key(msg.timeKey, `${where} message ${msg.id}`);
      for (const l of msg.links ?? []) {
        checkUrl(l.url, `${where} link ${l.id}`);
        if (l.officialUrl) checkUrl(l.officialUrl, `${where} link ${l.id}`);
        if (l.opens && !w.sites.some((s) => s.id === l.opens!.siteId && s.pages.some((p) => p.id === l.opens!.pageId)))
          fail(`${where}: link ${l.id} opens unknown page ${l.opens.siteId}/${l.opens.pageId}`);
        if (!arDict[msg.bodyKey]?.includes(l.url)) warn(`${where}: link ${l.id} url does not appear in message text ${msg.bodyKey}`);
      }
    }
    for (const r of th.replies ?? []) {
      key(r.textKey, `${where} reply ${r.id}`);
      key(r.responseKey, `${where} reply ${r.id}`);
    }
  }
  if (!w.threads.some((t) => t.id === c.incoming.threadId)) fail(`${where}: incoming thread ${c.incoming.threadId} missing`);
  for (const o of w.orders) [o.titleKey, o.storeKey, o.statusKey, o.dateKey, o.carrierKey, o.paymentKey].forEach((k) => key(k, `${where} order ${o.id}`));
  for (const p of w.participations) [p.contestKey, p.organizerKey, p.dateKey].forEach((k) => key(k, `${where} participation ${p.id}`));
  for (const s of w.sites) {
    checkDomain(s.domain, `${where} site ${s.id}`);
    key(s.nameKey, `${where} site ${s.id}`);
    for (const p of s.pages) {
      key(p.titleKey, `${where} page ${p.id}`);
      for (const b of p.blocks) {
        if (b.type === 'text') {
          key(b.titleKey, `${where} page ${p.id}`);
          key(b.bodyKey, `${where} page ${p.id}`);
        } else if (b.type === 'contact') {
          key(b.labelKey, `${where} page ${p.id}`);
          if (!w.calls.some((call) => call.number === b.number)) warn(`${where}: site number ${b.number} has no call script`);
        } else if (b.type === 'list') {
          key(b.titleKey, `${where} page ${p.id}`);
          b.itemKeys.forEach((k) => key(k, `${where} page ${p.id}`));
        } else if (b.type === 'fake-form') {
          [b.titleKey, b.submitKey, b.warningKey, ...b.fieldKeys].forEach((k) => key(k, `${where} page ${p.id}`));
          if (s.official) fail(`${where}: official site ${s.id} contains a fake form`);
        }
      }
    }
  }
  for (const call of w.calls) {
    key(call.calleeKey, `${where} call ${call.number}`);
    call.lines.forEach((l) => key(l.textKey, `${where} call ${call.number}`));
  }
}

/* ---------- Test bank ---------- */
for (const form of ['A', 'B'] as const) {
  const items = TEST_BANK.filter((i) => i.form === form);
  if (items.length !== 6) fail(`test bank form ${form}: expected 6 items, found ${items.length}`);
  const scam = items.filter((i) => i.truth === 'scam').length;
  const polished = items.filter((i) => i.polished).length;
  if (scam !== 3) fail(`test bank form ${form}: expected 3 scam items, found ${scam}`);
  if (polished !== 3) fail(`test bank form ${form}: expected 3 polished items, found ${polished}`);
  for (const it of items) {
    key(it.textKey, `test ${it.id}`);
    key(it.senderKey, `test ${it.id}`);
    if (it.firstActions.length !== 4) fail(`test ${it.id}: expected 4 first actions`);
    const other = it.firstActions.filter((a) => a.otherChannel).length;
    if (other !== 1) fail(`test ${it.id}: expected exactly one other-channel action, found ${other}`);
    it.firstActions.forEach((a) => key(a.textKey, `test ${it.id}`));
  }
}
// Items must not reuse case message text.
for (const it of TEST_BANK) {
  const text = arDict[it.textKey];
  for (const c of CASES) for (const th of c.world.threads) for (const m of th.messages) if (text && arDict[m.bodyKey] === text) fail(`test ${it.id} duplicates case message ${m.id}`);
}

/* ---------- Techniques ---------- */
for (const t of Object.values(TECHNIQUES)) {
  key(t.nameKey, 'techniques');
  key(t.descKey, 'techniques');
}

/* ---------- en parity ---------- */
if (requireEn) {
  for (const k of Object.keys(arDict)) if (!(k in enDict)) fail(`en.json missing "${k}"`);
  for (const k of Object.keys(enDict)) if (!(k in arDict)) warn(`en.json has extra key "${k}"`);
}

/* ---------- Report ---------- */
for (const w of warnings) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`FAIL  ${e}`);
console.log(`\nvalidate:content — ${CASES.length} case(s), ${TEST_BANK.length} test items, ${usedKeys.size} keys checked, ${warnings.length} warning(s), ${errors.length} error(s)${requireEn ? ' [en required]' : ''}`);
process.exit(errors.length ? 1 : 0);

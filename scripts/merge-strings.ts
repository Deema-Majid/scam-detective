/**
 * Merges a draft strings file into src/i18n/<lang>.json without reordering
 * existing keys. Refuses to overwrite a key with a different value unless
 * --force is passed, so a stale draft can never silently change live text.
 *
 *   npx tsx scripts/merge-strings.ts docs/content-drafts/cases-2-3.ar.json ar
 *   npx tsx scripts/merge-strings.ts docs/content-drafts/content.en.json en [--force]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const [, , draftPath, lang, ...flags] = process.argv;
if (!draftPath || (lang !== 'ar' && lang !== 'en')) {
  console.error('usage: tsx scripts/merge-strings.ts <draft.json> <ar|en> [--force] [--only=prefix1,prefix2]');
  process.exit(2);
}
const force = flags.includes('--force');
const only = flags.find((f) => f.startsWith('--only='))?.slice(7).split(',').filter(Boolean) ?? [];

const target = `src/i18n/${lang}.json`;
const live = JSON.parse(readFileSync(target, 'utf8')) as Record<string, string>;
const draft = JSON.parse(readFileSync(draftPath, 'utf8')) as Record<string, string>;

let added = 0;
let changed = 0;
let skipped = 0;
const conflicts: string[] = [];
for (const [k, v] of Object.entries(draft)) {
  if (k.startsWith('_')) continue;
  if (only.length && !only.some((p) => k.startsWith(p))) {
    skipped++;
    continue;
  }
  if (!(k in live)) {
    live[k] = v;
    added++;
  } else if (live[k] !== v) {
    if (force) {
      live[k] = v;
      changed++;
    } else {
      conflicts.push(k);
    }
  }
}
if (conflicts.length) {
  console.error(`Refusing to overwrite ${conflicts.length} existing key(s) with different text (use --force):\n  ${conflicts.join('\n  ')}`);
  process.exit(1);
}
writeFileSync(target, JSON.stringify(live, null, 2) + '\n', 'utf8');
console.log(`${target}: +${added} added, ${changed} changed, ${skipped} skipped (filtered)`);

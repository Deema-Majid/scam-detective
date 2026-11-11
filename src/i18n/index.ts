import ar from './ar.json';
import en from './en.json';
import { interpolate, resolveGender, type Gender } from './genderMarkers';

export type Lang = 'ar' | 'en';
export type Dict = Record<string, string>;

export const dictionaries: Record<Lang, Dict> = { ar: ar as Dict, en: en as Dict };

/**
 * Core translate function. Falls back to Arabic, then to the key itself
 * (keys are visible in the UI only when a string is missing, which the
 * content validator catches before shipping).
 */
export function translate(
  lang: Lang,
  gender: Gender,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const raw = dictionaries[lang][key] ?? dictionaries.ar[key] ?? key;
  const text = interpolate(resolveGender(raw, gender), vars);
  return lang === 'ar' ? isolateNumbers(text) : text;
}

const LRI = '⁦';
const PDI = '⁩';
const URL_SPLIT = /(https?:\/\/[^\s]+)/g;
/** Mobile numbers (05 0000 0011), official lines (9200 00011) and amounts with thousands separators (2,300). */
const NUMBER_RUN = /(?<![\d,])(?:0\d ?\d{4} ?\d{4}|9200 ?\d{5}|\d{1,3}(?:,\d{3})+)(?![\d,])/g;

/**
 * Arabic text reverses multi-part numbers ("05 0000 0011" shows as "0011 0000 05").
 * Wrap them in invisible left-to-right isolates. URLs are left untouched on
 * purpose: message links are detected by their exact text (MessageBubble) and
 * are already rendered inside <bdi>.
 */
export function isolateNumbers(text: string): string {
  return text
    .split(URL_SPLIT)
    .map((part, i) => (i % 2 === 1 ? part : part.replace(NUMBER_RUN, (m) => `${LRI}${m}${PDI}`)))
    .join('');
}

export function hasKey(lang: Lang, key: string): boolean {
  return key in dictionaries[lang];
}

export function dirOf(lang: Lang): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

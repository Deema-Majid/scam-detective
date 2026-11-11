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
  return interpolate(resolveGender(raw, gender), vars);
}

export function hasKey(lang: Lang, key: string): boolean {
  return key in dictionaries[lang];
}

export function dirOf(lang: Lang): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

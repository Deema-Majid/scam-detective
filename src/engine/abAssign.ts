import type { TestForm } from './types';

/**
 * Tester codes look like "T-0427". Odd trailing number -> form A before, B after.
 * Even -> B before, A after. Codes without digits fall back to a stable hash so
 * the split stays roughly balanced.
 */
export function assignForms(testerCode: string): { pre: TestForm; post: TestForm } {
  const digits = testerCode.match(/\d+/g)?.join('') ?? '';
  let n: number;
  if (digits.length > 0) {
    n = Number(digits.slice(-4));
  } else {
    n = 0;
    for (const ch of testerCode) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  }
  const odd = n % 2 === 1;
  return odd ? { pre: 'A', post: 'B' } : { pre: 'B', post: 'A' };
}

/** Arabic-Indic (U+0660..) and Persian (U+06F0..) digits -> Latin digits. */
export function toLatinDigits(input: string): string {
  return input.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (ch) => {
    const c = ch.charCodeAt(0);
    return String(c >= 0x06f0 ? c - 0x06f0 : c - 0x0660);
  });
}

/**
 * Normalizes user input to the canonical "T-0427": Arabic-Indic digits, spaces,
 * lower case, a missing "T" or "-" are all accepted ("12", "T-1", "٠٤٢٧").
 * Input that does not fit is returned cleaned but unchanged in shape (then invalid).
 */
export function normalizeTesterCode(input: string): string {
  const cleaned = toLatinDigits(input).trim().toUpperCase().replace(/[\s\u200E\u200F\u061C]+/g, '');
  const m = cleaned.match(/^T?[-\u2013\u2212]?(\d{1,6})$/);
  if (m) return `T-${m[1].padStart(4, '0')}`;
  return cleaned;
}

export function isValidTesterCode(input: string): boolean {
  return /^T-\d{4,6}$/.test(normalizeTesterCode(input));
}

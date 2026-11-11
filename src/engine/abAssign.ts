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

/** Normalizes user input to the canonical "T-0427" shape when possible. */
export function normalizeTesterCode(input: string): string {
  const trimmed = input.trim().toUpperCase().replace(/\s+/g, '');
  const m = trimmed.match(/^T-?(\d{1,6})$/);
  if (m) return `T-${m[1].padStart(4, '0')}`;
  return trimmed;
}

export function isValidTesterCode(input: string): boolean {
  return /^T-\d{4,6}$/.test(normalizeTesterCode(input));
}

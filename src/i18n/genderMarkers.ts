/**
 * Gender markers in translation strings:  {{f:سدّدي|m:سدّد}}
 * The addressed player is feminine by default (DECISIONS.md #5).
 * This module is pure so it can be unit-tested without React.
 */
export type Gender = 'f' | 'm';

const MARKER = /\{\{f:([^|}]*)\|m:([^}]*)\}\}/g;

export function resolveGender(text: string, gender: Gender): string {
  return text.replace(MARKER, (_m, f: string, m: string) => (gender === 'f' ? f : m));
}

/** Returns true if the string still contains an unresolved or malformed marker. */
export function hasBrokenMarker(text: string): boolean {
  const stripped = text.replace(MARKER, '');
  return /\{\{|\}\}/.test(stripped);
}

export function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

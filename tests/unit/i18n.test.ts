import { describe, expect, it } from 'vitest';
import { hasBrokenMarker, interpolate, resolveGender } from '../../src/i18n/genderMarkers';
import { translate } from '../../src/i18n';
import { assignForms, isValidTesterCode, normalizeTesterCode } from '../../src/engine/abAssign';

describe('gender markers', () => {
  it('resolves feminine and masculine forms', () => {
    const s = 'لتفادي إعادتها {{f:سدّدي|m:سدّد}} من هنا';
    expect(resolveGender(s, 'f')).toBe('لتفادي إعادتها سدّدي من هنا');
    expect(resolveGender(s, 'm')).toBe('لتفادي إعادتها سدّد من هنا');
  });
  it('handles several markers and empty sides', () => {
    expect(resolveGender('{{f:ي|m:}}{{f:|m:x}}', 'f')).toBe('ي');
    expect(resolveGender('{{f:ي|m:}}{{f:|m:x}}', 'm')).toBe('x');
  });
  it('detects broken markers', () => {
    expect(hasBrokenMarker('ok {{f:a|m:b}}')).toBe(false);
    expect(hasBrokenMarker('bad {{f:a|b}}')).toBe(true);
  });
  it('interpolates variables and leaves unknown ones', () => {
    expect(interpolate('ثقتك {conf}% و{x}', { conf: 80 })).toBe('ثقتك 80% و{x}');
  });
});

describe('translate', () => {
  it('falls back to Arabic, then to the key', () => {
    expect(translate('en', 'f', 'verdict.scam')).toBe('Scam');
    expect(translate('en', 'f', 'verdict.legit')).toBe('Legitimate');
    expect(translate('ar', 'f', 'no.such.key')).toBe('no.such.key');
  });
  it('applies gender to real strings', () => {
    expect(translate('ar', 'm', 'app.start')).toBe('ابدأ التحقيق');
    expect(translate('ar', 'f', 'app.start')).toBe('ابدئي التحقيق');
  });
});

describe('A/B assignment by tester code', () => {
  it('odd codes take A first, even codes take B first', () => {
    expect(assignForms('T-0427')).toEqual({ pre: 'A', post: 'B' });
    expect(assignForms('T-0428')).toEqual({ pre: 'B', post: 'A' });
  });
  it('is stable for codes without digits', () => {
    expect(assignForms('abc')).toEqual(assignForms('abc'));
  });
  it('normalizes and validates codes', () => {
    expect(normalizeTesterCode(' t427 ')).toBe('T-0427');
    expect(normalizeTesterCode('T-12')).toBe('T-0012');
    expect(isValidTesterCode('t-0427')).toBe(true);
    expect(isValidTesterCode('hello')).toBe(false);
  });
});

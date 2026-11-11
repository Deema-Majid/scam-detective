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

describe('number isolation in Arabic text', () => {
  const LRI = '\u2066';
  const PDI = '\u2069';
  it('wraps phone numbers, official lines and thousands amounts', async () => {
    const { isolateNumbers } = await import('../../src/i18n');
    expect(isolateNumbers('من رقم (05 0000 0011) لا')).toBe(`من رقم (${LRI}05 0000 0011${PDI}) لا`);
    expect(isolateNumbers('اتصل 9200 00011 الآن')).toBe(`اتصل ${LRI}9200 00011${PDI} الآن`);
    expect(isolateNumbers('خسرتِ 2,300 ريال')).toBe(`خسرتِ ${LRI}2,300${PDI} ريال`);
  });
  it('leaves URLs, plain numbers and English untouched', async () => {
    const { isolateNumbers, translate } = await import('../../src/i18n');
    const url = 'https://rafeef-express-pay.example/f/7XQ2';
    expect(isolateNumbers(`سدّد من هنا: ${url}`)).toBe(`سدّد من هنا: ${url}`);
    expect(isolateNumbers('18 ريال و70%')).toBe('18 ريال و70%');
    expect(translate('en', 'f', 'case1.E1.body')).not.toContain(LRI);
    expect(translate('ar', 'f', 'case1.msg.rafeef1')).toContain(url);
  });
});

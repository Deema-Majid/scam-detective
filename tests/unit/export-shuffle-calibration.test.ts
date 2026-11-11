import { describe, expect, it } from 'vitest';
import { decodeResults, encodeResults, sanitizeFreeText, type Results } from '../../src/store/exportResults';
import { hashString, seededShuffle } from '../../src/engine/shuffle';
import { binJudgements, calibrationVerdict } from '../../src/engine/calibration';

const sample: Results = {
  v: 1,
  tester: 'T-0427',
  lang: 'ar',
  gender: 'f',
  startedAt: 1,
  finishedAt: 2,
  cases: [],
  summary: { otherChannelCount: 1, brierCases: 0.1 },
} as Results;

describe('results code', () => {
  it('round-trips through SD1 (deflate-raw + base64url)', async () => {
    const code = await encodeResults(sample);
    expect(code.startsWith('SD1.') || code.startsWith('SD0.')).toBe(true);
    expect(code).toMatch(/^SD[01]\.[A-Za-z0-9_-]+$/);
    expect(await decodeResults(code)).toEqual(sample);
  });
  it('contains no personal fields and rejects junk', async () => {
    const code = await encodeResults(sample);
    expect(JSON.stringify(await decodeResults(code))).not.toMatch(/name|email|phone/i);
    await expect(decodeResults('hello')).rejects.toThrow();
  });
});

describe('seededShuffle', () => {
  const items = ['a', 'b', 'c', 'd'];
  it('is stable for a seed, differs across seeds, and never mutates', () => {
    expect(seededShuffle(items, 'T-0427:case1')).toEqual(seededShuffle(items, 'T-0427:case1'));
    expect(items).toEqual(['a', 'b', 'c', 'd']);
    const orders = new Set(['s1', 's2', 's3', 's4', 's5', 's6'].map((s) => seededShuffle(items, s).join('')));
    expect(orders.size).toBeGreaterThan(1);
    expect([...seededShuffle(items, 'x')].sort()).toEqual(items);
  });
  it('hashes deterministically', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
  });
});

describe('calibration', () => {
  it('bins into low/mid/high and omits empty bins', () => {
    const bins = binJudgements([
      { confidence: 0.5, correct: false },
      { confidence: 0.6, correct: true },
      { confidence: 1, correct: true },
    ]);
    expect(bins.map((b) => b.id)).toEqual(['low', 'high']);
    expect(bins[0].n).toBe(2);
    expect(bins[0].accuracy).toBe(50);
  });
  it('flags over- and under-confidence', () => {
    expect(calibrationVerdict([{ confidence: 1, correct: false }, { confidence: 1, correct: true }])).toBe('over');
    expect(calibrationVerdict([{ confidence: 0.5, correct: true }, { confidence: 0.5, correct: true }])).toBe('under');
    expect(calibrationVerdict([])).toBeNull();
  });
});

describe('sanitizeFreeText', () => {
  it('replaces emails and long numbers, keeps normal text', () => {
    expect(sanitizeFreeText('write me at sara@mail.example ok')).toBe('write me at [email] ok');
    expect(sanitizeFreeText('call 0500000011 now')).toBe('call [number] now');
    expect(sanitizeFreeText('رقمي ٠٥٠٠٠٠٠٠١١')).toBe('رقمي [number]');
    expect(sanitizeFreeText('05 0000 0011')).toBe('[number]');
    expect(sanitizeFreeText('I lost 2,300 riyals in 3 minutes')).toBe('I lost 2,300 riyals in 3 minutes');
    expect(sanitizeFreeText('ما فهمت الخطوة 4')).toBe('ما فهمت الخطوة 4');
  });
});

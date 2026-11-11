import { describe, expect, it } from 'vitest';
import { brierMean, brierOne, evaluateVerdict, findDeduction, isProofSufficient, scoreTest } from '../../src/engine/scoring';
import { case1 } from '../../src/content/cases/case1';
import { itemsForForm } from '../../src/content/test-bank';

describe('Brier score', () => {
  it('is 0 for a fully confident correct answer and 1 for a fully confident wrong one', () => {
    expect(brierOne(1, true)).toBe(0);
    expect(brierOne(1, false)).toBe(1);
  });
  it('is 0.25 at 50% confidence either way', () => {
    expect(brierOne(0.5, true)).toBeCloseTo(0.25);
    expect(brierOne(0.5, false)).toBeCloseTo(0.25);
  });
  it('clamps confidence into [0.5, 1]', () => {
    expect(brierOne(0.1, true)).toBeCloseTo(0.25);
    expect(brierOne(1.7, false)).toBe(1);
  });
  it('averages and returns null for no items', () => {
    expect(brierMean([])).toBeNull();
    expect(brierMean([{ confidence: 1, correct: true }, { confidence: 1, correct: false }])).toBeCloseTo(0.5);
  });
});

describe('verdict evaluation (case 1)', () => {
  it('one deduction proving the truth is sufficient', () => {
    expect(isProofSufficient(case1, 'scam', ['D1'])).toBe(true);
  });
  it('two non-misleading supporting evidence are sufficient', () => {
    expect(isProofSufficient(case1, 'scam', ['E1', 'E2'])).toBe(true);
  });
  it('no single evidence is sufficient', () => {
    for (const e of case1.evidence) expect(isProofSufficient(case1, case1.truth, [e.id])).toBe(false);
  });
  it('misleading evidence does not count as proof', () => {
    expect(isProofSufficient(case1, 'legit', ['E3'])).toBe(false);
    expect(isProofSufficient(case1, 'scam', ['E3', 'E4'])).toBe(false);
  });
  it('correct + proven = full, correct without proof = partial, wrong = wrong', () => {
    expect(evaluateVerdict(case1, { truth: 'scam', confidence: 0.9, proof: ['D2'] }).outcome).toBe('full');
    expect(evaluateVerdict(case1, { truth: 'scam', confidence: 0.9, proof: ['E1'] }).outcome).toBe('partial');
    expect(evaluateVerdict(case1, { truth: 'legit', confidence: 0.9, proof: ['E3', 'E4'] }).outcome).toBe('wrong');
  });
});

describe('deductions', () => {
  it('finds a pair in either order and never pairs an item with itself', () => {
    expect(findDeduction(case1.deductions, 'E3', 'E4')?.id).toBe('D1');
    expect(findDeduction(case1.deductions, 'E4', 'E3')?.id).toBe('D1');
    expect(findDeduction(case1.deductions, 'E4', 'E4')).toBeNull();
    expect(findDeduction(case1.deductions, 'E1', 'E2')).toBeNull();
  });
});

describe('pre/post test scoring', () => {
  const items = itemsForForm('A');
  it('computes accuracy, Brier, other-channel rate and the polished/sloppy split', () => {
    const answers = items.map((it) => ({
      itemId: it.id,
      verdict: it.truth,
      confidence: 1,
      firstActionId: it.firstActions.find((a) => a.otherChannel)!.id,
    }));
    const s = scoreTest(items, answers);
    expect(s.n).toBe(6);
    expect(s.accuracy).toBe(1);
    expect(s.brier).toBe(0);
    expect(s.otherChannelRate).toBe(1);
    expect(s.accuracyPolished).toBe(1);
    expect(s.accuracySloppy).toBe(1);
  });
  it('ignores answers for unknown items', () => {
    const s = scoreTest(items, [{ itemId: 'nope', verdict: 'scam', confidence: 0.7, firstActionId: 'x' }]);
    expect(s.n).toBe(0);
  });
  it('splits accuracy by polished vs sloppy', () => {
    const answers = items.map((it) => ({
      itemId: it.id,
      verdict: it.polished ? it.truth : it.truth === 'scam' ? 'legit' : 'scam',
      confidence: 0.6,
      firstActionId: it.firstActions[0].id,
    })) as Parameters<typeof scoreTest>[1];
    const s = scoreTest(items, answers);
    expect(s.accuracyPolished).toBe(1);
    expect(s.accuracySloppy).toBe(0);
  });
});

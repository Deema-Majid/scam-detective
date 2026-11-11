import { describe, expect, it } from 'vitest';
import * as m from '../../src/engine/caseMachine';
import { case1 } from '../../src/content/cases/case1';

describe('case state machine', () => {
  it('walks the phases in order and refuses skipping', () => {
    let run = m.newRun(case1, 1000);
    expect(run.phase).toBe('incoming');
    expect(() => m.goToVerdict(run)).toThrow();
    run = m.startInvestigating(run);
    expect(run.phase).toBe('investigating');
    run = m.goToVerdict(run);
    run = m.submitVerdict(run, { truth: 'scam', confidence: 0.8, proof: ['D1'] });
    expect(run.phase).toBe('decision');
    run = m.submitDecision(case1, run, 'ignore');
    expect(run.phase).toBe('outcome');
    run = m.goToDebrief(run, 61_000);
    expect(run.phase).toBe('debrief');
    expect(m.durationSec(run)).toBe(60);
  });

  it('collects evidence only while investigating, once, and records the tool', () => {
    let run = m.newRun(case1);
    run = m.collectEvidence(case1, run, 'E1');
    expect(run.collected).toEqual([]);
    run = m.startInvestigating(run);
    run = m.collectEvidence(case1, run, 'E1');
    run = m.collectEvidence(case1, run, 'E1');
    run = m.collectEvidence(case1, run, 'nope');
    expect(run.collected).toEqual(['E1']);
    expect(run.toolsUsed).toEqual(['sender']);
  });

  it('unlocks a deduction only when both cards are collected and the pair is registered', () => {
    let run = m.startInvestigating(m.newRun(case1));
    expect(m.linkEvidence(case1, run, 'E3', 'E4').deductionId).toBeNull();
    run = m.collectEvidence(case1, run, 'E3');
    run = m.collectEvidence(case1, run, 'E4');
    const r = m.linkEvidence(case1, run, 'E4', 'E3');
    expect(r.deductionId).toBe('D1');
    expect(r.run.deductions).toEqual(['D1']);
    // linking again keeps a single entry
    expect(m.linkEvidence(case1, r.run, 'E3', 'E4').run.deductions).toEqual(['D1']);
  });

  it('clamps confidence and rejects unknown decisions', () => {
    let run = m.goToVerdict(m.startInvestigating(m.newRun(case1)));
    run = m.submitVerdict(run, { truth: 'scam', confidence: 1.5, proof: [] });
    expect(run.verdict?.confidence).toBe(1);
    expect(() => m.submitDecision(case1, run, 'nope')).toThrow();
  });

  it('tracks opened links and fired interrupt', () => {
    let run = m.startInvestigating(m.newRun(case1));
    run = m.openLink(run, 'L1');
    run = m.openLink(run, 'L1');
    expect(run.openedLinks).toEqual(['L1']);
    expect(run.toolsUsed).toContain('link');
    expect(m.fireInterrupt(run).interruptFired).toBe(true);
  });
});

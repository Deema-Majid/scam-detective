import type { Judgement } from '@/engine/calibration';
import { evaluateVerdict, scoreTest } from '@/engine/scoring';
import { caseById } from '@/content/cases';
import { itemsForForm } from '@/content/test-bank';
import type { GameState } from './gameStore';

/**
 * Every judgement the player made so far (pre-test items, case verdicts,
 * post-test items) as {confidence, correct}. Feeds the confidence mirror and
 * the calibration chart (A1). Pure: no React, unit-testable.
 */
export function allJudgements(s: Pick<GameState, 'pre' | 'post' | 'runs' | 'caseOrder'>): Judgement[] {
  const out: Judgement[] = [];
  for (const which of ['pre', 'post'] as const) {
    const session = s[which];
    if (!session) continue;
    const scored = scoreTest(itemsForForm(session.form), session.answers);
    for (const it of scored.items) out.push({ confidence: it.confidence, correct: it.correct });
  }
  for (const id of s.caseOrder) {
    const run = s.runs[id];
    const c = caseById(id);
    if (!run?.verdict || !c) continue;
    const res = evaluateVerdict(c, run.verdict);
    out.push({ confidence: run.verdict.confidence, correct: res.correct });
  }
  return out;
}

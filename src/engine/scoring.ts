import type { Case, CaseRun, Deduction, Evidence, TestItem, Truth, Verdict } from './types';

/* ------------------------------------------------------------------ */
/* Brier score (A1 confidence mirror)                                   */
/* ------------------------------------------------------------------ */

/** (confidence - outcome)^2 for one judgement. outcome = 1 if correct, 0 if wrong. */
export function brierOne(confidence: number, correct: boolean): number {
  const c = clamp(confidence, 0.5, 1);
  const o = correct ? 1 : 0;
  return (c - o) ** 2;
}

/** Mean Brier score over several judgements. Lower is better; 0 is perfect. */
export function brierMean(items: { confidence: number; correct: boolean }[]): number | null {
  if (items.length === 0) return null;
  const sum = items.reduce((acc, it) => acc + brierOne(it.confidence, it.correct), 0);
  return sum / items.length;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/* ------------------------------------------------------------------ */
/* Verdict evaluation (5.3 "prove why")                                 */
/* ------------------------------------------------------------------ */

export type VerdictResult = {
  correct: boolean;
  /** Proof is sufficient: >= 1 deduction proving the truth, or >= 2 non-misleading evidence supporting it. */
  proven: boolean;
  /** full = correct + proven, partial = correct but not proven, wrong = incorrect */
  outcome: 'full' | 'partial' | 'wrong';
  brier: number;
};

export function evaluateVerdict(c: Case, verdict: Verdict): VerdictResult {
  const correct = verdict.truth === c.truth;
  const proven = isProofSufficient(c, verdict.truth, verdict.proof);
  const outcome = !correct ? 'wrong' : proven ? 'full' : 'partial';
  return { correct, proven, outcome, brier: brierOne(verdict.confidence, correct) };
}

export function isProofSufficient(c: Case, claimed: Truth, proof: string[]): boolean {
  const ids = new Set(proof);
  const deductions = c.deductions.filter((d) => ids.has(d.id) && d.proves === claimed);
  if (deductions.length >= 1) return true;
  const evidence = c.evidence.filter((e) => ids.has(e.id) && e.supports === claimed && !e.misleading);
  return evidence.length >= 2;
}

/* ------------------------------------------------------------------ */
/* Deductions (5.2 notebook linking)                                    */
/* ------------------------------------------------------------------ */

/** Returns the deduction unlocked by linking a and b, or null. Order does not matter. */
export function findDeduction(deductions: Deduction[], a: string, b: string): Deduction | null {
  if (a === b) return null;
  return (
    deductions.find(
      (d) => (d.pair[0] === a && d.pair[1] === b) || (d.pair[0] === b && d.pair[1] === a),
    ) ?? null
  );
}

/** Evidence ids that still take part in at least one not-yet-unlocked deduction (for hints). */
export function linkableEvidence(c: Case, run: CaseRun): string[] {
  const unlocked = new Set(run.deductions);
  const collected = new Set(run.collected);
  const ids = new Set<string>();
  for (const d of c.deductions) {
    if (unlocked.has(d.id)) continue;
    if (collected.has(d.pair[0]) && collected.has(d.pair[1])) {
      ids.add(d.pair[0]);
      ids.add(d.pair[1]);
    }
  }
  return [...ids];
}

/* ------------------------------------------------------------------ */
/* Tools used / ignored (A6 adaptivity)                                 */
/* ------------------------------------------------------------------ */

export function ignoredTools(c: Case, run: CaseRun) {
  const used = new Set(run.toolsUsed);
  return c.tools.filter((t) => t !== 'interrupt' && !used.has(t));
}

export function evidenceById(c: Case, id: string): Evidence | undefined {
  return c.evidence.find((e) => e.id === id);
}

/* ------------------------------------------------------------------ */
/* Pre/post test scoring (A2)                                           */
/* ------------------------------------------------------------------ */

export type TestAnswer = {
  itemId: string;
  verdict: Truth;
  confidence: number; // 0.5 .. 1
  firstActionId: string;
};

export type ScoredItem = {
  itemId: string;
  truth: Truth;
  polished: boolean;
  correct: boolean;
  confidence: number;
  brier: number;
  otherChannel: boolean;
};

export type TestScore = {
  n: number;
  accuracy: number;
  brier: number;
  otherChannelRate: number;
  accuracyPolished: number | null;
  accuracySloppy: number | null;
  items: ScoredItem[];
};

export function scoreTest(items: TestItem[], answers: TestAnswer[]): TestScore {
  const byId = new Map(items.map((i) => [i.id, i]));
  const scored: ScoredItem[] = [];
  for (const a of answers) {
    const item = byId.get(a.itemId);
    if (!item) continue;
    const correct = a.verdict === item.truth;
    const action = item.firstActions.find((f) => f.id === a.firstActionId);
    scored.push({
      itemId: item.id,
      truth: item.truth,
      polished: item.polished,
      correct,
      confidence: a.confidence,
      brier: brierOne(a.confidence, correct),
      otherChannel: action?.otherChannel ?? false,
    });
  }
  const n = scored.length;
  const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  const pol = scored.filter((s) => s.polished);
  const slo = scored.filter((s) => !s.polished);
  return {
    n,
    accuracy: n ? scored.filter((s) => s.correct).length / n : 0,
    brier: n ? scored.reduce((s, x) => s + x.brier, 0) / n : 0,
    otherChannelRate: n ? scored.filter((s) => s.otherChannel).length / n : 0,
    accuracyPolished: mean(pol.map((s) => (s.correct ? 1 : 0))),
    accuracySloppy: mean(slo.map((s) => (s.correct ? 1 : 0))),
    items: scored,
  };
}

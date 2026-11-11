/**
 * Confidence mirror (A1) helpers shared by the debrief, the final summary and
 * the calibration chart (docs/design.md §6). Pure functions.
 */

export type Judgement = { confidence: number; correct: boolean };

export type CalibrationBin = {
  id: 'low' | 'mid' | 'high';
  /** Confidence range in percent, inclusive. */
  lo: number;
  hi: number;
  n: number;
  correct: number;
  /** Mean confidence in percent (x on the chart). */
  meanConfidence: number;
  /** Share of correct judgements in percent (y on the chart). */
  accuracy: number;
};

const BINS: { id: CalibrationBin['id']; lo: number; hi: number }[] = [
  { id: 'low', lo: 50, hi: 65 },
  { id: 'mid', lo: 70, hi: 85 },
  { id: 'high', lo: 90, hi: 100 },
];

/** Groups judgements into the three confidence bins. Empty bins are omitted. */
export function binJudgements(judgements: Judgement[]): CalibrationBin[] {
  const out: CalibrationBin[] = [];
  for (const b of BINS) {
    const inBin = judgements.filter((j) => {
      const pct = Math.round(j.confidence * 100);
      return pct >= b.lo - 2 && pct <= b.hi + 2; // tolerate 67/68 rounding noise
    });
    if (inBin.length === 0) continue;
    const correct = inBin.filter((j) => j.correct).length;
    const meanConfidence = inBin.reduce((s, j) => s + j.confidence * 100, 0) / inBin.length;
    out.push({ ...b, n: inBin.length, correct, meanConfidence, accuracy: (correct / inBin.length) * 100 });
  }
  return out;
}

export type CalibrationVerdict = 'ok' | 'over' | 'under';

/**
 * One-line judgement of the player's calibration so far: mean confidence vs.
 * accuracy. Within 10 points = ok; confidence above accuracy = over.
 */
export function calibrationVerdict(judgements: Judgement[]): CalibrationVerdict | null {
  if (judgements.length === 0) return null;
  const meanConf = judgements.reduce((s, j) => s + j.confidence, 0) / judgements.length;
  const acc = judgements.filter((j) => j.correct).length / judgements.length;
  const diff = meanConf - acc;
  if (Math.abs(diff) <= 0.1) return 'ok';
  return diff > 0 ? 'over' : 'under';
}

/** Where most points sit relative to the diagonal (for the sentence under the chart). */
export function mostPointsSide(bins: CalibrationBin[]): CalibrationVerdict | null {
  if (bins.length === 0) return null;
  let over = 0;
  let under = 0;
  for (const b of bins) {
    const diff = b.meanConfidence - b.accuracy;
    if (diff > 10) over += b.n;
    else if (diff < -10) under += b.n;
  }
  const total = bins.reduce((s, b) => s + b.n, 0);
  if (over > total / 2) return 'over';
  if (under > total / 2) return 'under';
  return 'ok';
}

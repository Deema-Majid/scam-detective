import type { Case, CasePhase, CaseRun, Decision, ToolId, Verdict } from './types';
import { findDeduction } from './scoring';

/**
 * Pure state machine for one case:
 *   incoming -> investigating -> verdict -> decision -> outcome -> debrief
 * Every transition returns a new CaseRun (no mutation) so it is trivially testable
 * and the Zustand store just stores the result.
 */

const ORDER: CasePhase[] = ['incoming', 'investigating', 'verdict', 'decision', 'outcome', 'debrief'];

export function newRun(c: Case, now = Date.now(), adaptiveHint?: ToolId): CaseRun {
  return {
    caseId: c.id,
    phase: 'incoming',
    startedAt: now,
    collected: [],
    deductions: [],
    toolsUsed: [],
    openedLinks: [],
    interruptFired: false,
    adaptiveHint,
  };
}

export function canAdvance(from: CasePhase, to: CasePhase): boolean {
  return ORDER.indexOf(to) === ORDER.indexOf(from) + 1;
}

function advance(run: CaseRun, to: CasePhase): CaseRun {
  if (!canAdvance(run.phase, to)) {
    throw new Error(`Illegal case transition ${run.phase} -> ${to}`);
  }
  return { ...run, phase: to };
}

export function startInvestigating(run: CaseRun): CaseRun {
  return advance(run, 'investigating');
}

export function useTool(run: CaseRun, tool: ToolId): CaseRun {
  if (run.toolsUsed.includes(tool)) return run;
  return { ...run, toolsUsed: [...run.toolsUsed, tool] };
}

export function openLink(run: CaseRun, linkId: string): CaseRun {
  const r = useTool(run, 'link');
  if (r.openedLinks.includes(linkId)) return r;
  return { ...r, openedLinks: [...r.openedLinks, linkId] };
}

export function collectEvidence(c: Case, run: CaseRun, evidenceId: string): CaseRun {
  if (run.phase !== 'investigating') return run;
  const ev = c.evidence.find((e) => e.id === evidenceId);
  if (!ev || run.collected.includes(evidenceId)) return run;
  return useTool({ ...run, collected: [...run.collected, evidenceId] }, ev.tool);
}

export type LinkResult = { run: CaseRun; deductionId: string | null };

/** Links two collected evidence cards. Unlocks a deduction when the pair is registered. */
export function linkEvidence(c: Case, run: CaseRun, a: string, b: string): LinkResult {
  if (!run.collected.includes(a) || !run.collected.includes(b)) return { run, deductionId: null };
  const d = findDeduction(c.deductions, a, b);
  if (!d || run.deductions.includes(d.id)) return { run, deductionId: d?.id ?? null };
  return { run: { ...run, deductions: [...run.deductions, d.id] }, deductionId: d.id };
}

export function fireInterrupt(run: CaseRun): CaseRun {
  return { ...run, interruptFired: true };
}

export function goToVerdict(run: CaseRun): CaseRun {
  return advance(run, 'verdict');
}

export function submitVerdict(run: CaseRun, verdict: Verdict): CaseRun {
  if (run.phase !== 'verdict') throw new Error('Verdict can only be submitted in the verdict phase');
  const confidence = Math.min(1, Math.max(0.5, verdict.confidence));
  return advance({ ...run, verdict: { ...verdict, confidence } }, 'decision');
}

export function submitDecision(c: Case, run: CaseRun, decisionId: string): CaseRun {
  if (run.phase !== 'decision') throw new Error('Decision can only be made in the decision phase');
  const d: Decision | undefined = c.decisions.find((x) => x.id === decisionId);
  if (!d) throw new Error(`Unknown decision ${decisionId}`);
  return advance({ ...run, decisionId }, 'outcome');
}

export function goToDebrief(run: CaseRun, now = Date.now()): CaseRun {
  return advance({ ...run, finishedAt: now }, 'debrief');
}

export function durationSec(run: CaseRun, now = Date.now()): number {
  return Math.round(((run.finishedAt ?? now) - run.startedAt) / 1000);
}

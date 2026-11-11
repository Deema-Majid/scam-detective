import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Case, CaseRun, Technique, TestForm, ToolId, Verdict } from '@/engine/types';
import * as machine from '@/engine/caseMachine';
import { evaluateVerdict, ignoredTools, type TestAnswer } from '@/engine/scoring';
import { CASES, caseById } from '@/content/cases';
import { assignForms } from '@/engine/abAssign';

/**
 * Top-level game state. Persisted to localStorage only (rule 6: no servers,
 * no analytics). Everything exportable is derived from this store by
 * src/store/exportResults.ts.
 */

export type Mode = 'normal' | 'tester' | 'family';
export type AgeBand = '13-15' | '16-18' | '19+';

export type Screen =
  | 'intro'
  | 'tester-code'
  | 'consent'
  | 'pretest'
  | 'case'
  | 'posttest'
  | 'feedback'
  | 'summary'
  | 'results-code'
  | 'family-card';

export type TestSession = { form: TestForm; answers: TestAnswer[]; startedAt: number; finishedAt?: number };

export type Feedback = { open: string[]; likert: number[] };

export type TechniqueHit = { caseId: string; evidenceId: string };

export type GameState = {
  mode: Mode;
  screen: Screen;
  startedAt: number;
  tester?: { code: string; age?: AgeBand; consentAt?: number; forms: { pre: TestForm; post: TestForm } };
  pre?: TestSession;
  post?: TestSession;
  feedback?: Feedback;
  /** Case order for this session (family mode plays one case). */
  caseOrder: string[];
  currentCaseId?: string;
  runs: Record<string, CaseRun>;
  techniqueMap: Partial<Record<Technique, TechniqueHit[]>>;
  altTimelinesUnlocked: boolean;

  // actions
  setMode: (mode: Mode, caseIds?: string[]) => void;
  setScreen: (s: Screen) => void;
  setTester: (code: string, age?: AgeBand) => void;
  consent: () => void;
  startTest: (which: 'pre' | 'post') => void;
  answerTest: (which: 'pre' | 'post', answer: TestAnswer) => void;
  finishTest: (which: 'pre' | 'post') => void;
  setFeedback: (f: Feedback) => void;

  startCase: (caseId: string) => void;
  startInvestigating: () => void;
  useTool: (tool: ToolId) => void;
  openLink: (linkId: string) => void;
  collect: (evidenceId: string) => void;
  link: (a: string, b: string) => string | null;
  fireInterrupt: () => void;
  goToVerdict: () => void;
  submitVerdict: (v: Verdict) => void;
  submitDecision: (decisionId: string) => void;
  goToDebrief: () => void;
  nextCase: () => void;
  resetAll: () => void;
};

const currentRun = (s: GameState): CaseRun | undefined => (s.currentCaseId ? s.runs[s.currentCaseId] : undefined);
const currentCase = (s: GameState): Case | undefined => (s.currentCaseId ? caseById(s.currentCaseId) : undefined);

function updateRun(s: GameState, run: CaseRun): Partial<GameState> {
  return { runs: { ...s.runs, [run.caseId]: run } };
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      mode: 'normal',
      screen: 'intro',
      startedAt: Date.now(),
      caseOrder: CASES.map((c) => c.id),
      runs: {},
      techniqueMap: {},
      altTimelinesUnlocked: false,

      setMode: (mode, caseIds) =>
        set({ mode, caseOrder: caseIds ?? CASES.map((c) => c.id), screen: mode === 'tester' ? 'tester-code' : 'intro' }),
      setScreen: (screen) => set({ screen }),
      setTester: (code, age) => set({ tester: { code, age, forms: assignForms(code) } }),
      consent: () => set((s) => ({ tester: s.tester ? { ...s.tester, consentAt: Date.now() } : s.tester })),

      startTest: (which) =>
        set((s) => {
          const form: TestForm = s.tester ? s.tester.forms[which] : which === 'pre' ? 'A' : 'B';
          return { [which]: { form, answers: [], startedAt: Date.now() } } as Partial<GameState>;
        }),
      answerTest: (which, answer) =>
        set((s) => {
          const session = s[which];
          if (!session) return {};
          const answers = session.answers.filter((a) => a.itemId !== answer.itemId).concat(answer);
          return { [which]: { ...session, answers } } as Partial<GameState>;
        }),
      finishTest: (which) =>
        set((s) => {
          const session = s[which];
          if (!session) return {};
          return { [which]: { ...session, finishedAt: Date.now() } } as Partial<GameState>;
        }),
      setFeedback: (feedback) => set({ feedback }),

      startCase: (caseId) =>
        set((s) => {
          const c = caseById(caseId);
          if (!c) return {};
          // A6 adaptivity: hint the tool ignored in the previous completed case.
          const prevId = s.caseOrder[s.caseOrder.indexOf(caseId) - 1];
          const prev = prevId ? s.runs[prevId] : undefined;
          const prevCase = prevId ? caseById(prevId) : undefined;
          const ignored = prev && prevCase ? ignoredTools(prevCase, prev).filter((t) => c.tools.includes(t)) : [];
          const run = machine.newRun(c, Date.now(), ignored[0]);
          return { currentCaseId: caseId, screen: 'case', ...updateRun(s, run) };
        }),
      startInvestigating: () =>
        set((s) => {
          const run = currentRun(s);
          return run && run.phase === 'incoming' ? updateRun(s, machine.startInvestigating(run)) : {};
        }),
      useTool: (tool) =>
        set((s) => {
          const run = currentRun(s);
          return run ? updateRun(s, machine.useTool(run, tool)) : {};
        }),
      openLink: (linkId) =>
        set((s) => {
          const run = currentRun(s);
          return run ? updateRun(s, machine.openLink(run, linkId)) : {};
        }),
      collect: (evidenceId) =>
        set((s) => {
          const run = currentRun(s);
          const c = currentCase(s);
          if (!run || !c) return {};
          const next = machine.collectEvidence(c, run, evidenceId);
          if (next === run) return {};
          // A3: record which technique each collected evidence reveals.
          const ev = c.evidence.find((e) => e.id === evidenceId);
          const techniqueMap = { ...s.techniqueMap };
          for (const t of ev?.techniques ?? []) {
            const hits = techniqueMap[t] ?? [];
            if (!hits.some((h) => h.caseId === c.id && h.evidenceId === evidenceId)) {
              techniqueMap[t] = [...hits, { caseId: c.id, evidenceId }];
            }
          }
          return { ...updateRun(s, next), techniqueMap };
        }),
      link: (a, b) => {
        const s = get();
        const run = currentRun(s);
        const c = currentCase(s);
        if (!run || !c) return null;
        const { run: next, deductionId } = machine.linkEvidence(c, run, a, b);
        if (next !== run) set(updateRun(s, next));
        return deductionId;
      },
      fireInterrupt: () =>
        set((s) => {
          const run = currentRun(s);
          return run && !run.interruptFired ? updateRun(s, machine.fireInterrupt(run)) : {};
        }),
      goToVerdict: () =>
        set((s) => {
          const run = currentRun(s);
          return run && run.phase === 'investigating' ? updateRun(s, machine.goToVerdict(run)) : {};
        }),
      submitVerdict: (v) =>
        set((s) => {
          const run = currentRun(s);
          return run && run.phase === 'verdict' ? updateRun(s, machine.submitVerdict(run, v)) : {};
        }),
      submitDecision: (decisionId) =>
        set((s) => {
          const run = currentRun(s);
          const c = currentCase(s);
          if (!run || !c || run.phase !== 'decision') return {};
          return { ...updateRun(s, machine.submitDecision(c, run, decisionId)), altTimelinesUnlocked: true };
        }),
      goToDebrief: () =>
        set((s) => {
          const run = currentRun(s);
          return run && run.phase === 'outcome' ? updateRun(s, machine.goToDebrief(run)) : {};
        }),
      nextCase: () => {
        const s = get();
        const idx = s.caseOrder.indexOf(s.currentCaseId ?? '');
        const nextId = s.caseOrder[idx + 1];
        if (nextId) {
          get().startCase(nextId);
        } else if (s.mode === 'tester') {
          // The post-test session must exist before its screen renders.
          get().startTest('post');
          set({ screen: 'posttest', currentCaseId: undefined });
        } else if (s.mode === 'family') {
          set({ screen: 'family-card', currentCaseId: undefined });
        } else {
          set({ screen: 'summary', currentCaseId: undefined });
        }
      },
      resetAll: () =>
        set({
          mode: 'normal',
          screen: 'intro',
          startedAt: Date.now(),
          tester: undefined,
          pre: undefined,
          post: undefined,
          feedback: undefined,
          caseOrder: CASES.map((c) => c.id),
          currentCaseId: undefined,
          runs: {},
          techniqueMap: {},
          altTimelinesUnlocked: false,
        }),
    }),
    { name: 'sd-game', version: 1 },
  ),
);

/* Selectors ---------------------------------------------------------- */

export const selectCurrentCase = (s: GameState) => currentCase(s);
export const selectCurrentRun = (s: GameState) => currentRun(s);

/** Summary numbers used by the debrief and the final summary (A1, 5.5). */
export function summarize(s: GameState) {
  const completed = Object.values(s.runs).filter((r) => r.verdict && r.decisionId);
  const judgements = completed.map((r) => {
    const c = caseById(r.caseId)!;
    const res = evaluateVerdict(c, r.verdict!);
    const decision = c.decisions.find((d) => d.id === r.decisionId)!;
    return { caseId: r.caseId, confidence: r.verdict!.confidence, correct: res.correct, outcome: res.outcome, brier: res.brier, decision };
  });
  const otherChannelCount = judgements.filter((j) => j.decision.usesOtherChannel).length;
  const brier = judgements.length ? judgements.reduce((a, j) => a + j.brier, 0) / judgements.length : null;
  return { judgements, otherChannelCount, brier };
}

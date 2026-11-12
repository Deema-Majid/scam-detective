import { calibrationVerdict } from '@/engine/calibration';
import { evaluateVerdict } from '@/engine/scoring';
import { useT } from '@/i18n/useT';
import { summarize, useGame } from '@/store/gameStore';
import { allJudgements } from '@/store/judgements';
import { ALL_TECHNIQUES, TECHNIQUES } from '@/content/techniques';
import { useCaseWorld } from '../useCaseWorld';
import { FlowHeader } from './CaseFlow';
import { MirrorBar } from './DecisionScreen';
import { Button } from '@/ui/Button';
import { IconExit } from '@/ui/Icons';

/**
 * "The scammer's plan" (A3 seed): the techniques used, which evidence exposed
 * each one, the misleading-evidence reveal, the confidence mirror over all
 * judgements so far, the other-channel counter, then the next case.
 */
export function DebriefScreen() {
  const { t, lang } = useT();
  const sep = lang === 'ar' ? '، ' : ', ';
  const w = useCaseWorld();
  const state = useGame();
  const nextCase = useGame((s) => s.nextCase);
  if (!w?.run.verdict) return null;
  const { c, run } = w;
  const verdict = run.verdict;
  if (!verdict) return null;
  const isLegit = c.truth === 'legit';
  const res = evaluateVerdict(c, verdict);
  const pct = Math.round(verdict.confidence * 100);
  const judgements = allJudgements(state);
  const calib = calibrationVerdict(judgements) ?? 'ok';
  const { otherChannelCount, judgements: done } = summarize(state);
  const idx = state.caseOrder.indexOf(c.id);
  const hasNext = idx >= 0 && idx < state.caseOrder.length - 1;
  const misleading = c.evidence.filter((e) => e.misleading && run.collected.includes(e.id));
  const discovered = new Set(Object.keys(state.techniqueMap));
  /** A3: how many different cases exposed each technique (the same trick in a new form). */
  const casesPer = (tech: string) => new Set((state.techniqueMap[tech as keyof typeof state.techniqueMap] ?? []).map((h) => h.caseId)).size;
  const repeated = ALL_TECHNIQUES.filter((tech) => casesPer(tech) >= 2);
  const distractor = c.interrupt && !c.interrupt.relevant && run.interruptFired;

  const nextLabel = hasNext ? t('debrief.nextCase') : state.mode === 'tester' ? t('tester.toPost') : t('debrief.finish');

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="debrief-screen">
      <FlowHeader title={t(isLegit ? 'debrief.title.legit' : 'debrief.title')} step={t('flow.step', { n: 4, total: 4 })} />
      <div className="phone-scroll flex-1 px-4 py-4" role="region" tabIndex={0} aria-label={t('phone.scrollRegion')}>
        <p className="mb-4 rounded-2xl bg-surface-2 p-3 text-sm leading-relaxed">{t(c.planKey)}</p>

        {isLegit && (
          <p className="mb-5 rounded-2xl border border-legit/50 bg-legit-soft p-3 text-sm font-medium" data-testid="legit-note">
            {t('debrief.legit.note')}
          </p>
        )}

        {!isLegit && <h3 className="mb-2 text-sm font-bold text-accent-ink">{t('debrief.techniques')}</h3>}
        <ul className="mb-5 grid gap-2" data-testid="debrief-techniques">
          {c.techniques.map((tech) => {
            const hits = (state.techniqueMap[tech] ?? []).filter((h) => h.caseId === c.id);
            const names = hits.map((h) => c.evidence.find((e) => e.id === h.evidenceId)).filter(Boolean).map((e) => t(e!.titleKey));
            return (
              <li key={tech} className="rounded-2xl border border-border bg-surface p-3" data-technique={tech}>
                <div className="flex items-center gap-2 text-base font-bold">
                  <span aria-hidden>{TECHNIQUES[tech].icon}</span>
                  {t(TECHNIQUES[tech].nameKey)}
                </div>
                <p className="text-sm text-fg-muted">{t(TECHNIQUES[tech].descKey)}</p>
                <p className="mt-1 text-xs">{names.length ? t('debrief.revealedBy', { evidence: names.join(sep) }) : <span className="text-fg-faint">{t('debrief.notRevealed')}</span>}</p>
              </li>
            );
          })}
        </ul>

        {misleading.length > 0 && (
          <div className="mb-5 rounded-2xl border border-warn/50 bg-warn-soft p-3" data-testid="misleading-reveal">
            <div className="mb-1 text-xs font-bold text-warn">{t(isLegit ? 'debrief.misleading.legit' : 'debrief.misleading')}</div>
            {misleading.map((e) => (
              <p key={e.id} className="text-sm">
                <span className="font-semibold">{t(e.titleKey)}</span> — {t(isLegit ? 'debrief.misleading.why.legit' : 'debrief.misleading.why')}
              </p>
            ))}
          </div>
        )}

        {distractor && (
          <div className="mb-5 rounded-2xl border border-border bg-surface-2 p-3" data-testid="distractor-note">
            <div className="mb-1 text-xs font-bold text-fg-muted">{t('debrief.distractor.title')}</div>
            <p className="text-sm">{t('debrief.distractor.body')}</p>
          </div>
        )}

        <h3 className="mb-2 text-sm font-bold text-accent-ink">{t('debrief.map')}</h3>
        <ul className="mb-5 flex flex-wrap gap-2" data-testid="technique-map">
          {ALL_TECHNIQUES.map((tech) => {
            const on = discovered.has(tech);
            return (
              <li key={tech} className={`rounded-full border px-3 py-1 text-xs ${on ? 'border-accent bg-accent-soft text-accent-ink' : 'border-border text-fg-muted'}`} data-discovered={on}>
                {t(TECHNIQUES[tech].nameKey)}
                {casesPer(tech) >= 2 && <span className="ms-1 font-bold">×{casesPer(tech)}</span>}
              </li>
            );
          })}
        </ul>
        {repeated.length > 0 && (
          <p className="-mt-3 mb-5 text-xs text-accent-ink" data-testid="map-repeat">
            {t('debrief.mapRepeat')}: {repeated.map((x) => t(TECHNIQUES[x].nameKey)).join(sep)}
          </p>
        )}

        <div className="mb-4 rounded-2xl border border-accent/40 bg-accent-soft p-4" data-testid="debrief-mirror">
          <div className="text-xs font-semibold text-accent-ink">{t('mirror.title')}</div>
          <div className="mt-1 text-base font-medium">{t('verdict.mirror', { conf: pct, acc: t(res.correct ? 'verdict.mirror.correct' : 'verdict.mirror.wrong') })}</div>
          <MirrorBar value={pct} />
          <p className="mt-2 text-sm">{t(`mirror.${calib}`)}</p>
        </div>

        <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-semibold" data-testid="other-channel-counter">
          <IconExit className="h-4 w-4" />
          {t('debrief.otherChannelCount', { n: otherChannelCount, total: done.length })}
        </p>
      </div>
      <div className="shrink-0 border-t border-border p-3">
        <Button className="w-full" onClick={nextCase} data-testid="next-case">
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { evaluateVerdict } from '@/engine/scoring';
import { seededShuffle } from '@/engine/shuffle';
import { useT } from '@/i18n/useT';
import { useGame } from '@/store/gameStore';
import { useCaseWorld } from '../useCaseWorld';
import { FlowHeader } from './CaseFlow';
import { Button } from '@/ui/Button';
import { Stamp } from '@/ui/Stamp';
import { IconExit } from '@/ui/Icons';

/**
 * Two steps on one phase: first the verdict result + confidence mirror
 * (A1), then the four actions in a seeded-random order (seed = tester code or
 * 'anon' + case id, so the "best" option is not always in the same slot).
 */
export function DecisionScreen() {
  const { t } = useT();
  const w = useCaseWorld();
  const testerCode = useGame((s) => s.tester?.code);
  const submitDecision = useGame((s) => s.submitDecision);
  const [step, setStep] = useState<'result' | 'choose'>('result');
  const options = useMemo(() => (w ? seededShuffle(w.c.decisions, `${testerCode ?? 'anon'}:${w.c.id}`) : []), [w, testerCode]);
  if (!w?.run.verdict) return null;
  const { c, run } = w;
  const verdict = run.verdict!;
  const res = evaluateVerdict(c, verdict);
  const pct = Math.round(verdict.confidence * 100);

  if (step === 'result') {
    return (
      <div className="flex min-h-0 flex-1 flex-col" data-testid="verdict-result">
        <FlowHeader title={t('verdict.title')} step={t('flow.step', { n: 1, total: 4 })} />
        <div className="phone-scroll flex flex-1 flex-col items-center px-4 py-6 text-center" role="region" tabIndex={0} aria-label={t('phone.scrollRegion')}>
          <Stamp truth={verdict.truth} />
          <h3 className={`mt-6 text-lg font-bold ${res.outcome === 'wrong' ? 'text-scam' : 'text-legit'}`} data-testid={`verdict-outcome-${res.outcome}`}>
            {t(`verdict.result.${res.outcome}`)}
          </h3>
          <p className="mt-1 text-sm text-fg-muted">{t(`verdict.result.${res.outcome}.desc`)}</p>
          <div className="mt-6 w-full rounded-2xl border border-accent/40 bg-accent-soft p-4 text-start" data-testid="confidence-mirror">
            <div className="text-xs font-semibold text-accent-ink">{t('mirror.title')}</div>
            <div className="mt-1 text-base font-medium">{t('verdict.mirror', { conf: pct, acc: t(res.correct ? 'verdict.mirror.correct' : 'verdict.mirror.wrong') })}</div>
            <MirrorBar value={pct} />
          </div>
        </div>
        <div className="shrink-0 border-t border-border p-3">
          <Button className="w-full" onClick={() => setStep('choose')} data-testid="to-decision">
            {t('decision.continue')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="decision-screen">
      <FlowHeader title={t('decision.heading')} step={t('flow.step', { n: 2, total: 4 })} />
      <div className="phone-scroll flex-1 px-4 py-4" role="region" tabIndex={0} aria-label={t('phone.scrollRegion')}>
        <p className="mb-3 flex items-center gap-2 text-sm text-fg-muted">
          <span className={`inline-flex items-center rounded border px-1.5 text-xs font-bold ${verdict.truth === 'scam' ? 'border-scam text-scam' : 'border-legit text-legit'}`} style={{ transform: 'rotate(-6deg)' }} aria-hidden>
            {t(verdict.truth === 'scam' ? 'verdict.scam' : 'verdict.legit')}
          </span>
          {t('decision.context', { verdict: t(verdict.truth === 'scam' ? 'verdict.scam' : 'verdict.legit'), conf: pct })}
        </p>
        <h3 className="mb-4 text-lg font-bold">{t('decision.title')}</h3>
        <div className="grid gap-3" data-testid="decision-options">
          {options.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => submitDecision(d.id)}
              data-testid={`decision-${d.id}`}
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-start text-base font-medium hover:bg-surface-2"
            >
              {d.usesOtherChannel && <IconExit className="h-5 w-5 shrink-0 text-fg-muted" />}
              <span>{t(d.textKey)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Horizontal 50..100 bar with a marker at the confidence value (design 3.16). */
export function MirrorBar({ value }: { value: number }) {
  const left = ((value - 50) / 50) * 100;
  return (
    <div className="mt-3" aria-hidden>
      <div className="relative h-2 rounded-full bg-surface-2">
        <span className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-bg bg-accent" style={{ insetInlineStart: `calc(${left}% - 8px)` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-fg-muted">
        <bdi>50%</bdi>
        <bdi>100%</bdi>
      </div>
    </div>
  );
}

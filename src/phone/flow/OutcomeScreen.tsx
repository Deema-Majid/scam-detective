import { useState } from 'react';
import { evaluateVerdict } from '@/engine/scoring';
import { useT } from '@/i18n/useT';
import { useGame } from '@/store/gameStore';
import { useCaseWorld } from '../useCaseWorld';
import { FlowHeader } from './CaseFlow';
import { Button } from '@/ui/Button';
import { IconCheck, IconExit, IconShield, IconWarning } from '@/ui/Icons';

/** Starting balance shown in the outcome (fictional). */
export const START_BALANCE = 3000;

const RATING_TONE = {
  best: 'text-legit',
  acceptable: 'text-legit',
  risky: 'text-warn',
  harmful: 'text-scam',
} as const;

/**
 * "What happened next" inside the simulation: rating, three effect cards
 * (balance, data exposure, trust), a short timeline, then on to the debrief.
 * "What if…" (A4): unlocked once another case has been finished (or in the
 * one-case family mode); shows the consequences of the decisions not taken as
 * a vertical timeline that splits from the choice the player made.
 */
export function OutcomeScreen() {
  const { t } = useT();
  const w = useCaseWorld();
  const goToDebrief = useGame((s) => s.goToDebrief);
  const runs = useGame((s) => s.runs);
  const mode = useGame((s) => s.mode);
  const [showAlt, setShowAlt] = useState(false);
  if (!w?.run.decisionId || !w.run.verdict) return null;
  const { c, run } = w;
  const d = c.decisions.find((x) => x.id === run.decisionId)!;
  const verdict = run.verdict;
  if (!verdict) return null;
  const res = evaluateVerdict(c, verdict);
  const money = d.effects.money ?? 0;
  const balance = START_BALANCE + money;
  const fmt = (n: number) => n.toLocaleString('en-US');
  const altUnlocked = mode === 'family' || Object.values(runs).some((r) => r.caseId !== c.id && !!r.decisionId);
  const others = c.decisions.filter((x) => x.id !== d.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="outcome-screen">
      <FlowHeader title={t('outcome.title')} step={t('flow.step', { n: 3, total: 4 })} />
      <div className="phone-scroll flex-1 px-4 py-4" role="region" tabIndex={0} aria-label={t('phone.scrollRegion')}>
        <div className={`mb-4 flex items-center gap-2 text-lg font-bold ${RATING_TONE[d.rating]}`} data-testid={`outcome-rating-${d.rating}`}>
          {d.rating === 'harmful' || d.rating === 'risky' ? <IconWarning className="h-6 w-6" /> : <IconShield className="h-6 w-6" />}
          {t(`outcome.rating.${d.rating}`)}
        </div>
        {d.usesOtherChannel && (
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-ink" data-testid="other-channel-badge">
            <IconExit className="h-4 w-4" />
            {t('decision.otherChannel')}
            <IconCheck className="h-4 w-4" />
          </p>
        )}

        <div className="mb-5 grid grid-cols-3 gap-2" data-testid="effects">
          <EffectCard
            label={`${t('outcome.balance')} (${t('common.sar')})`}
            value={
              <bdi dir="ltr" className={money < 0 ? 'text-scam' : ''} data-testid="balance-flow" aria-label={`${t('outcome.balanceBefore')} ${fmt(START_BALANCE)} ${t('outcome.balanceAfter')} ${fmt(balance)}`}>
                {fmt(START_BALANCE)} → {fmt(balance)}
              </bdi>
            }
            note={`${t('outcome.balanceChange')}: ${money < 0 ? `−${fmt(-money)}` : money > 0 ? `+${fmt(money)}` : '0'} · ${money < 0 ? t('outcome.loss') : t('outcome.noLoss')}`}
          />
          <EffectCard label={t('outcome.exposure')} value={t(`outcome.exposure.${d.effects.exposure ?? 'none'}`)} tone={d.effects.exposure && d.effects.exposure !== 'none' ? 'text-scam' : ''} />
          <EffectCard label={t('outcome.trust')} value={t('verdict.mirror', { conf: Math.round(verdict.confidence * 100), acc: t(res.correct ? 'verdict.mirror.correct' : 'verdict.mirror.wrong') })} small />
        </div>

        <h3 className="mb-2 text-sm font-semibold text-fg-muted">{t('outcome.timeline')}</h3>
        <ol className="timeline grid gap-3 text-sm leading-relaxed" data-testid="outcome-timeline">
          <li>
            <span className="block text-xs text-fg-muted">{t('outcome.now')}</span>
            {t(d.textKey)}
          </li>
          <li>
            <span className="block text-xs text-fg-muted">{t('outcome.later')}</span>
            {t(d.outcomeKey)}
          </li>
        </ol>

        {showAlt && (
          <section className="mt-6" data-testid="alt-timelines" aria-label={t('outcome.altTitle')}>
            <h3 className="mb-2 text-sm font-semibold text-fg-muted">{t('outcome.altTitle')}</h3>
            <ul className="alt-split grid gap-3">
              {others.map((o) => (
                <li key={o.id} className="rounded-2xl border border-dashed border-border bg-surface p-3" data-testid={`alt-${o.id}`}>
                  <div className={`mb-1 text-xs font-bold ${RATING_TONE[o.rating]}`}>{t(`outcome.rating.${o.rating}`)}</div>
                  <p className="text-sm font-medium">{t(o.textKey)}</p>
                  <p className="mt-1 text-sm text-fg-muted">{t(o.altTimelineKey)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <div className="grid shrink-0 gap-2 border-t border-border p-3">
        <Button variant="secondary" disabled={!altUnlocked} aria-expanded={showAlt} title={altUnlocked ? undefined : t('outcome.whatIfSoon')} onClick={() => setShowAlt((v) => !v)} data-testid="what-if">
          {t('outcome.whatIf')}
          {!altUnlocked && <span className="text-xs text-fg-muted"> · {t('outcome.whatIfSoon')}</span>}
        </Button>
        <Button onClick={goToDebrief} data-testid="to-debrief">
          {t(c.truth === 'legit' ? 'outcome.continue.legit' : 'outcome.continue')}
        </Button>
      </div>
    </div>
  );
}

function EffectCard({ label, value, note, tone = '', small = false }: { label: string; value: React.ReactNode; note?: string; tone?: string; small?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-2 text-center">
      <div className="text-[11px] text-fg-muted">{label}</div>
      <div className={`${small ? 'text-xs' : 'text-sm'} font-bold leading-snug ${tone}`}>{value}</div>
      {note && <div className="text-[11px] text-fg-faint">{note}</div>}
    </div>
  );
}

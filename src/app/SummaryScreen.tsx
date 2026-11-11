import { useT } from '@/i18n/useT';
import { summarize, useGame } from '@/store/gameStore';
import { useSettings } from '@/store/settingsStore';
import { allJudgements } from '@/store/judgements';
import { buildResults, resultsFileName } from '@/store/exportResults';
import { caseById } from '@/content/cases';
import { Button } from '@/ui/Button';
import { useLenis } from '@/ui/useLenis';
import { CalibrationChart } from './CalibrationChart';
import { IconExit } from '@/ui/Icons';

/** Final summary outside the phone: cases table, other-channel counter, Brier, calibration chart. */
export function SummaryScreen() {
  useLenis();
  const { t } = useT();
  const state = useGame();
  const resetAll = useGame((s) => s.resetAll);
  const lang = useSettings((s) => s.lang);
  const gender = useSettings((s) => s.gender);
  const { judgements, otherChannelCount, brier } = summarize(state);
  const all = allJudgements(state);

  const download = () => {
    const results = buildResults(state, { lang, gender });
    downloadJson(JSON.stringify(results, null, 2), resultsFileName(results));
  };

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-10" data-testid="summary-screen">
      <h1 className="text-3xl font-bold">{t('summary.title')}</h1>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-lg font-bold">{t('summary.cases')}</h2>
        <div className="max-w-full overflow-x-auto" tabIndex={0} role="region" aria-label={t('summary.cases')}>
        <table className="w-full min-w-[320px] text-sm" data-testid="summary-table">
          <thead>
            <tr className="text-start text-fg-muted">
              <th className="py-1 text-start">{t('summary.col.case')}</th>
              <th className="py-1 text-start">{t('summary.col.verdict')}</th>
              <th className="py-1 text-start">{t('summary.col.confidence')}</th>
              <th className="py-1 text-start">{t('summary.col.decision')}</th>
            </tr>
          </thead>
          <tbody>
            {judgements.map((j) => (
              <tr key={j.caseId} className="border-t border-border">
                <td className="py-2">{t(caseById(j.caseId)!.titleKey)}</td>
                <td className="py-2">{t(`verdict.result.${j.outcome}`)}</td>
                <td className="py-2">
                  <bdi>{Math.round(j.confidence * 100)}%</bdi>
                </td>
                <td className="py-2">
                  {t(`decision.rating.${j.decision.rating}`)}
                  {j.decision.usesOtherChannel && <span className="ms-1 text-accent-ink">✓</span>}
                </td>
              </tr>
            ))}
            {judgements.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-center text-fg-muted">
                  {t('summary.noCases')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl bg-accent-soft p-4 text-accent-ink" data-testid="summary-other-channel">
          <IconExit className="h-6 w-6" />
          <span className="text-base font-semibold">{t('debrief.otherChannelCount', { n: otherChannelCount, total: judgements.length })}</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4" data-testid="summary-brier">
          <div className="text-xs text-fg-muted">{t('summary.brierLabel')}</div>
          <div className="text-2xl font-bold">
            <bdi>{brier === null ? '—' : brier.toFixed(2)}</bdi>
          </div>
          <div className="text-xs text-fg-faint">{t('summary.brierNote')}</div>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-1 text-lg font-bold">{t('mirror.title')}</h2>
        <p className="mb-3 text-sm text-fg-muted">{t('calib.intro', { n: all.length })}</p>
        <CalibrationChart judgements={all} />
      </section>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={download} data-testid="summary-download">
          {t('common.download')}
        </Button>
        <Button variant="ghost" onClick={resetAll} data-testid="summary-reset">
          {t('summary.replay')}
        </Button>
      </div>
      <p className="text-xs text-fg-faint">{t('app.footer')}</p>
    </main>
  );
}

/** Saves text as a file. The anchor is created here, never rendered in JSX (no href in markup). */
export function downloadJson(text: string, name: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', name);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

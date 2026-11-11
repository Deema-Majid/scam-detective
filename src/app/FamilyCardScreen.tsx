import { useT } from '@/i18n/useT';
import { useGame } from '@/store/gameStore';
import { CASES } from '@/content/cases';
import { Button } from '@/ui/Button';
import { useLenis } from '@/ui/useLenis';
import { IconExit } from '@/ui/Icons';

/**
 * A5 family card: a printable page with three questions to ask before
 * believing a message and the one habit the game teaches ("the other channel").
 * Opened from the intro, from the summary, or at the end of family mode
 * (?mode=family&case=case1). It needs no server: the link only selects a case.
 */
export function FamilyCardScreen() {
  const { t } = useT();
  useLenis();
  const mode = useGame((s) => s.mode);
  const caseOrder = useGame((s) => s.caseOrder);
  const setScreen = useGame((s) => s.setScreen);
  const exitFamily = useGame((s) => s.exitFamily);
  const cases = mode === 'family' ? CASES.filter((c) => caseOrder.includes(c.id)) : CASES;

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-8" data-testid="family-card">
      <article className="family-card rounded-3xl border-2 border-border bg-surface p-6" aria-labelledby="family-title">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-ink">{t('app.name')}</p>
        <h1 id="family-title" className="mt-1 text-3xl font-bold text-balance">
          {t('family.title')}
        </h1>
        <p className="mt-2 text-fg-muted">{t('family.subtitle')}</p>

        <h2 className="mt-6 text-lg font-bold">{t('family.general.title')}</h2>
        <ol className="mt-2 grid gap-2 ps-5 [list-style:decimal]" data-testid="family-general">
          {[1, 2, 3].map((n) => (
            <li key={n}>{t(`family.general.q${n}`)}</li>
          ))}
        </ol>

        <div className="mt-6 rounded-2xl border border-accent/50 bg-accent-soft p-4" data-testid="family-habit">
          <h2 className="flex items-center gap-2 text-lg font-bold text-accent-ink">
            <IconExit className="h-5 w-5" />
            {t('family.habit.title')}
          </h2>
          <p className="mt-1 text-sm">{t('family.habit.body')}</p>
        </div>

        {cases.map((c) => (
          <section key={c.id} className="mt-6" data-testid={`family-${c.id}`}>
            <h2 className="text-base font-bold">{t(c.titleKey)}</h2>
            <ul className="mt-1 grid gap-1 ps-5 text-sm [list-style:disc]">
              {c.familyQuestionKeys.map((k) => (
                <li key={k}>{t(k)}</li>
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-6 text-xs text-fg-muted">{t('family.footer')}</p>
      </article>

      <div className="no-print flex flex-wrap gap-3">
        <Button onClick={() => window.print()} data-testid="family-print">
          {t('family.print')}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (mode === 'family') exitFamily();
            else setScreen('intro');
          }}
          data-testid="family-back"
        >
          {t('common.back')}
        </Button>
      </div>
    </main>
  );
}

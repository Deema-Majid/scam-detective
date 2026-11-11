import { useT } from '@/i18n/useT';
import { useGame } from '@/store/gameStore';
import { useSettings } from '@/store/settingsStore';
import { CASES } from '@/content/cases';
import { Button } from '@/ui/Button';
import { GenderPicker } from '@/ui/GenderPicker';
import { AmbientBackground } from '@/ui/AmbientBackground';

/** Opening page outside the phone. Phase 4 adds the animated background and Lenis. */
export function IntroScreen() {
  const { t } = useT();
  const startCase = useGame((s) => s.startCase);
  const setScreen = useGame((s) => s.setScreen);
  const runs = useGame((s) => s.runs);
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  const allDone = CASES.every((c) => runs[c.id]?.phase === 'debrief');

  return (
    <>
    <AmbientBackground />
    <main id="main" className="relative mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      {/* The only control outside the phone: theme and the rest live in the in-phone Settings app. */}
      <button
        type="button"
        className="no-print absolute end-3 top-3 rounded-full border border-border bg-bg-elev px-3 py-1.5 text-xs text-fg-muted hover:text-fg"
        onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        data-testid="lang-toggle"
      >
        {t('app.lang.toggle')}
      </button>
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent-ink">Technovation 2026–2027</p>
        <h1 className="text-4xl font-bold leading-tight text-balance sm:text-5xl">{t('app.name')}</h1>
        <p className="mt-3 text-lg text-fg-muted">{t('app.tagline')}</p>
      </div>
      <ul className="grid w-full gap-2 text-start text-sm text-fg-muted sm:grid-cols-3">
        {(['tools', 'link', 'decide'] as const).map((k) => (
          <li key={k} className="rounded-2xl border border-border bg-surface px-4 py-3">
            {t(`app.intro.${k}`)}
          </li>
        ))}
      </ul>
      <div className="grid w-full gap-3">
        {CASES.map((c, i) => {
          const run = runs[c.id];
          const done = run?.phase === 'debrief';
          return (
            <button
              key={c.id}
              type="button"
              data-testid={`start-${c.id}`}
              onClick={() => startCase(c.id)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-start hover:bg-surface-2"
            >
              <span>
                <span className="block text-xs text-fg-muted">
                  <bdi>{i + 1}</bdi>
                </span>
                <span className="block text-lg font-semibold">{t(c.titleKey)}</span>
              </span>
              <span className={`text-xs ${done ? 'text-legit' : 'text-fg-faint'}`}>{done ? '✓' : ''}</span>
            </button>
          );
        })}
      </div>
      <GenderPicker />
      <Button size="lg" onClick={() => startCase(CASES[0].id)} data-testid="start-game">
        {t('app.start')}
      </Button>
      {allDone && (
        <Button variant="secondary" onClick={() => setScreen('summary')} data-testid="open-summary">
          {t('debrief.finish')}
        </Button>
      )}
      <Button variant="ghost" onClick={() => setScreen('family-card')} data-testid="open-family-card">
        {t('family.open')}
      </Button>
      <p className="text-xs text-fg-faint">{t('app.simNote')}</p>
      <p className="text-xs text-fg-faint">{t('app.footer')}</p>
    </main>
    </>
  );
}

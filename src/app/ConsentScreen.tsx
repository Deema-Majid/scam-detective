import { useState } from 'react';
import { useT } from '@/i18n/useT';
import { useGame } from '@/store/gameStore';
import { Button } from '@/ui/Button';

const SECTIONS = ['what', 'data', 'ask', 'rights'] as const;

/** T2: consent (text mirrors docs/tester-kit/consent-ar.md), guardian box under 16. */
export function ConsentScreen() {
  const { t } = useT();
  const tester = useGame((s) => s.tester);
  const consent = useGame((s) => s.consent);
  const startTest = useGame((s) => s.startTest);
  const setScreen = useGame((s) => s.setScreen);
  const [agree, setAgree] = useState(false);
  const [guardian, setGuardian] = useState(false);
  const needsGuardian = tester?.age === '13-15';
  const ok = agree && (!needsGuardian || guardian);

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4 py-10" data-testid="consent-screen">
      <h1 className="text-2xl font-bold">{t('consent.title')}</h1>
      <div className="grid gap-3 text-sm leading-relaxed">
        {SECTIONS.map((k) => (
          <section key={k} className="rounded-2xl border border-border bg-surface p-3">
            <h2 className="mb-1 font-bold">{t(`consent.${k}.title`)}</h2>
            <p>{t(`consent.${k}.body`)}</p>
          </section>
        ))}
      </div>
      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--accent)]" data-testid="consent-agree" />
        {t('consent.agree')}
      </label>
      {needsGuardian && (
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input type="checkbox" checked={guardian} onChange={(e) => setGuardian(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--accent)]" data-testid="consent-guardian" />
          {t('consent.guardian')}
        </label>
      )}
      <Button
        size="lg"
        disabled={!ok}
        onClick={() => {
          consent();
          startTest('pre');
          setScreen('pretest');
        }}
        data-testid="consent-start"
      >
        {t('consent.start')}
      </Button>
      <p className="text-xs text-fg-faint">{t('consent.note')}</p>
    </main>
  );
}

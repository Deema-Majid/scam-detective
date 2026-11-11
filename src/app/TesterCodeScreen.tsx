import { useState } from 'react';
import { isValidTesterCode, normalizeTesterCode } from '@/engine/abAssign';
import { useT } from '@/i18n/useT';
import { useGame, type AgeBand } from '@/store/gameStore';
import { Button } from '@/ui/Button';
import { GenderPicker } from '@/ui/GenderPicker';

const AGES: AgeBand[] = ['13-15', '16-18', '19+'];

/** T1: anonymous tester code (T-NNNN) + optional age band (design 3.19). */
export function TesterCodeScreen() {
  const { t } = useT();
  const setTester = useGame((s) => s.setTester);
  const setScreen = useGame((s) => s.setScreen);
  const [code, setCode] = useState('');
  const [age, setAge] = useState<AgeBand | undefined>();
  const valid = isValidTesterCode(code);

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10" data-testid="tester-code-screen">
      <div>
        <p className="text-sm font-semibold text-accent-ink">{t('tester.mode')}</p>
        <h1 className="text-2xl font-bold">{t('tester.code.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('tester.code.hint')}</p>
      </div>
      <label className="grid gap-2">
        <span className="text-sm font-medium">{t('tester.code.label')}</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onBlur={() => setCode(normalizeTesterCode(code))}
          inputMode="numeric"
          dir="ltr"
          placeholder="T-0427"
          autoComplete="off"
          className="min-h-14 rounded-2xl border border-border bg-surface px-4 text-center text-2xl font-bold tracking-widest text-fg"
          data-testid="tester-code-input"
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t('tester.age.label')}</legend>
        <div className="flex flex-wrap gap-2" data-testid="tester-age">
          {AGES.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={age === a}
              onClick={() => setAge(a)}
              data-testid={`age-${a}`}
              className={`min-h-11 rounded-full border px-4 text-sm ${age === a ? 'border-accent bg-accent-soft text-accent-ink' : 'border-border bg-surface'}`}
            >
              <bdi>{a}</bdi>
            </button>
          ))}
          <button
            type="button"
            aria-pressed={age === undefined}
            onClick={() => setAge(undefined)}
            data-testid="age-none"
            className={`min-h-11 rounded-full border px-4 text-sm ${age === undefined ? 'border-accent bg-accent-soft text-accent-ink' : 'border-border bg-surface'}`}
          >
            {t('tester.age.none')}
          </button>
        </div>
      </fieldset>
      <Button
        size="lg"
        disabled={!valid}
        onClick={() => {
          setTester(normalizeTesterCode(code), age);
          setScreen('consent');
        }}
        data-testid="tester-code-next"
      >
        {t('common.next')}
      </Button>
      <GenderPicker />
      <p className="text-xs text-fg-faint">{t('tester.code.privacy')}</p>
    </main>
  );
}

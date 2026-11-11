import { useState } from 'react';
import { useT } from '@/i18n/useT';
import { useGame } from '@/store/gameStore';
import { Button } from '@/ui/Button';

const OPEN = ['helped', 'confusing', 'changed'] as const;
const LIKERT = ['easy', 'tools', 'natural', 'realistic', 'recommend'] as const;
const MAX = 500;

/** T6: 3 short open questions + 5 Likert items (design 3.20). The only free text the game stores. */
export function FeedbackScreen() {
  const { t } = useT();
  const setFeedback = useGame((s) => s.setFeedback);
  const setScreen = useGame((s) => s.setScreen);
  const [open, setOpen] = useState<string[]>(['', '', '']);
  const [likert, setLikert] = useState<(number | null)[]>([null, null, null, null, null]);
  const ready = likert.every((v) => v !== null);

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4 py-8" data-testid="feedback-screen">
      <h1 className="text-2xl font-bold">{t('feedback.title')}</h1>
      <p className="text-sm text-fg-muted">{t('feedback.note')}</p>
      <p className="rounded-2xl border border-warn bg-warn-soft px-3 py-2 text-sm font-semibold text-fg" role="note" data-testid="feedback-privacy-warning">
        {t('feedback.privacyWarn')}
      </p>

      {OPEN.map((k, i) => (
        <label key={k} className="grid gap-1 text-sm">
          <span className="font-medium">{t(`feedback.open.${k}`)}</span>
          <textarea
            rows={3}
            maxLength={MAX}
            value={open[i]}
            onChange={(e) => setOpen(open.map((v, j) => (j === i ? e.target.value : v)))}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-base text-fg"
            data-testid={`feedback-open-${i}`}
          />
          <span className="text-end text-xs text-fg-faint">
            <bdi>
              {open[i].length}/{MAX}
            </bdi>
          </span>
        </label>
      ))}

      <div className="grid gap-4">
        {LIKERT.map((k, i) => (
          <fieldset key={k} className="rounded-2xl border border-border bg-surface p-3">
            <legend className="px-1 text-sm font-medium">{t(`feedback.likert.${k}`)}</legend>
            <div className="mt-1 flex justify-between text-[11px] text-fg-muted">
              <span>{t('feedback.likert.min')}</span>
              <span>{t('feedback.likert.max')}</span>
            </div>
            <div className="mt-1 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={likert[i] === v}
                  onClick={() => setLikert(likert.map((x, j) => (j === i ? v : x)))}
                  data-testid={`feedback-likert-${i}-${v}`}
                  className={`h-11 w-full min-w-0 rounded-full border text-sm font-semibold ${likert[i] === v ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface-2'}`}
                >
                  <bdi>{v}</bdi>
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="sticky bottom-0 bg-bg py-3">
        <Button
          size="lg"
          className="w-full"
          disabled={!ready}
          onClick={() => {
            setFeedback({ open: open.map((s) => s.trim()), likert: likert.map((v) => v ?? 0) });
            setScreen('results-code');
          }}
          data-testid="feedback-submit"
        >
          {t('feedback.submit')}
        </Button>
      </div>
    </main>
  );
}

import { useT } from '@/i18n/useT';

/**
 * Confidence mirror input (A1, design 3.11): 50..100 in steps of 5. The parent
 * tracks whether the thumb was moved at least once (the default 75 must not be
 * accepted silently, or the measurement is meaningless).
 */
export function ConfidenceSlider({ value, onChange, testid = 'confidence' }: { value: number; onChange: (v: number) => void; testid?: string }) {
  const { t } = useT();
  const fill = ((value - 50) / 50) * 100;
  return (
    <div data-testid={`${testid}-block`}>
      <div className="mb-1 flex items-baseline justify-between">
        <label htmlFor={testid} className="text-base font-semibold">
          {t('verdict.confidence')}
        </label>
        <span className="text-2xl font-bold text-accent-ink" aria-hidden>
          <bdi>{value}%</bdi>
        </span>
      </div>
      <input
        id={testid}
        type="range"
        min={50}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        dir="ltr"
        className="confidence-slider"
        style={{ ['--fill' as string]: `${fill}%` }}
        aria-valuetext={t('verdict.confidenceText', { n: value })}
        data-testid={testid}
      />
      {/* The track is always left-to-right (right = more confident), in Arabic too. */}
      <div className="flex justify-between text-xs text-fg-muted" dir="ltr">
        <span dir="auto">{t('verdict.confidence.min')}</span>
        <span dir="auto">{t('verdict.confidence.max')}</span>
      </div>
    </div>
  );
}

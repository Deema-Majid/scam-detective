import { useT } from '@/i18n/useT';
import { useSettings } from '@/store/settingsStore';

/**
 * "I am: girl / boy" selector shown before the game starts (intro and tester
 * code screens) so the Arabic text addresses the player correctly. The same
 * choice lives in the in-phone Settings app. Hidden in English, where the
 * game text has no gendered forms.
 */
export function GenderPicker() {
  const { t } = useT();
  const lang = useSettings((s) => s.lang);
  const gender = useSettings((s) => s.gender);
  const setGender = useSettings((s) => s.setGender);
  if (lang !== 'ar') return null;
  return (
    <div role="radiogroup" aria-label={t('gender.label')} className="inline-flex items-center gap-2" data-testid="gender-picker">
      <span className="text-sm text-fg-muted">{t('gender.label')}</span>
      {(['f', 'm'] as const).map((g) => (
        <button
          key={g}
          type="button"
          role="radio"
          aria-checked={gender === g}
          data-testid={`gender-${g}`}
          onClick={() => setGender(g)}
          className={`min-h-11 rounded-full border px-5 text-sm font-semibold transition ${
            gender === g ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface text-fg'
          }`}
        >
          {t(`gender.${g}`)}
        </button>
      ))}
    </div>
  );
}

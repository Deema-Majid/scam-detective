import { useCallback } from 'react';
import { useSettings } from '@/store/settingsStore';
import { translate } from './index';

/** React hook: t('key', { n: 3 }) with the current language and gender. */
export function useT() {
  const lang = useSettings((s) => s.lang);
  const gender = useSettings((s) => s.gender);
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, gender, key, vars),
    [lang, gender],
  );
  return { t, lang, gender };
}

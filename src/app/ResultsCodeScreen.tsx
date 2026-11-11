import { useEffect, useRef, useState } from 'react';
import { useT } from '@/i18n/useT';
import { useGame } from '@/store/gameStore';
import { useSettings } from '@/store/settingsStore';
import { buildResults, encodeResults, resultsFileName, type Results } from '@/store/exportResults';
import { Button } from '@/ui/Button';
import { downloadJson } from './SummaryScreen';

/** T7: the results code. Copy (clipboard with select-text fallback) or download the raw JSON. */
export function ResultsCodeScreen() {
  const { t } = useT();
  const state = useGame();
  const setScreen = useGame((s) => s.setScreen);
  const lang = useSettings((s) => s.lang);
  const gender = useSettings((s) => s.gender);
  const [results, setResults] = useState<Results | null>(null);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const r = buildResults(state, { lang, gender });
    setResults(r);
    let live = true;
    encodeResults(r).then((c) => live && setCode(c));
    return () => {
      live = false;
    };
    // Build once on mount: the session is over at this point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      areaRef.current?.focus();
      areaRef.current?.select();
      try {
        document.execCommand('copy');
      } catch {
        /* the text stays selected for a manual copy */
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4 py-10" data-testid="results-code-screen">
      <h1 className="text-2xl font-bold">{t('results.title')}</h1>
      <p className="text-sm text-fg-muted">{t('results.note')}</p>
      <textarea
        ref={areaRef}
        readOnly
        value={code}
        dir="ltr"
        rows={6}
        className="max-h-40 w-full rounded-2xl border border-border bg-surface-2 p-3 font-mono text-xs text-fg"
        style={{ overflowWrap: 'anywhere' }}
        aria-label={t('results.codeLabel')}
        data-testid="results-code"
      />
      <div className="grid gap-2">
        <Button size="lg" onClick={copy} disabled={!code} data-testid="results-copy">
          {copied ? t('common.copied') : t('results.copy')}
        </Button>
        <Button variant="secondary" onClick={() => results && downloadJson(JSON.stringify(results, null, 2), resultsFileName(results))} disabled={!results} data-testid="results-download">
          {t('common.download')}
        </Button>
      </div>
      <div className="sr-only" aria-live="polite">
        {copied ? t('common.copied') : ''}
      </div>
      <p className="text-sm">{t('results.send')}</p>
      <button type="button" className="text-sm text-accent-ink underline" onClick={() => setScreen('summary')} data-testid="results-to-summary">
        {t('results.viewSummary')}
      </button>
    </main>
  );
}

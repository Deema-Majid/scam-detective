import { useMemo, useState } from 'react';
import type { Truth } from '@/engine/types';
import { seededShuffle } from '@/engine/shuffle';
import { itemsForForm } from '@/content/test-bank';
import { useT } from '@/i18n/useT';
import { useGame } from '@/store/gameStore';
import { Button } from '@/ui/Button';
import { ConfidenceSlider } from '@/ui/ConfidenceSlider';
import { IconShield, IconWarning } from '@/ui/Icons';

/**
 * T3 / T5: six items, one screen each, no tools and no feedback (design 3.18).
 * Per item: verdict, confidence (must be moved), "first thing you'd do" in a
 * seeded-stable order (tester code + item id).
 */
export function TestScreen({ which }: { which: 'pre' | 'post' }) {
  const { t } = useT();
  const session = useGame((s) => s[which]);
  const tester = useGame((s) => s.tester);
  const caseOrder = useGame((s) => s.caseOrder);
  const answerTest = useGame((s) => s.answerTest);
  const finishTest = useGame((s) => s.finishTest);
  const startCase = useGame((s) => s.startCase);
  const setScreen = useGame((s) => s.setScreen);
  const items = useMemo(() => (session ? itemsForForm(session.form) : []), [session]);
  const [idx, setIdx] = useState(() => Math.min(session?.answers.length ?? 0, Math.max(0, items.length - 1)));
  const [verdict, setVerdict] = useState<Truth | null>(null);
  const [confidence, setConfidence] = useState(75);
  const [moved, setMoved] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  if (!session || items.length === 0) return null;
  const item = items[idx];
  const seed = `${tester?.code ?? 'anon'}:${item.id}`;
  const actions = seededShuffle(item.firstActions, seed);
  const ready = !!verdict && moved && !!action;

  const next = () => {
    if (!verdict || !action) return;
    answerTest(which, { itemId: item.id, verdict, confidence: confidence / 100, firstActionId: action });
    setVerdict(null);
    setConfidence(75);
    setMoved(false);
    setAction(null);
    if (idx + 1 < items.length) {
      setIdx(idx + 1);
      return;
    }
    finishTest(which);
    if (which === 'pre') startCase(caseOrder[0]);
    else setScreen('feedback');
  };

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-4 py-8" data-testid={`${which}test-screen`}>
      <header>
        <div className="flex items-baseline justify-between">
          <h1 className="text-lg font-bold">{t(which === 'pre' ? 'test.pre.title' : 'test.post.title')}</h1>
          <span className="text-sm text-fg-muted" data-testid="test-progress">
            {t('test.progress', { n: idx + 1, total: items.length })}
          </span>
        </div>
        <div className="mt-2 h-1 w-full rounded-full bg-border" aria-hidden>
          <div className="h-1 rounded-full bg-accent" style={{ width: `${((idx + 1) / items.length) * 100}%` }} />
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-surface p-3" data-testid={`test-item-${item.id}`}>
        <div className="mb-2 text-xs text-fg-muted">
          {t(item.savedContact ? 'test.fromSaved' : 'test.from')}: <bdi>{t(item.senderKey)}</bdi>
        </div>
        <div className="max-w-[92%] rounded-2xl rounded-es-sm bg-surface-2 px-3 py-2 text-base leading-relaxed">{t(item.textKey)}</div>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">{t('test.q.verdict')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {(['scam', 'legit'] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={verdict === k}
              onClick={() => setVerdict(k)}
              data-testid={`test-verdict-${k}`}
              className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-2xl border-2 text-base font-bold ${
                verdict === k ? (k === 'scam' ? 'border-scam bg-scam-soft text-scam' : 'border-legit bg-legit-soft text-legit') : 'border-border bg-surface'
              }`}
            >
              {k === 'scam' ? <IconWarning /> : <IconShield />}
              {t(`verdict.${k}`)}
            </button>
          ))}
        </div>
      </section>

      <ConfidenceSlider
        value={confidence}
        onChange={(v) => {
          setConfidence(v);
          setMoved(true);
        }}
        testid="test-confidence"
      />

      <section>
        <h2 className="mb-2 text-base font-semibold">{t('test.q.firstAction')}</h2>
        <div className="grid gap-2" data-testid="test-actions">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={action === a.id}
              onClick={() => setAction(a.id)}
              data-testid={`test-action-${a.id}`}
              className={`min-h-14 rounded-2xl border px-4 py-3 text-start text-base ${action === a.id ? 'border-accent bg-accent-soft text-accent-ink' : 'border-border bg-surface'}`}
            >
              {t(a.textKey)}
            </button>
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 bg-bg py-3">
        <Button size="lg" className="w-full" disabled={!ready} onClick={next} data-testid="test-next">
          {idx + 1 < items.length ? t('common.next') : t(which === 'pre' ? 'test.startCases' : 'test.finish')}
        </Button>
      </div>
    </main>
  );
}

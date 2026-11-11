import { useT } from '@/i18n/useT';
import { selectCurrentCase, selectCurrentRun, useGame } from '@/store/gameStore';
import { usePhone } from '@/store/phoneStore';

/**
 * Renders an "add to notebook" button for each evidence id attached to a
 * surface (sender sheet, link inspector, order details, site block, call...).
 * The chip is the only way evidence enters the notebook, so every surface in
 * the world data can offer evidence with one line: <EvidenceChip ids={[...]} />
 */
export function EvidenceChip({ ids, compact = false }: { ids?: string[]; compact?: boolean }) {
  const { t } = useT();
  const c = useGame(selectCurrentCase);
  const run = useGame(selectCurrentRun);
  const collect = useGame((s) => s.collect);
  const setFlying = usePhone((s) => s.setFlying);
  if (!ids?.length || !c || !run) return null;

  return (
    <div className="flex flex-col gap-2" data-testid="evidence-chips">
      {ids.map((id) => {
        const ev = c.evidence.find((e) => e.id === id);
        if (!ev) return null;
        const collected = run.collected.includes(id);
        const disabled = collected || run.phase !== 'investigating';
        return (
          <div
            key={id}
            className={`rounded-2xl border px-3 py-2 ${collected ? 'border-accent/40 bg-accent/10' : 'border-border bg-surface-2'}`}
            data-evidence-id={id}
          >
            {!compact && (
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-fg">{t(ev.titleKey)}</span>
                <span className="text-xs text-fg-faint">{t(`evidence.strength.${ev.strength}`)}</span>
              </div>
            )}
            {!compact && <p className="mb-2 text-sm leading-snug text-fg-muted">{t(ev.bodyKey)}</p>}
            <button
              type="button"
              data-testid={`collect-${id}`}
              disabled={disabled}
              onClick={() => {
                collect(id);
                setFlying(id);
              }}
              className={`min-h-[36px] w-full rounded-xl px-3 text-sm font-semibold transition ${
                collected ? 'bg-accent/20 text-accent' : 'bg-accent text-accent-fg hover:brightness-110'
              } disabled:cursor-default`}
              aria-pressed={collected}
            >
              {collected ? t('evidence.added') : t('evidence.add')}
            </button>
          </div>
        );
      })}
    </div>
  );
}

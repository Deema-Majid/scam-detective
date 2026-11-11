import type { ReactNode } from 'react';
import { useT } from '@/i18n/useT';

/** Shared top bar inside phone apps: back button + title + optional trailing slot. */
export function AppHeader({ title, onBack, trailing }: { title: ReactNode; onBack: () => void; trailing?: ReactNode }) {
  const { t } = useT();
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2">
      <button
        type="button"
        onClick={onBack}
        aria-label={t('common.back')}
        data-testid="back"
        className="flex h-11 w-11 items-center justify-center rounded-full text-accent hover:bg-surface-2"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <div className="min-w-0 flex-1 truncate text-base font-semibold">{title}</div>
      {trailing}
    </div>
  );
}

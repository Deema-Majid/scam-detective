import type { ToolId } from '@/engine/types';
import { useT } from '@/i18n/useT';
import { usePhone, type AppId } from '@/store/phoneStore';
import { useCaseWorld } from './useCaseWorld';
import { IconNotebook } from '@/ui/Icons';

type AppDef = { id: AppId; labelKey: string; tone: string; needs?: ToolId[]; icon: JSX.Element };

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/* Icon tones are neutral "phone system" colours, deliberately not the accent (design §4). */
const APPS: AppDef[] = [
  {
    id: 'messages',
    labelKey: 'phone.app.messages',
    tone: 'bg-[#3b8f5c]',
    needs: ['sender', 'link'],
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M4 5h16v11H9l-5 4z" />
      </svg>
    ),
  },
  {
    id: 'orders',
    labelKey: 'phone.app.orders',
    tone: 'bg-[#b8742b]',
    needs: ['orders'],
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M3 8l9-4 9 4-9 4z" />
        <path d="M3 8v8l9 4 9-4V8" />
        <path d="M12 12v8" />
      </svg>
    ),
  },
  {
    id: 'browser',
    labelKey: 'phone.app.browser',
    tone: 'bg-[#2e6fcf]',
    needs: ['site'],
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
      </svg>
    ),
  },
  {
    id: 'dialer',
    labelKey: 'phone.app.dialer',
    tone: 'bg-[#2f9e7a]',
    needs: ['call'],
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M6 3h4l2 5-3 2a10 10 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 014 5a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    id: 'chats',
    labelKey: 'phone.app.chats',
    tone: 'bg-[#6b5bd6]',
    needs: ['chats'],
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <path d="M3 6h12v8H8l-5 3z" />
        <path d="M15 9h6v8l-4-2h-5v-2" />
      </svg>
    ),
  },
  {
    id: 'settings',
    labelKey: 'phone.app.settings',
    tone: 'bg-[#6b6b73]',
    icon: (
      <svg viewBox="0 0 24 24" {...stroke}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
        <circle cx="12" cy="12" r="7" />
      </svg>
    ),
  },
];

export function HomeScreen() {
  const { t } = useT();
  const w = useCaseWorld();
  const openApp = usePhone((s) => s.openApp);
  const tools = new Set(w?.c.tools ?? []);
  const collected = w?.run.collected.length ?? 0;
  const deductions = w?.run.deductions.length ?? 0;
  const unread = w ? 1 + (w.run.interruptFired ? 1 : 0) : 0;

  return (
    <div className="wallpaper flex flex-1 flex-col justify-between px-5 pb-6 pt-3" data-testid="home-screen">
      <div>
        {w && (
          <p className="mb-4 inline-block rounded-full bg-fg/8 px-3 py-1 text-xs font-medium text-fg-muted" data-testid="home-case-pill">
            {t('phone.home.casePill', { title: t(w.c.titleKey) })}
          </p>
        )}
        <div className="grid grid-cols-3 gap-x-4 gap-y-6">
          {APPS.map((app) => {
            const enabled = !app.needs || app.needs.some((n) => tools.has(n));
            return (
              <button
                key={app.id}
                type="button"
                data-testid={`app-${app.id}`}
                disabled={!enabled}
                onClick={() => openApp(app.id)}
                className="group flex flex-col items-center gap-1.5 text-xs font-medium text-fg disabled:opacity-40"
                aria-label={enabled ? undefined : `${t(app.labelKey)} (${t('phone.app.locked')})`}
              >
                <span className={`app-icon relative flex h-16 w-16 items-center justify-center rounded-[18px] text-white transition group-active:scale-95 ${app.tone}`}>
                  <span className="h-8 w-8">{app.icon}</span>
                  {app.id === 'messages' && unread > 0 && (
                    <span className="absolute -end-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-fg shadow">
                      <bdi>{unread}</bdi>
                    </span>
                  )}
                </span>
                <span>{t(app.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dock: the notebook is always pinned, wide, in the investigation colour. */}
      <div className="mx-auto w-full rounded-[28px] bg-fg/8 p-2 backdrop-blur">
        <button
          type="button"
          data-testid="app-notebook"
          title={t('phone.home.dockCount', { n: collected, d: deductions })}
          onClick={() => openApp('notebook')}
          className="flex min-h-14 w-full items-center gap-3 rounded-[22px] border border-accent bg-accent-soft px-4 py-2 text-accent-ink shadow-md active:scale-[0.98]"
        >
          <IconNotebook className="h-7 w-7" />
          <span className="flex-1 text-start text-base font-bold">{t('phone.app.notebook')}</span>
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-fg">{t('phone.home.dockCount', { n: collected, d: deductions })}</span>
        </button>
      </div>
    </div>
  );
}

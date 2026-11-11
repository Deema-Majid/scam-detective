import { useEffect, useState } from 'react';
import { useT } from '@/i18n/useT';
import { usePhone } from '@/store/phoneStore';
import { useGame } from '@/store/gameStore';
import { AppHeader } from '../AppHeader';
import { EvidenceChip } from '../EvidenceChip';
import { useCaseWorld } from '../useCaseWorld';
import type { Order } from '@/engine/types';

/**
 * "My orders": a generic store app (not one shop). Two tabs (orders / contests),
 * then order details. Evidence lives on the summary row (E3-style "an order
 * exists") and inside the details (E4-style "the carrier differs").
 */
export function OrdersApp() {
  const { t } = useT();
  const w = useCaseWorld();
  const home = usePhone((s) => s.home);
  const orderId = usePhone((s) => s.orderId);
  const openOrder = usePhone((s) => s.openOrder);
  const useTool = useGame((s) => s.useTool);
  const [tab, setTab] = useState<'orders' | 'contests'>('orders');

  useEffect(() => {
    useTool('orders');
  }, [useTool]);

  if (!w) return null;
  const { c } = w;
  const order = orderId ? c.world.orders.find((o) => o.id === orderId) : undefined;

  if (order) {
    return <OrderDetails order={order} onBack={() => openOrder(undefined)} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="orders">
      <AppHeader title={t('orders.title')} onBack={home} />
      <div className="px-4 pt-3 text-xs text-fg-muted">{t('orders.subtitle')}</div>
      <div className="mx-4 mt-2 flex gap-1 rounded-full bg-surface-2 p-1" role="tablist">
        {(['orders', 'contests'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            data-testid={`orders-tab-${k}`}
            onClick={() => setTab(k)}
            className={`flex-1 rounded-full px-3 text-sm font-medium ${tab === k ? 'bg-surface text-fg shadow' : 'text-fg-muted'}`}
          >
            {t(`orders.tab.${k}`)}
          </button>
        ))}
      </div>
      <div className="phone-scroll flex-1 px-4 py-3">
        {tab === 'orders' ? (
          <ul className="grid gap-3">
            {c.world.orders.map((o) => (
              <li key={o.id} className="rounded-2xl border border-border bg-surface p-3" data-testid={`order-${o.id}`}>
                <button type="button" className="flex w-full items-center gap-3 text-start" onClick={() => openOrder(o.id)} data-testid={`order-open-${o.id}`}>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-fg-muted" aria-hidden>
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8l9-4 9 4-9 4z" />
                      <path d="M3 8v8l9 4 9-4V8" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium">{t(o.titleKey)}</span>
                    <span className="block truncate text-sm text-fg-muted">{t(o.storeKey)}</span>
                    <span className="mt-1 flex items-center gap-2 text-xs text-fg-muted">
                      <span className="rounded-full bg-surface-2 px-2 py-0.5">{t(o.statusKey)}</span>
                      <span>{t(o.dateKey)}</span>
                    </span>
                  </span>
                  <span className="text-fg-faint" aria-hidden>
                    ‹
                  </span>
                </button>
                {o.evidence?.summary && (
                  <div className="mt-3">
                    <EvidenceChip ids={o.evidence.summary} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : c.world.participations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-4 text-center text-sm text-fg-muted">{t('orders.noContests')}</p>
        ) : (
          <ul className="grid gap-3">
            {c.world.participations.map((p) => (
              <li key={p.id} className="rounded-2xl border border-border bg-surface p-3" data-testid={`participation-${p.id}`}>
                <div className="text-base font-medium">{t(p.contestKey)}</div>
                <div className="text-sm text-fg-muted">
                  {t(p.organizerKey)} · {t(p.dateKey)}
                </div>
                {p.evidence && (
                  <div className="mt-3">
                    <EvidenceChip ids={p.evidence} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OrderDetails({ order, onBack }: { order: Order; onBack: () => void }) {
  const { t } = useT();
  const rows: [string, string][] = [
    ['orders.status', order.statusKey],
    ['orders.carrier', order.carrierKey],
    ['orders.payment', order.paymentKey],
    ['orders.store', order.storeKey],
    ['orders.date', order.dateKey],
  ];
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="order-details">
      <AppHeader title={t('orders.details')} onBack={onBack} />
      <div className="phone-scroll flex-1 px-4 py-4">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-fg-muted" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l9-4 9 4-9 4z" />
              <path d="M3 8v8l9 4 9-4V8" />
            </svg>
          </span>
          <div>
            <div className="text-lg font-bold">{t(order.titleKey)}</div>
            <div className="text-xs text-fg-muted">
              {t('orders.number')}: <bdi>{order.id.toUpperCase()}</bdi>
            </div>
          </div>
        </div>
        <dl className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3 px-3 py-3 text-sm" data-testid={`order-row-${label.split('.')[1]}`}>
              <dt className="text-fg-muted">{t(label)}</dt>
              <dd className={`text-end font-medium ${label === 'orders.carrier' ? 'text-base' : ''}`}>{t(value)}</dd>
            </div>
          ))}
        </dl>
        {order.evidence?.details && (
          <div className="mt-4">
            <EvidenceChip ids={order.evidence.details} />
          </div>
        )}
      </div>
    </div>
  );
}

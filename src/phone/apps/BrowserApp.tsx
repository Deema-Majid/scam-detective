import { useEffect, useState } from 'react';
import type { Site, SiteBlock, SitePage } from '@/engine/types';
import { useT } from '@/i18n/useT';
import { usePhone } from '@/store/phoneStore';
import { useGame } from '@/store/gameStore';
import { AppHeader } from '../AppHeader';
import { EvidenceChip } from '../EvidenceChip';
import { useCaseWorld } from '../useCaseWorld';
import { Button } from '@/ui/Button';
import { IconLock, IconPhone, IconWarning } from '@/ui/Icons';

/**
 * In-game browser. Start page lists the saved official sites; every site is
 * data (world.sites) and renders inside the phone only (rule 5). The fake
 * payment form never stores or sends anything: fields are read-only and a
 * "fill fake data" button is the only way to populate them.
 */
export function BrowserApp() {
  const { t } = useT();
  const w = useCaseWorld();
  const home = usePhone((s) => s.home);
  const site = usePhone((s) => s.site);
  const openSite = usePhone((s) => s.openSite);
  const closeSite = usePhone((s) => s.closeSite);
  const useTool = useGame((s) => s.useTool);

  useEffect(() => {
    useTool('site');
  }, [useTool]);

  if (!w) return null;
  const { c } = w;
  const current = site ? c.world.sites.find((s) => s.id === site.siteId) : undefined;
  const page = current ? current.pages.find((p) => p.id === site!.pageId) ?? current.pages[0] : undefined;

  if (!current || !page) {
    return (
      <div className="flex min-h-0 flex-1 flex-col" data-testid="browser">
        <AppHeader title={t('browser.title')} onBack={home} />
        <AddressBar text={t('browser.startPage')} kind="start" />
        <div className="phone-scroll flex-1 px-4 py-4">
          <h3 className="mb-2 text-sm font-semibold text-fg-muted">{t('browser.bookmarks')}</h3>
          <ul className="grid gap-2">
            {c.world.sites
              .filter((s) => s.official)
              .map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    data-testid={`bookmark-${s.id}`}
                    onClick={() => openSite(s.id, s.pages[0].id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-3 text-start hover:bg-surface-2"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-fg-muted">
                      <IconLock />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{t(s.nameKey)}</span>
                      <span className="block truncate text-xs text-fg-muted">
                        <bdi>{s.domain}</bdi>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
          </ul>
          <p className="mt-4 text-xs text-fg-faint">{t('browser.note')}</p>
        </div>
      </div>
    );
  }

  const isFirst = page.id === current.pages[0].id;
  const back = () => (isFirst ? closeSite() : openSite(current.id, current.pages[0].id));

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid={`site-${current.id}`}>
      <AppHeader title={t(current.nameKey)} onBack={back} />
      <AddressBar text={`${current.domain}${page.path === '/' ? '' : page.path}`} kind={current.official ? 'official' : 'sim'} />
      <div className="phone-scroll flex-1">
        <SitePageView site={current} page={page} />
      </div>
    </div>
  );
}

function AddressBar({ text, kind }: { text: string; kind: 'start' | 'official' | 'sim' }) {
  const { t } = useT();
  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2" data-testid="address-bar">
      <div className="flex min-h-10 flex-1 items-center gap-2 rounded-xl bg-surface-2 px-3 text-sm">
        {kind === 'official' && <IconLock className="h-4 w-4 shrink-0 text-fg-muted" />}
        {kind === 'sim' && <IconWarning className="h-4 w-4 shrink-0 text-warn" />}
        <bdi className="truncate text-fg">{text}</bdi>
      </div>
      {kind !== 'start' && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${kind === 'official' ? 'bg-surface-2 text-fg-muted' : 'bg-warn-soft text-warn'}`}
          data-testid={`badge-${kind}`}
        >
          {kind === 'official' ? t('browser.officialBadge') : t('browser.simBadge')}
        </span>
      )}
    </div>
  );
}

/** A fictional site: neutral look, text logo only (never a real brand's identity). */
function SitePageView({ site, page }: { site: Site; page: SitePage }) {
  const { t } = useT();
  const tone = site.official ? 'from-[#2a6f7a] to-[#1f5a63]' : 'from-[#2c6c86] to-[#1f5a63]';
  return (
    <div>
      <div className={`bg-gradient-to-br ${tone} px-4 py-4 text-white`}>
        <div className="text-lg font-bold">{t(site.nameKey)}</div>
        <div className="text-xs opacity-80">{t(page.titleKey)}</div>
      </div>
      <div className="grid gap-4 px-4 py-4">
        {page.blocks.map((b, i) => (
          <Block key={i} site={site} block={b} />
        ))}
      </div>
    </div>
  );
}

function Block({ site, block }: { site: Site; block: SiteBlock }) {
  const { t } = useT();
  const openSite = usePhone((s) => s.openSite);
  const openCall = usePhone((s) => s.openCall);

  switch (block.type) {
    case 'text':
      return (
        <section className="rounded-2xl border border-border bg-surface p-3">
          {block.titleKey && <h4 className="mb-1 font-semibold">{t(block.titleKey)}</h4>}
          <p className="text-sm leading-relaxed">{t(block.bodyKey)}</p>
          {block.evidence && (
            <div className="mt-3">
              <EvidenceChip ids={block.evidence} />
            </div>
          )}
        </section>
      );
    case 'contact':
      return (
        <section className="rounded-2xl border border-border bg-surface p-3">
          <div className="text-xs text-fg-muted">{t(block.labelKey)}</div>
          <div className="mb-2 text-lg font-bold">
            <bdi>{block.number}</bdi>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => openCall(block.number)} data-testid={`site-call-${block.number.replace(/\s/g, '')}`}>
            <IconPhone />
            {t('site.call')}
          </Button>
          {block.evidence && (
            <div className="mt-3">
              <EvidenceChip ids={block.evidence} />
            </div>
          )}
        </section>
      );
    case 'list':
      return (
        <section>
          {block.titleKey && <h4 className="mb-2 text-xs font-semibold text-fg-muted">{t(block.titleKey)}</h4>}
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {block.itemKeys.map((k, i) => {
              const pageId = block.pageIds?.[i] ?? k.split('.').pop() ?? '';
              const target = site.pages.find((p) => p.id === pageId);
              return (
                <li key={k}>
                  <button
                    type="button"
                    disabled={!target}
                    data-testid={`site-nav-${pageId}`}
                    onClick={() => target && openSite(site.id, target.id)}
                    className="flex w-full items-center justify-between px-3 py-3 text-start text-sm hover:bg-surface-2 disabled:opacity-60"
                  >
                    <span>{t(k)}</span>
                    <span className="text-fg-faint" aria-hidden>
                      ‹
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {block.evidence && (
            <div className="mt-3">
              <EvidenceChip ids={block.evidence} />
            </div>
          )}
        </section>
      );
    case 'fake-form':
      return <FakeForm block={block} />;
    default:
      return null;
  }
}

/* Obviously fake values; the fields are read-only and nothing is stored or sent. */
const FAKE_VALUES: Record<string, string> = {
  'form.cardNumber': '4000 0000 0000 0000',
  'form.expiry': '12/29',
  'form.cvv': '000',
  'form.otp': '000000',
};

function FakeForm({ block }: { block: Extract<SiteBlock, { type: 'fake-form' }> }) {
  const { t } = useT();
  const [filled, setFilled] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  return (
    <section className="rounded-2xl border border-border bg-surface p-3" data-testid="fake-form">
      <h4 className="mb-1 font-semibold">{t(block.titleKey)}</h4>
      <p className="mb-3 text-xs text-fg-muted">{t(block.warningKey)}</p>
      <div className="grid gap-2">
        {block.fieldKeys.map((k) => (
          <label key={k} className="grid gap-1 text-xs text-fg-muted">
            {t(k)}
            <input
              readOnly
              value={filled ? FAKE_VALUES[k] ?? '0000' : ''}
              placeholder="····"
              dir="ltr"
              className="min-h-11 rounded-xl border border-border bg-surface-2 px-3 font-mono text-sm text-fg"
              data-testid={`fake-field-${k.split('.')[1]}`}
            />
          </label>
        ))}
      </div>
      <div className="mt-3 grid gap-2">
        {!filled && (
          <Button variant="secondary" onClick={() => setFilled(true)} data-testid="fill-fake">
            {t('form.fillFake')}
          </Button>
        )}
        <Button disabled={!filled || submitted} onClick={() => setSubmitted(true)} data-testid="fake-submit">
          {t(block.submitKey)}
        </Button>
      </div>
      {submitted && (
        <div className="mt-3 rounded-xl bg-warn-soft p-3 text-sm text-fg" role="status" data-testid="fake-submitted">
          {t('form.submitted')}
        </div>
      )}
      {block.evidence && (
        <div className="mt-3">
          <EvidenceChip ids={block.evidence} />
        </div>
      )}
    </section>
  );
}

import type { ReactNode } from 'react';
import type { Link } from '@/engine/types';
import { useT } from '@/i18n/useT';
import { usePhone, type Sheet } from '@/store/phoneStore';
import { useGame } from '@/store/gameStore';
import { EvidenceChip } from '../EvidenceChip';
import { Avatar } from '../Avatar';
import { contactOf, useCaseWorld } from '../useCaseWorld';
import { Button } from '@/ui/Button';

/** Bottom sheet container. One sheet at a time; Escape or the scrim closes it. */
export function SheetHost() {
  const sheet = usePhone((s) => s.sheet);
  const close = usePhone((s) => s.closeSheet);
  if (!sheet) return null;
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end" data-testid="sheet">
      <button type="button" aria-label="close" className="absolute inset-0 bg-black/50" onClick={close} tabIndex={-1} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[85%] overflow-y-auto rounded-t-[28px] border-t border-border bg-bg-elev px-4 pb-6 pt-3 shadow-2xl animate-[sheet-in_260ms_ease-out]"
        onKeyDown={(e) => e.key === 'Escape' && close()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-fg/25" aria-hidden />
        <SheetBody sheet={sheet} />
      </div>
      <style>{`@keyframes sheet-in{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

function SheetBody({ sheet }: { sheet: NonNullable<Sheet> }) {
  switch (sheet.kind) {
    case 'sender':
      return <SenderSheet contactId={sheet.contactId} />;
    case 'link':
      return <LinkSheet threadId={sheet.threadId} messageId={sheet.messageId} linkId={sheet.linkId} />;
    default:
      return null;
  }
}

function SheetTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-lg font-bold text-accent-ink">{children}</h2>;
}

function SenderSheet({ contactId }: { contactId: string }) {
  const { t } = useT();
  const w = useCaseWorld();
  if (!w) return null;
  const contact = contactOf(w.c, contactId);
  if (!contact) return null;
  return (
    <div data-testid="sender-sheet">
      <SheetTitle>{t('sender.title')}</SheetTitle>
      <div className="mb-4 flex items-center gap-3">
        <Avatar contact={contact} size="lg" />
        <div className="min-w-0">
          <div className="truncate text-base font-semibold">
            <bdi>{t(contact.nameKey)}</bdi>
          </div>
          {contact.number && (
            <div className="text-sm text-fg-muted">
              <bdi>{contact.number}</bdi>
            </div>
          )}
          {contact.handle && (
            <div className="text-sm text-fg-muted">
              <bdi>@{contact.handle}</bdi>
            </div>
          )}
        </div>
      </div>
      <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {(contact.facts ?? []).map((f) => (
          <div key={f.labelKey} className="contents">
            <dt className="text-fg-muted">{t(f.labelKey)}</dt>
            <dd className="font-medium">{t(f.valueKey)}</dd>
          </div>
        ))}
        {contact.saved && (
          <div className="contents">
            <dt className="text-fg-muted">{t('sender.fact.saved')}</dt>
            <dd className="font-medium">{t('common.yes')}</dd>
          </div>
        )}
      </dl>
      <EvidenceChip ids={contact.evidence} />
    </div>
  );
}

function LinkSheet({ threadId, messageId, linkId }: { threadId: string; messageId: string; linkId: string }) {
  const { t } = useT();
  const w = useCaseWorld();
  const openSite = usePhone((s) => s.openSite);
  const close = usePhone((s) => s.closeSheet);
  const openLink = useGame((s) => s.openLink);
  if (!w) return null;
  const thread = w.c.world.threads.find((x) => x.id === threadId);
  const message = thread?.messages.find((m) => m.id === messageId) ?? (w.c.interrupt?.message.id === messageId ? w.c.interrupt.message : undefined);
  const link = message?.links?.find((l) => l.id === linkId);
  if (!link) return null;

  return (
    <div data-testid="link-sheet">
      <SheetTitle>{t('link.title')}</SheetTitle>
      <p className="mb-3 text-xs text-fg-muted">{t('link.note')}</p>
      <div className="mb-3 rounded-2xl border border-border bg-surface p-3">
        <div className="mb-1 text-xs text-fg-muted">{t('link.fullUrl')}</div>
        <UrlBreakdown url={link.url} />
      </div>
      <dl className="mb-4 grid gap-2 text-sm">
        <div>
          <dt className="text-fg-muted">{t('link.domain')}</dt>
          <dd className="font-semibold">
            <bdi className="break-all">{hostOf(link.url)}</bdi>
          </dd>
        </div>
        {link.officialUrl && (
          <div>
            <dt className="text-fg-muted">{t('link.officialDomain')}</dt>
            <dd className="font-semibold">
              <bdi className="break-all">{hostOf(link.officialUrl)}</bdi>
            </dd>
          </div>
        )}
      </dl>
      <p className="mb-3 text-xs text-fg-faint">{t('link.subdomainHint')}</p>
      <div className="mb-4">
        <EvidenceChip ids={link.evidence} />
      </div>
      {link.opens && (
        <Button
          variant="secondary"
          className="w-full"
          data-testid="open-in-sim"
          onClick={() => {
            openLink(link.id);
            close();
            openSite(link.opens!.siteId, link.opens!.pageId);
          }}
        >
          {t('link.openInSim')}
        </Button>
      )}
    </div>
  );
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Shows the URL left-to-right with the registrable domain (last two labels)
 * highlighted and everything before it dimmed, so "rafeef-express-pay" stands
 * out from "rafeef-express".
 */
export function UrlBreakdown({ url }: { url: Link['url'] }) {
  let u: URL | null = null;
  try {
    u = new URL(url);
  } catch {
    /* fall through */
  }
  if (!u) return <bdi className="break-all font-mono text-sm">{url}</bdi>;
  const labels = u.hostname.split('.');
  const main = labels.slice(-2).join('.');
  const sub = labels.slice(0, -2).join('.');
  return (
    <bdi className="block break-all font-mono text-sm leading-relaxed" data-testid="url-breakdown">
      <span className="text-fg-faint">{u.protocol}//</span>
      {sub && <span className="text-fg-faint">{sub}.</span>}
      <mark className="rounded bg-accent-soft px-1 text-accent-ink">{main}</mark>
      <span className="text-fg-muted">{u.pathname === '/' ? '' : u.pathname}</span>
    </bdi>
  );
}

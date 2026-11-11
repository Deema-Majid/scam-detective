import type { Message, Thread } from '@/engine/types';
import { useT } from '@/i18n/useT';
import { usePhone } from '@/store/phoneStore';
import { useGame } from '@/store/gameStore';
import { EvidenceChip } from './EvidenceChip';

const URL_RE = /(https?:\/\/[^\s]+)/g;

/**
 * One message. Links are rendered as buttons that open the link inspector:
 * never a real <a href> (rule 2.1).
 */
export function MessageBubble({ thread, message }: { thread: Thread; message: Message }) {
  const { t } = useT();
  const openSheet = usePhone((s) => s.openSheet);
  const useTool = useGame((s) => s.useTool);
  const mine = message.from === 'me';
  const text = t(message.bodyKey);
  const parts = text.split(URL_RE);

  return (
    <div className={`flex flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`} data-testid={`msg-${message.id}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-[15px] leading-relaxed ${
          mine ? 'rounded-ee-sm bg-accent-soft text-fg' : 'rounded-es-sm bg-surface-2 text-fg'
        }`}
      >
        {message.voiceNote ? (
          <span className="flex items-center gap-2 text-fg-muted">
            <span aria-hidden>▶</span>
            <span className="h-1 w-32 rounded bg-fg-faint" />
            <span className="text-xs">{t('chats.voiceNote')}</span>
            <span className="sr-only">{text}</span>
          </span>
        ) : (
          parts.map((part, i) => {
            if (!URL_RE.test(part)) return <span key={i}>{part}</span>;
            URL_RE.lastIndex = 0;
            const link = message.links?.find((l) => l.url === part.replace(/[.,،]$/, ''));
            return (
              <button
                key={i}
                type="button"
                data-testid={link ? `link-${link.id}` : 'link'}
                className="break-all text-info underline decoration-dotted underline-offset-4"
                onClick={() => {
                  if (!link) return;
                  useTool('link');
                  openSheet({ kind: 'link', threadId: thread.id, messageId: message.id, linkId: link.id });
                }}
                aria-label={`${t('messages.openLink')}: ${part}`}
              >
                <bdi>{part}</bdi>
              </button>
            );
          })
        )}
      </div>
      <span className="px-1 text-[11px] text-fg-faint">{t(message.timeKey)}</span>
      {message.evidence && (
        <div className="w-full max-w-[85%]">
          <EvidenceChip ids={message.evidence} />
        </div>
      )}
    </div>
  );
}

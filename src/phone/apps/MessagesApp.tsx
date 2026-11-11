import { useT } from '@/i18n/useT';
import { usePhone } from '@/store/phoneStore';
import { useGame } from '@/store/gameStore';
import { AppHeader } from '../AppHeader';
import { Avatar } from '../Avatar';
import { contactOf, sortThreadsByRecency, threadsForApp, useCaseWorld, visibleMessages } from '../useCaseWorld';
import { MessageBubble } from '../MessageBubble';
import type { Thread } from '@/engine/types';
import { EvidenceChip } from '../EvidenceChip';

/** SMS-style app: thread list, then one thread. Tapping the sender opens the sender sheet. */
export function MessagesApp({ app = 'messages' }: { app?: 'messages' | 'chats' }) {
  const { t } = useT();
  const w = useCaseWorld();
  const threadId = usePhone((s) => s.threadId);
  const openThread = usePhone((s) => s.openThread);
  const home = usePhone((s) => s.home);
  const openSheet = usePhone((s) => s.openSheet);
  const useTool = useGame((s) => s.useTool);
  if (!w) return null;
  const { c, run } = w;

  const threads = sortThreadsByRecency(c, run, threadsForApp(c, run, app));
  const thread = threadId ? threads.find((x) => x.id === threadId) : undefined;

  if (!thread) {
    return (
      <div className="flex min-h-0 flex-1 flex-col" data-testid={`${app}-list`}>
        <AppHeader title={t(app === 'messages' ? 'messages.title' : 'chats.title')} onBack={home} />
        <ul className="phone-scroll flex-1 divide-y divide-border">
          {threads.map((th) => (
            <ThreadRow key={th.id} thread={th} onOpen={() => openThread(th.id)} />
          ))}
        </ul>
      </div>
    );
  }

  const contact = contactOf(c, thread.contactId);
  const messages = visibleMessages(c, run, thread);
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid={`thread-${thread.id}`}>
      <AppHeader
        onBack={() => openThread('')}
        title={
          <button
            type="button"
            data-testid="sender-button"
            className="flex w-full min-w-0 items-center gap-2 rounded-xl px-1 py-1 text-start hover:bg-surface-2"
            onClick={() => {
              if (contact) {
                useTool('sender');
                openSheet({ kind: 'sender', contactId: contact.id });
              }
            }}
            aria-label={`${contact ? t(contact.nameKey) : ''} — ${t('sender.title')}`}
          >
            {contact && <Avatar contact={contact} size="sm" />}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold">
                {contact ? <bdi>{t(contact.nameKey)}</bdi> : null}
              </span>
              <span className="block text-[11px] font-normal text-fg-muted">{t('messages.tapSender')}</span>
            </span>
          </button>
        }
      />
      <div className="phone-scroll flex flex-1 flex-col gap-3 px-3 py-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} thread={thread} message={m} />
        ))}
        {thread.evidence && thread.evidence.length > 0 && (
          <div className="mt-2 border-t border-border pt-3" data-testid="thread-evidence">
            <div className="mb-2 text-xs text-fg-muted">{t('chats.readHistory')}</div>
            <EvidenceChip ids={thread.evidence} />
          </div>
        )}
        {thread.replies && thread.replies.length > 0 && <ReplyChoices thread={thread} />}
      </div>
    </div>
  );
}

function ThreadRow({ thread, onOpen }: { thread: Thread; onOpen: () => void }) {
  const { t } = useT();
  const w = useCaseWorld();
  if (!w) return null;
  const contact = contactOf(w.c, thread.contactId);
  const msgs = visibleMessages(w.c, w.run, thread);
  const last = msgs[msgs.length - 1];
  const isIncoming = thread.id === w.c.incoming.threadId || (w.run.interruptFired && w.c.interrupt?.threadId === thread.id);
  return (
    <li>
      <button
        type="button"
        data-testid={`thread-row-${thread.id}`}
        aria-label={contact ? t(contact.nameKey) : undefined}
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-surface-2"
      >
        {contact && <Avatar contact={contact} />}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={`truncate ${isIncoming ? 'font-bold' : 'font-medium'}`}>{contact ? <bdi>{t(contact.nameKey)}</bdi> : ''}</span>
            <span className="shrink-0 text-xs text-fg-faint">{last ? t(last.timeKey) : ''}</span>
          </span>
          <span className={`line-clamp-1 text-sm ${isIncoming ? 'text-fg' : 'text-fg-muted'}`}>{last ? t(last.bodyKey) : ''}</span>
        </span>
        {isIncoming && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-hidden />}
      </button>
    </li>
  );
}

/** Preset replies in a chat (case 2: ask a personal question). */
function ReplyChoices({ thread }: { thread: Thread }) {
  const { t } = useT();
  const sent = usePhone((s) => s.sentReplies);
  const sendReply = usePhone((s) => s.sendReply);
  const useTool = useGame((s) => s.useTool);
  const remaining = (thread.replies ?? []).filter((r) => !sent.includes(r.id));
  const done = (thread.replies ?? []).filter((r) => sent.includes(r.id));
  return (
    <div className="flex flex-col gap-3">
      {done.map((r) => (
        <div key={r.id} className="flex flex-col gap-2">
          <div className="self-start rounded-2xl rounded-es-sm bg-accent-soft px-3 py-2 text-sm">{t(r.textKey)}</div>
          <div className="self-end rounded-2xl rounded-ee-sm bg-surface-2 px-3 py-2 text-sm">{t(r.responseKey)}</div>
          {r.evidence && <EvidenceChip ids={r.evidence} />}
        </div>
      ))}
      {remaining.length > 0 && (
        <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
          <div className="text-xs text-fg-muted">{t('chats.reply')}</div>
          {remaining.map((r) => (
            <button
              key={r.id}
              type="button"
              data-testid={`reply-${r.id}`}
              className="rounded-2xl border border-border bg-surface px-3 py-2 text-start text-sm hover:bg-surface-2"
              onClick={() => {
                useTool('chats');
                sendReply(r.id);
              }}
            >
              {t(r.textKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

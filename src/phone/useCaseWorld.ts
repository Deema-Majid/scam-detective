import { useMemo } from 'react';
import type { Case, CaseRun, Contact, Message, Thread } from '@/engine/types';
import { selectCurrentCase, selectCurrentRun, useGame } from '@/store/gameStore';

/**
 * Read-only view of the current case's world as the player sees it right now:
 * the interrupt message is appended to its thread only after it fired.
 */
export function useCaseWorld(): { c: Case; run: CaseRun } | null {
  const c = useGame(selectCurrentCase);
  const run = useGame(selectCurrentRun);
  return c && run ? { c, run } : null;
}

export function visibleMessages(c: Case, run: CaseRun, thread: Thread): Message[] {
  const extra = run.interruptFired && c.interrupt?.threadId === thread.id ? [c.interrupt.message] : [];
  return [...thread.messages, ...extra];
}

export function contactOf(c: Case, contactId: string): Contact | undefined {
  return c.world.contacts.find((x) => x.id === contactId);
}

export function threadsForApp(c: Case, run: CaseRun, app: 'messages' | 'chats'): Thread[] {
  return c.world.threads
    .filter((t) => t.app === app)
    .filter((t) => visibleMessages(c, run, t).length > 0);
}

export function useThreads(app: 'messages' | 'chats'): Thread[] {
  const w = useCaseWorld();
  return useMemo(() => (w ? threadsForApp(w.c, w.run, app) : []), [w, app]);
}

/** The thread whose latest message is the case's incoming message (shown first). */
export function sortThreadsByRecency(c: Case, run: CaseRun, threads: Thread[]): Thread[] {
  const incoming = c.incoming.threadId;
  const interrupt = run.interruptFired ? c.interrupt?.threadId : undefined;
  return [...threads].sort((a, b) => rank(a.id) - rank(b.id));
  function rank(id: string) {
    if (id === interrupt) return 0;
    if (id === incoming) return 1;
    return 2;
  }
}

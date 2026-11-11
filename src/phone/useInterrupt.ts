import { useEffect } from 'react';
import { useGame } from '@/store/gameStore';
import { usePhone } from '@/store/phoneStore';
import { contactOf, useCaseWorld } from './useCaseWorld';

/**
 * Fires the case's interrupt message (build-plan 5.1) once, during investigation.
 *  - trigger.kind === 'time':  N seconds after the investigation started.
 *  - trigger.kind === 'event': when the player opens a given link inside the
 *    simulation ('open-link') or opens a given app ('open-app'). Case 3 uses this.
 * The notification is deferred while a bottom sheet or a call is open
 * (DECISIONS.md), so it is never missed under another layer.
 */
export function useInterrupt() {
  const w = useCaseWorld();
  const fireInterrupt = useGame((s) => s.fireInterrupt);
  const showToast = usePhone((s) => s.showToast);
  const sheet = usePhone((s) => s.sheet);
  const inCall = usePhone((s) => s.inCall);
  const phoneApp = usePhone((s) => s.app);

  const c = w?.c;
  const phase = w?.run.phase;
  const fired = w?.run.interruptFired ?? true;
  const startedAt = w?.run.startedAt ?? 0;
  const openedLinks = w?.run.openedLinks.join(',') ?? '';

  useEffect(() => {
    if (!c || phase !== 'investigating' || fired) return;
    const it = c.interrupt;
    if (!it) return;
    if (sheet || inCall) return; // deferred until the layer closes (effect re-runs)

    let delay = 0;
    if (it.trigger.kind === 'time') {
      delay = Math.max(500, startedAt + it.trigger.seconds * 1000 - Date.now());
    } else if (it.trigger.event === 'open-link') {
      if (!openedLinks.split(',').includes(it.trigger.id)) return;
      delay = 900;
    } else if (it.trigger.event === 'open-app') {
      if (phoneApp !== it.trigger.id) return;
      delay = 900;
    }

    const id = setTimeout(() => {
      fireInterrupt();
      const thread = c.world.threads.find((th) => th.id === it.threadId);
      const contact = contactOf(c, thread?.contactId ?? '');
      showToast({
        titleKey: contact?.nameKey ?? 'phone.notification.newMessage',
        bodyKey: it.message.bodyKey,
        threadId: it.threadId,
        app: thread?.app ?? 'messages',
      });
    }, delay);
    return () => clearTimeout(id);
  }, [c, phase, fired, startedAt, openedLinks, sheet, inCall, phoneApp, fireInterrupt, showToast]);
}

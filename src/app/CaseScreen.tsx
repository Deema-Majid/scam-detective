import { useEffect, useRef } from 'react';
import { useT } from '@/i18n/useT';
import { useGame } from '@/store/gameStore';
import { usePhone } from '@/store/phoneStore';
import { PhoneFrame } from '@/phone/PhoneFrame';
import { PhoneScreen } from '@/phone/PhoneScreen';
import { useCaseWorld, contactOf } from '@/phone/useCaseWorld';
import { useInterrupt } from '@/phone/useInterrupt';
import { Button } from '@/ui/Button';
import { AmbientBackground } from '@/ui/AmbientBackground';

/**
 * One case: context card -> the phone (incoming message arrives) -> investigation
 * -> verdict / decision / outcome / debrief (all inside the phone, see src/phone/flow).
 */
export function CaseScreen() {
  const { t } = useT();
  const w = useCaseWorld();
  const mode = useGame((s) => s.mode);
  const caseOrder = useGame((s) => s.caseOrder);
  const exitFamily = useGame((s) => s.exitFamily);
  const startInvestigating = useGame((s) => s.startInvestigating);
  const showToast = usePhone((s) => s.showToast);
  const resetForCase = usePhone((s) => s.resetForCase);
  const caseId = w?.c.id;
  const phase = w?.run.phase;
  const arrived = useRef<string | null>(null);

  // Fresh phone navigation whenever a new case starts.
  useEffect(() => {
    resetForCase();
  }, [caseId, resetForCase]);

  // Incoming message: short pause, notification, then investigation begins.
  useEffect(() => {
    if (!w || phase !== 'incoming' || arrived.current === caseId) return;
    const id = setTimeout(() => {
      arrived.current = caseId ?? null;
      const thread = w.c.world.threads.find((th) => th.id === w.c.incoming.threadId);
      const contact = contactOf(w.c, thread?.contactId ?? '');
      const msg = thread?.messages.find((m) => m.id === w.c.incoming.messageIds[0]);
      startInvestigating();
      if (msg) showToast({ titleKey: contact?.nameKey ?? 'phone.notification.newMessage', bodyKey: msg.bodyKey, threadId: w.c.incoming.threadId, app: w.c.world.threads.find((th) => th.id === w.c.incoming.threadId)?.app ?? 'messages' });
    }, 1200);
    return () => clearTimeout(id);
  }, [w, phase, caseId, startInvestigating, showToast]);

  // Interrupt message (time- or event-triggered), shared hook.
  useInterrupt();

  if (!w) return null;
  const { run } = w;
  const caseIndex = caseOrder.indexOf(w.c.id);

  return (
    <main id="main" data-case={w.c.id} className="relative flex min-h-dvh flex-col items-center justify-center gap-6 sm:py-4">
      <h1 className="sr-only">{t(w.c.titleKey)}</h1>
      {mode === 'family' && (
        <Button variant="secondary" size="sm" className="fixed end-2 top-1 z-40 !min-h-9 sm:hidden" onClick={exitFamily} data-testid="family-exit-mobile">
          {t('family.exit')}
        </Button>
      )}
      {mode === 'tester' && <TesterProgress step={caseIndex + 1} total={caseOrder.length} />}
      <AmbientBackground />
      <CaseIntroCard />
      <PhoneFrame>
        {run.adaptiveHint && run.phase === 'investigating' && run.collected.length === 0 && (
          <p className="mx-3 mt-2 rounded-xl bg-accent-soft px-3 py-2 text-xs text-accent-ink" data-testid="adaptive-hint">
            {t('case.adaptiveHint', { tool: t(toolLabelKey(run.adaptiveHint)) })}
          </p>
        )}
        <PhoneScreen />
      </PhoneFrame>
      <p className="hidden max-w-sm text-center text-sm text-fg-muted sm:block">{t('case.investigate')}</p>
    </main>
  );
}

function toolLabelKey(tool: string): string {
  const map: Record<string, string> = {
    sender: 'sender.title',
    link: 'link.title',
    site: 'phone.app.browser',
    orders: 'phone.app.orders',
    call: 'phone.app.dialer',
    chats: 'phone.app.chats',
  };
  return map[tool] ?? tool;
}

/** Thin progress strip in tester mode (design 1.3): pre · cases · post. */
function TesterProgress({ step, total }: { step: number; total: number }) {
  const { t } = useT();
  const labels = [t('tester.progress.pre'), ...Array.from({ length: total }, (_, i) => t('tester.progress.case', { n: i + 1 })), t('tester.progress.post')];
  const active = step; // 0 = pre, 1..total = cases, total+1 = post
  return (
    <ol className="flex w-[390px] max-w-full items-center gap-1 px-2 text-[11px] text-fg-muted" aria-label={t('tester.progress.label')} data-testid="tester-progress">
      {labels.map((l, i) => (
        <li key={l} className="flex flex-1 flex-col items-center gap-1">
          <span className={`h-1 w-full rounded-full ${i <= active ? 'bg-accent' : 'bg-border'}`} aria-hidden />
          <span className={i === active ? 'font-semibold text-fg' : ''}>{l}</span>
        </li>
      ))}
    </ol>
  );
}

/** Context panel outside the phone (desktop only): case title + setup line. */
function CaseIntroCard() {
  const { t } = useT();
  const w = useCaseWorld();
  const mode = useGame((s) => s.mode);
  const setScreen = useGame((s) => s.setScreen);
  const exitFamily = useGame((s) => s.exitFamily);
  if (!w) return null;
  return (
    <div className="hidden w-[390px] items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 sm:flex" data-testid="case-context">
      <div className="min-w-0">
        <div className="text-xs text-fg-muted">{t(w.c.setupKey)}</div>
        <div className="truncate text-base font-bold">{t(w.c.titleKey)}</div>
        <div className="text-xs text-fg-faint">{t('case.evidenceCount', { n: w.run.collected.length, total: w.c.evidence.length })}</div>
      </div>
      {mode !== 'tester' && (
        <Button variant="ghost" size="sm" onClick={() => (mode === 'family' ? exitFamily() : setScreen('intro'))} data-testid={mode === 'family' ? 'family-exit' : 'case-back'}>
          {mode === 'family' ? t('family.exit') : t('common.back')}
        </Button>
      )}
    </div>
  );
}

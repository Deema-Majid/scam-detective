import { useEffect, useMemo, useState } from 'react';
import type { CallScript, Contact } from '@/engine/types';
import { useT } from '@/i18n/useT';
import { usePhone } from '@/store/phoneStore';
import { useGame } from '@/store/gameStore';
import { AppHeader } from '../AppHeader';
import { Avatar } from '../Avatar';
import { EvidenceChip } from '../EvidenceChip';
import { useCaseWorld } from '../useCaseWorld';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { IconPhone } from '@/ui/Icons';

const norm = (n: string) => n.replace(/\D/g, '');

/**
 * Phone app: saved contacts, numbers that appeared in the case (unsaved senders
 * + official numbers of sites the player visited), and a simple keypad. Calls
 * are scripted text (world.calls); a number without a script "does not answer".
 */
export function DialerApp() {
  const { t } = useT();
  const w = useCaseWorld();
  const home = usePhone((s) => s.home);
  const callNumber = usePhone((s) => s.callNumber);
  const openCall = usePhone((s) => s.openCall);
  const visitedSites = usePhone((s) => s.visitedSites);
  const [typed, setTyped] = useState('');
  const sheetOpen = usePhone((s) => s.sheet !== null);

  // Physical keyboard: digits type, Backspace deletes, Enter calls (same rules as the on-screen keypad).
  useEffect(() => {
    if (callNumber || sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
      if (e.key.length === 1 && /[0-9*#]/.test(e.key)) {
        setTyped((s) => (s.length < 14 ? s + e.key : s));
      } else if (e.key === 'Backspace') {
        setTyped((s) => s.slice(0, -1));
      } else if (e.key === 'Enter') {
        // Enter on a focused button/link keeps its own meaning.
        if (el && (el.tagName === 'BUTTON' || el.tagName === 'A')) return;
        if (norm(typed).length >= 3) openCall(typed);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [callNumber, sheetOpen, typed, openCall]);

  if (!w) return null;
  const { c } = w;

  if (callNumber) return <CallScreen number={callNumber} />;

  const saved = c.world.contacts.filter((ct) => ct.saved && ct.number);
  const unsaved = c.world.contacts.filter((ct) => !ct.saved && ct.number);
  const official: { labelKey: string; number: string; siteName: string }[] = [];
  for (const s of c.world.sites) {
    if (!visitedSites.includes(s.id)) continue;
    for (const p of s.pages) for (const b of p.blocks) if (b.type === 'contact') official.push({ labelKey: b.labelKey, number: b.number, siteName: t(s.nameKey) });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="dialer">
      <AppHeader title={t('dialer.title')} onBack={home} />
      <div className="phone-scroll flex-1 px-4 py-3" role="region" tabIndex={0} aria-label={t('phone.scrollRegion')}>
        {saved.length > 0 && (
          <Section title={t('dialer.contacts')}>
            {saved.map((ct) => (
              <NumberRow key={ct.id} contact={ct} number={ct.number!} label={t(ct.nameKey)} onCall={() => openCall(ct.number!)} />
            ))}
          </Section>
        )}
        {(unsaved.length > 0 || official.length > 0) && (
          <Section title={t('dialer.recent')}>
            {official.map((o) => (
              <NumberRow key={o.number} number={o.number} label={`${o.siteName} · ${t(o.labelKey)}`} onCall={() => openCall(o.number)} />
            ))}
            {unsaved.map((ct) => (
              <NumberRow key={ct.id} contact={ct} number={ct.number!} label={t('dialer.fromMessage')} onCall={() => openCall(ct.number!)} />
            ))}
          </Section>
        )}
        <Section title={t('dialer.keypad')}>
          <div className="rounded-2xl border border-border bg-surface p-3">
            <div className="mb-2 flex min-h-11 items-center justify-between gap-2 rounded-xl bg-surface-2 px-3">
              <bdi className="text-lg font-semibold tracking-wider" data-testid="keypad-display">
                {typed || ' '}
              </bdi>
              <button type="button" className="text-sm text-fg-muted" onClick={() => setTyped((s) => s.slice(0, -1))} aria-label={t('dialer.delete')} data-testid="keypad-delete">
                ⌫
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2" dir="ltr">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTyped((s) => (s.length < 14 ? s + k : s))}
                  className="min-h-12 rounded-xl bg-surface-2 text-lg font-semibold hover:bg-border"
                  data-testid={`key-${k === '*' ? 'star' : k === '#' ? 'hash' : k}`}
                >
                  {k}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={norm(typed).length < 3}
              onClick={() => openCall(typed)}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-legit text-legit-fg disabled:opacity-40"
              data-testid="keypad-call"
            >
              <IconPhone />
              {t('dialer.call')}
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <h3 className="mb-2 text-xs font-semibold text-fg-muted">{title}</h3>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function NumberRow({ contact, number, label, onCall }: { contact?: Contact; number: string; label: string; onCall: () => void }) {
  const { t } = useT();
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2">
      {contact ? (
        <Avatar contact={contact} size="sm" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-fg-muted" aria-hidden>
          <IconPhone className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{label}</span>
        <span className="block text-xs text-fg-muted">
          <bdi>{number}</bdi>
        </span>
      </span>
      <button
        type="button"
        onClick={onCall}
        aria-label={`${t('dialer.call')} ${number}`}
        data-testid={`call-${norm(number)}`}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-legit text-legit-fg"
      >
        <IconPhone />
      </button>
    </div>
  );
}

/** Scripted call: lines appear one by one (~1.2 s), all at once under reduced motion. */
function CallScreen({ number }: { number: string }) {
  const { t } = useT();
  const w = useCaseWorld();
  const endCall = usePhone((s) => s.endCall);
  const useTool = useGame((s) => s.useTool);
  const reduce = useReducedMotion();
  const script: CallScript | undefined = w?.c.world.calls.find((cs) => norm(cs.number) === norm(number));
  const callee = script ? t(script.calleeKey) : t('dialer.unknown');
  const [shown, setShown] = useState(reduce ? (script?.lines.length ?? 0) : 0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    useTool('call');
  }, [useTool]);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const total = script?.lines.length ?? 0;
  useEffect(() => {
    if (reduce || shown >= total) return;
    const id = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 900 : 1200);
    return () => clearTimeout(id);
  }, [shown, total, reduce]);

  const done = shown >= total;
  const clock = useMemo(() => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`, [seconds]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface" data-testid="call-screen">
      <div className="px-4 pb-3 pt-6 text-center">
        <div className="text-lg font-bold">{callee}</div>
        <div className="text-sm text-fg-muted">
          <bdi>{number}</bdi>
        </div>
        <div className="mt-1 text-xs text-fg-faint">
          {done && !script ? t('dialer.noAnswer') : t('dialer.connected')} · <bdi>{clock}</bdi>
        </div>
      </div>
      <div className="phone-scroll flex flex-1 flex-col gap-2 px-4 py-2" role="region" tabIndex={0} aria-label={t('phone.scrollRegion')} aria-live="polite">
        {script?.risky && (
          <p className="rounded-xl bg-warn-soft px-3 py-2 text-xs text-fg" data-testid="risky-note">
            {t('dialer.riskyNote')}
          </p>
        )}
        {!script && (
          <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-fg-muted" data-testid="no-answer">
            {t('dialer.noAnswer')}
          </p>
        )}
        {script?.lines.slice(0, shown).map((l, i) => (
          <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${l.who === 'them' ? 'self-start rounded-es-sm bg-surface-2' : 'self-end rounded-ee-sm bg-accent-soft'}`} data-testid={`call-line-${i}`}>
            <span className="sr-only">{l.who === 'them' ? callee : t('dialer.me')}: </span>
            {t(l.textKey)}
          </div>
        ))}
        {!done && script && (
          <div className="self-start px-3 text-xs text-fg-faint" aria-hidden>
            …
          </div>
        )}
        {done && script?.evidence && (
          <div className="mt-2">
            <EvidenceChip ids={script.evidence} />
          </div>
        )}
      </div>
      <div className="flex justify-center pb-6 pt-3">
        <button type="button" onClick={endCall} aria-label={t('dialer.end')} data-testid="end-call" className="flex h-16 w-16 items-center justify-center rounded-full bg-scam text-scam-fg shadow-lg">
          <IconPhone className="h-7 w-7 rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
}

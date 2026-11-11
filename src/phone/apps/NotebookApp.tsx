import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Deduction, Evidence } from '@/engine/types';
import { linkableEvidence } from '@/engine/scoring';
import { useT } from '@/i18n/useT';
import { usePhone } from '@/store/phoneStore';
import { useGame } from '@/store/gameStore';
import { AppHeader } from '../AppHeader';
import { useCaseWorld } from '../useCaseWorld';
import { Button } from '@/ui/Button';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { IconLink, IconShield, IconWarning } from '@/ui/Icons';

type Line = { id: string; x1: number; y1: number; x2: number; y2: number; failed?: boolean };

const TOOL_LABEL: Record<string, string> = {
  sender: 'sender.title',
  link: 'link.title',
  orders: 'phone.app.orders',
  site: 'phone.app.browser',
  call: 'phone.app.dialer',
  chats: 'phone.app.chats',
  interrupt: 'phone.app.messages',
};

/**
 * Evidence notebook as a real paper notebook (design §11.2): lined paper,
 * sticky-note cards, ink lines between linked cards, and deduction notes.
 * "Link two" mode: pick two cards -> useGame().link(a, b).
 */
export function NotebookApp() {
  const { t } = useT();
  const w = useCaseWorld();
  const home = usePhone((s) => s.home);
  const goToVerdict = useGame((s) => s.goToVerdict);
  const link = useGame((s) => s.link);
  const reduce = useReducedMotion();

  const [linkMode, setLinkMode] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: 'ok' | 'none'; text: string } | null>(null);
  const [fails, setFails] = useState(0);
  const [failLine, setFailLine] = useState<Line | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const drawn = useRef<Set<string>>(new Set());

  const c = w?.c;
  const run = w?.run;
  const collectedIds = run?.collected.join(',') ?? '';
  const deductionIds = run?.deductions.join(',') ?? '';

  /* Recompute ink lines from the cards' positions inside the scrolling wrapper. */
  const measure = useCallback(() => {
    if (!c || !run || !wrapRef.current) return;
    const base = wrapRef.current.getBoundingClientRect();
    const center = (id: string) => {
      const el = cardRefs.current[id];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
    };
    const next: Line[] = [];
    for (const dId of run.deductions) {
      const d = c.deductions.find((x) => x.id === dId);
      if (!d) continue;
      const a = center(d.pair[0]);
      const b = center(d.pair[1]);
      if (a && b) next.push({ id: d.id, x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }
    setLines(next);
  }, [c, run]);

  useLayoutEffect(() => {
    measure();
  }, [measure, collectedIds, deductionIds, expanded]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  /* Draw new ink lines (stroke-dashoffset), instantly under reduced motion. */
  useEffect(() => {
    for (const l of lines) {
      if (drawn.current.has(l.id)) continue;
      drawn.current.add(l.id);
      const el = wrapRef.current?.querySelector<SVGPathElement>(`[data-ink="${l.id}"]`);
      if (!el) continue;
      const len = el.getTotalLength();
      if (reduce) {
        el.style.strokeDasharray = '6 3 2 3';
        continue;
      }
      el.style.strokeDasharray = String(len);
      el.style.strokeDashoffset = String(len);
      gsap.to(el, {
        strokeDashoffset: 0,
        duration: 0.6,
        ease: 'power1.inOut',
        onComplete: () => {
          el.style.strokeDasharray = '6 3 2 3';
          el.style.strokeDashoffset = '0';
        },
      });
    }
  }, [lines, reduce]);

  if (!c || !run) return null;
  const collected = run.collected.map((id) => c.evidence.find((e) => e.id === id)).filter((e): e is Evidence => !!e);
  const deductions = run.deductions.map((id) => c.deductions.find((d) => d.id === id)).filter((d): d is Deduction => !!d);
  const canVerdict = run.phase === 'investigating' && collected.length >= 2;
  const showHint = fails >= 3 && linkableEvidence(c, run).length > 0;

  const onPick = (id: string) => {
    if (!linkMode) {
      setExpanded((e) => (e === id ? null : id));
      return;
    }
    if (picked.includes(id)) {
      setPicked(picked.filter((p) => p !== id));
      return;
    }
    const next = [...picked, id];
    if (next.length < 2) {
      setPicked(next);
      return;
    }
    const [a, b] = next;
    const dId = link(a, b);
    setPicked([]);
    if (dId) {
      const d = c.deductions.find((x) => x.id === dId);
      setStatus({ kind: 'ok', text: `${t('notebook.deductionUnlocked')} ${d ? t(d.conclusionKey) : ''}` });
      setFails(0);
    } else {
      setStatus({ kind: 'none', text: t('notebook.linkNone') });
      setFails((n) => n + 1);
      // Dashed muted line that fades after 1.2 s (not drawn under reduced motion).
      if (!reduce && wrapRef.current) {
        const base = wrapRef.current.getBoundingClientRect();
        const ra = cardRefs.current[a]?.getBoundingClientRect();
        const rb = cardRefs.current[b]?.getBoundingClientRect();
        if (ra && rb) {
          setFailLine({ id: 'fail', failed: true, x1: ra.left - base.left + ra.width / 2, y1: ra.top - base.top + ra.height / 2, x2: rb.left - base.left + rb.width / 2, y2: rb.top - base.top + rb.height / 2 });
          setTimeout(() => setFailLine(null), 1200);
        }
      }
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="notebook">
      <AppHeader
        title={t('notebook.title')}
        onBack={home}
        trailing={
          <span className="me-2 text-xs text-fg-muted" data-testid="notebook-counter">
            {t('notebook.counter', { n: collected.length, total: c.evidence.length })}
          </span>
        }
      />
      {/* Toolbar: link mode toggle */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <button
          type="button"
          role="switch"
          aria-checked={linkMode}
          data-testid="link-mode"
          disabled={collected.length < 2 || run.phase !== 'investigating'}
          onClick={() => {
            setLinkMode((m) => !m);
            setPicked([]);
            setStatus(null);
          }}
          className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition disabled:opacity-40 ${
            linkMode ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface text-fg'
          }`}
        >
          <IconLink />
          {linkMode ? t('notebook.linkHint') : t('notebook.linkMode')}
        </button>
        {linkMode && picked.length === 1 && <span className="text-xs text-fg-muted">{t('notebook.pickSecond')}</span>}
      </div>
      <div className="sr-only" aria-live="polite">
        {status?.text}
      </div>

      <div className="paper phone-scroll flex-1" data-testid="notebook-paper">
        <div ref={wrapRef} className="relative px-5 pb-6 pt-5">
          {/* Ink lines live inside the scrolling wrapper so they stay glued to the cards. */}
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden data-testid="ink-lines">
            {lines.map((l) => (
              <g key={l.id}>
                <path data-ink={l.id} d={`M${l.x1},${l.y1} L${l.x2},${l.y2}`} fill="none" stroke="var(--accent-ink)" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 3 2 3" />
                <circle cx={l.x1} cy={l.y1} r="3" fill="var(--accent-ink)" />
                <circle cx={l.x2} cy={l.y2} r="3" fill="var(--accent-ink)" />
              </g>
            ))}
            {failLine && <path d={`M${failLine.x1},${failLine.y1} L${failLine.x2},${failLine.y2}`} fill="none" stroke="var(--fg-muted)" strokeWidth="2" strokeDasharray="4 4" opacity="0.8" />}
          </svg>

          {status && (
            <p
              data-testid={`link-status-${status.kind}`}
              className={`relative mb-4 rounded-xl px-3 py-2 text-sm ${status.kind === 'ok' ? 'bg-accent-soft text-accent-ink' : 'bg-surface-2 text-fg-muted'}`}
            >
              {status.text}
            </p>
          )}
          {showHint && (
            <p className="relative mb-4 rounded-xl border border-dashed border-border px-3 py-2 text-xs text-fg-muted" data-testid="link-hint">
              {t('notebook.hint')}
            </p>
          )}

          {collected.length === 0 ? (
            <p className="relative rounded-xl border border-dashed border-border bg-surface/60 p-4 text-center text-sm text-fg-muted">{t('notebook.empty')}</p>
          ) : (
            <ul className="relative grid grid-cols-2 gap-x-4 gap-y-6" data-testid="notebook-cards">
              {collected.map((ev, i) => {
                const idx = picked.indexOf(ev.id);
                const isOpen = expanded === ev.id;
                return (
                  <li key={ev.id} className={isOpen ? 'col-span-2' : ''}>
                    <button
                      type="button"
                      ref={(el) => {
                        cardRefs.current[ev.id] = el;
                      }}
                      data-evidence-card={ev.id}
                      aria-pressed={linkMode ? idx >= 0 : undefined}
                      aria-expanded={!linkMode ? isOpen : undefined}
                      onClick={() => onPick(ev.id)}
                      className={`note ${i % 2 === 0 ? 'note-a' : 'note-b'} ${idx >= 0 ? 'note-selected' : ''} block h-full w-full p-3 pt-4 text-start`}
                    >
                      {idx >= 0 && (
                        <span className="absolute -end-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-fg" aria-hidden>
                          {idx + 1}
                        </span>
                      )}
                      <span className="block text-[11px] text-fg-muted">{t(TOOL_LABEL[ev.tool] ?? ev.tool)}</span>
                      <span className="block text-sm font-bold leading-snug text-fg">{t(ev.titleKey)}</span>
                      <span className={`mt-1 block text-sm leading-snug text-fg-muted ${isOpen ? '' : 'line-clamp-3'}`}>{t(ev.bodyKey)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {deductions.length > 0 && (
            <section className="relative mt-8" data-testid="notebook-deductions">
              <h3 className="mb-3 text-sm font-bold text-accent-ink">{t('notebook.deductions')}</h3>
              <ul className="grid gap-4">
                {deductions.map((d) => (
                  <li key={d.id} className="note note-deduction p-3 pt-4" data-deduction={d.id}>
                    <span className="mini-stamp absolute -top-1 end-2">{t('notebook.deductionStamp')}</span>
                    <p className="pe-16 text-base font-medium leading-snug">{t(d.conclusionKey)}</p>
                    <p className={`mt-2 flex items-center gap-1 text-sm font-semibold ${d.proves === 'scam' ? 'text-scam' : 'text-legit'}`}>
                      {d.proves === 'scam' ? <IconWarning className="h-4 w-4" /> : <IconShield className="h-4 w-4" />}
                      {t('notebook.proves')} {t(d.proves === 'scam' ? 'verdict.scam' : 'verdict.legit')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-bg p-3">
        <Button className="w-full" disabled={!canVerdict} onClick={goToVerdict} data-testid="go-verdict">
          {t('notebook.goVerdict')}
        </Button>
      </div>
    </div>
  );
}

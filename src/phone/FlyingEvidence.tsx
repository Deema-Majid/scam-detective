import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { usePhone } from '@/store/phoneStore';
import { useReducedMotion } from '@/ui/useReducedMotion';

/**
 * Design §7: when evidence is added, a small paper note flies from the button
 * that was tapped to the notebook (the dock on the home screen, otherwise the
 * top corner of the phone). Pure visual feedback: it never blocks input, and
 * under reduced motion nothing moves (the "added" state of the chip is the cue).
 */
export function FlyingEvidence() {
  const flying = usePhone((s) => s.flying);
  const setFlying = usePhone((s) => s.setFlying);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!flying) return;
    if (reduce || !ref.current) {
      setFlying(null);
      return;
    }
    const phone = document.querySelector<HTMLElement>('[data-testid="phone"]');
    const source = document.querySelector<HTMLElement>(`[data-evidence-id="${flying}"] button`);
    if (!phone || !source) {
      setFlying(null);
      return;
    }
    const dock = document.querySelector<HTMLElement>('[data-testid="app-notebook"]');
    const p = phone.getBoundingClientRect();
    const s = source.getBoundingClientRect();
    const target = dock?.getBoundingClientRect();
    const endX = target ? target.left + target.width / 2 : p.right - 48;
    const endY = target ? target.top + target.height / 2 : p.top + 56;
    const el = ref.current;
    gsap.set(el, { x: s.left + s.width / 2 - 28, y: s.top + s.height / 2 - 16, opacity: 1, scale: 1, rotate: -4 });
    const tween = gsap.to(el, {
      x: endX - 28,
      y: endY - 16,
      scale: 0.45,
      rotate: 8,
      duration: 0.55,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(el, { opacity: 0 });
        if (dock) gsap.fromTo(dock, { scale: 1.06 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' });
        setFlying(null);
      },
    });
    return () => {
      tween.kill();
    };
  }, [flying, reduce, setFlying]);

  return (
    <div
      ref={ref}
      aria-hidden
      title=""
      data-testid="flying-evidence"
      className="pointer-events-none fixed left-0 top-0 z-[60] h-8 w-14 rounded-md border border-accent/60 bg-accent-soft text-center text-[10px] font-bold leading-8 text-accent-ink shadow-lg"
      style={{ opacity: 0 }}
    >
      ✎
    </div>
  );
}

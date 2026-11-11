import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from './useReducedMotion';

/**
 * Quiet backdrop behind the phone and the intro page (design §7). A handful of
 * soft "message bubble" shapes drift slowly. Written in-house with GSAP in the
 * spirit of ReactBits backgrounds (no third-party component is installed, see
 * docs/credits.md). Hidden on small screens and fully static under reduced motion.
 */
export function AmbientBackground() {
  const root = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !root.current) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 640px)', () => {
      const bubbles = root.current!.querySelectorAll<HTMLElement>('[data-bubble]');
      bubbles.forEach((b, i) => {
        gsap.to(b, {
          y: i % 2 ? -40 : 40,
          x: i % 3 ? 24 : -24,
          rotate: i % 2 ? 6 : -6,
          duration: 9 + i * 1.7,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      });
    });
    return () => mm.revert();
  }, [reduce]);

  const bubbles = [
    { left: '6%', top: '14%', w: 120, h: 64 },
    { left: '84%', top: '10%', w: 96, h: 52 },
    { left: '12%', top: '66%', w: 150, h: 72 },
    { left: '80%', top: '58%', w: 132, h: 64 },
    { left: '70%', top: '86%', w: 90, h: 48 },
    { left: '30%', top: '4%', w: 80, h: 44 },
  ];
  return (
    <div ref={root} aria-hidden className="no-print pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden sm:block">
      {bubbles.map((b, i) => (
        <span
          key={i}
          data-bubble
          className="absolute rounded-3xl border border-border bg-surface/60"
          style={{ left: b.left, top: b.top, width: b.w, height: b.h, opacity: 0.55 }}
        />
      ))}
    </div>
  );
}

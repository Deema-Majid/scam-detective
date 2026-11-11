import { useEffect } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from './useReducedMotion';

/**
 * Smooth scrolling for long pages OUTSIDE the phone (summary, family card).
 * Off under reduced motion and on narrow screens, where native scrolling is
 * better; inside the phone the screen always scrolls natively (build-plan §3).
 */
export function useLenis(enabled = true) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!enabled || reduce || typeof window === 'undefined' || window.innerWidth < 640) return;
    const lenis = new Lenis({ duration: 1.0, smoothWheel: true });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [enabled, reduce]);
}

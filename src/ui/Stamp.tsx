import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import type { Truth } from '@/engine/types';
import { useT } from '@/i18n/useT';
import { useReducedMotion } from './useReducedMotion';
import { IconShield, IconWarning } from './Icons';

/**
 * Rubber verdict stamp (design §11.3): tilted -8°, double border. When
 * `animate` is true it "prints" (scale 1.6 -> 1, 350 ms, back.out); under
 * reduced motion it just appears at its final angle.
 */
export function Stamp({ truth, animate = false, ghost = false, className = '' }: { truth: Truth; animate?: boolean; ghost?: boolean; className?: string }) {
  const { t } = useT();
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !animate || ghost) return;
    if (reduce) {
      gsap.set(el, { opacity: 1, scale: 1, rotate: -8 });
      return;
    }
    const tween = gsap.fromTo(el, { opacity: 0, scale: 1.6, rotate: -14 }, { opacity: 0.95, scale: 1, rotate: -8, duration: 0.35, ease: 'back.out(2.5)' });
    return () => {
      tween.kill();
    };
  }, [animate, ghost, reduce]);

  const label = t(truth === 'scam' ? 'verdict.scam' : 'verdict.legit');
  return (
    <span
      ref={ref}
      role={ghost ? undefined : 'img'}
      aria-hidden={ghost || undefined}
      aria-label={ghost ? undefined : t('verdict.stampLabel', { verdict: label })}
      data-testid={ghost ? 'stamp-ghost' : 'stamp'}
      className={`stamp ${ghost ? 'stamp-ghost' : ''} ${truth === 'scam' ? 'text-scam' : 'text-legit'} ${className}`}
    >
      {truth === 'scam' ? <IconWarning className="h-8 w-8" /> : <IconShield className="h-8 w-8" />}
      {label}
    </span>
  );
}

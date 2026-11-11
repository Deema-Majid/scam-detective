import { useEffect, useState } from 'react';
import { useSettings } from '@/store/settingsStore';

/**
 * True when motion should be minimal: either the OS setting
 * (prefers-reduced-motion) or the in-game "reduce motion" switch.
 * Every animation in the app checks this before moving anything.
 */
export function useReducedMotion(): boolean {
  const inGame = useSettings((s) => s.reducedMotion);
  const [os, setOs] = useState(() => matchesReduce());
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setOs(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return inGame || os;
}

export function matchesReduce(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

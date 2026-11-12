import type { ReactNode } from 'react';
import { StatusBar } from './StatusBar';
import { FlyingEvidence } from './FlyingEvidence';

/**
 * The simulated phone. On a real phone (< 640px wide) the screen fills the
 * viewport with no bezel; on larger screens it is a centered device.
 * The inner screen is the only scroll container (native scrolling, rule 3.3).
 */
export function PhoneFrame({ children, overlay }: { children: ReactNode; overlay?: ReactNode }) {
  return (
    <div
      data-testid="phone"
      className="relative flex h-dvh w-screen max-w-[560px] flex-col overflow-hidden bg-phone-screen text-fg frame:h-[min(844px,calc(100dvh-170px))] frame:w-[390px] frame:rounded-[44px] frame:border-[10px] frame:border-phone-bezel frame:shadow-[var(--shadow)]"
    >
      <StatusBar />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      {overlay}
      <FlyingEvidence />
      {/* home indicator */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-1 hidden justify-center frame:flex">
        <div className="h-1 w-28 rounded-full bg-fg/30" />
      </div>
    </div>
  );
}

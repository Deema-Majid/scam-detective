import { useEffect, useState } from 'react';
import { useSettings } from '@/store/settingsStore';

export function StatusBar() {
  const lang = useSettings((s) => s.lang);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  return (
    <div className="flex h-11 shrink-0 items-center justify-between px-6 pt-2 text-xs font-semibold text-fg" aria-hidden>
      <bdi>{time}</bdi>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full border border-current" />
        <span className="inline-block h-2.5 w-4 rounded-sm border border-current">
          <span className="block h-full w-3/4 bg-current" />
        </span>
      </div>
    </div>
  );
}

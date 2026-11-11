import { useEffect } from 'react';
import { useT } from '@/i18n/useT';
import { usePhone } from '@/store/phoneStore';

/** In-phone notification banner. Announced via aria-live; auto-dismisses. */
export function Toast() {
  const { t } = useT();
  const toast = usePhone((s) => s.toast);
  const dismiss = usePhone((s) => s.dismissToast);
  const openApp = usePhone((s) => s.openApp);
  const openThread = usePhone((s) => s.openThread);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(dismiss, 6000);
    return () => clearTimeout(id);
  }, [toast, dismiss]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-12 z-30 flex justify-center px-3" aria-live="polite" aria-atomic="true">
      {toast && (
        <button
          type="button"
          data-testid="toast"
          className="pointer-events-auto w-full max-w-[360px] rounded-2xl border border-border bg-bg-elev/95 px-4 py-3 text-start shadow-lg backdrop-blur animate-[toast-in_320ms_ease-out]"
          onClick={() => {
            openApp(toast.app);
            if (toast.threadId) openThread(toast.threadId);
            dismiss();
          }}
        >
          <div className="text-xs font-semibold text-fg-muted">{t(toast.titleKey)}</div>
          <div className="line-clamp-2 text-sm text-fg">{t(toast.bodyKey)}</div>
        </button>
      )}
      <style>{`@keyframes toast-in{0%{transform:translateY(-120%);opacity:0}70%{transform:translateY(4%)}100%{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Lang } from '@/i18n';
import type { Gender } from '@/i18n/genderMarkers';

export type Theme = 'dark' | 'light';

type SettingsState = {
  lang: Lang;
  gender: Gender;
  theme: Theme;
  sound: boolean;
  reducedMotion: boolean;
  setLang: (lang: Lang) => void;
  setGender: (g: Gender) => void;
  setTheme: (t: Theme) => void;
  setSound: (on: boolean) => void;
  setReducedMotion: (on: boolean) => void;
};

function initialLang(): Lang {
  if (typeof window === 'undefined') return 'ar';
  const q = new URLSearchParams(window.location.search).get('lang');
  return q === 'en' ? 'en' : 'ar';
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: initialLang(),
      gender: 'f',
      theme: 'dark',
      sound: false,
      reducedMotion: prefersReducedMotion(),
      setLang: (lang) => set({ lang }),
      setGender: (gender) => set({ gender }),
      setTheme: (theme) => set({ theme }),
      setSound: (sound) => set({ sound }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    }),
    {
      name: 'sd-settings',
      partialize: (s) => ({ lang: s.lang, gender: s.gender, theme: s.theme, sound: s.sound, reducedMotion: s.reducedMotion }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        // URL ?lang= wins over the stored preference so a shared link opens in the intended language.
        const urlLang = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') : null;
        return { ...current, ...p, lang: urlLang === 'en' || urlLang === 'ar' ? urlLang : (p.lang ?? current.lang) };
      },
    },
  ),
);

/** Keep <html lang dir data-theme> in sync with settings. Called once from main.tsx. */
export function bindDocumentToSettings() {
  const apply = (s: SettingsState) => {
    const root = document.documentElement;
    root.lang = s.lang;
    root.dir = s.lang === 'ar' ? 'rtl' : 'ltr';
    root.dataset.theme = s.theme;
  };
  apply(useSettings.getState());
  useSettings.subscribe(apply);
}

import type { ReactNode } from 'react';
import { useT } from '@/i18n/useT';
import { usePhone } from '@/store/phoneStore';
import { useSettings } from '@/store/settingsStore';
import { AppHeader } from '../AppHeader';
import { IconGlobe, IconMoon, IconMotion, IconPerson, IconSound, IconSun } from '@/ui/Icons';

/**
 * In-phone settings (design §11.1). Theme switches instantly through
 * useSettings().setTheme, which bindDocumentToSettings mirrors onto <html data-theme>.
 */
export function SettingsApp() {
  const { t } = useT();
  const home = usePhone((s) => s.home);
  const s = useSettings();

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="settings">
      <AppHeader title={t('settings.title')} onBack={home} />
      <div className="phone-scroll flex-1 px-4 py-4" role="region" tabIndex={0} aria-label={t('phone.scrollRegion')}>
        <SettingsGroup title={t('settings.group.appearance')}>
          <SettingsRow icon={s.theme === 'dark' ? <IconMoon /> : <IconSun />} title={t('settings.theme')} desc={t('settings.theme.desc')}>
            <Segmented
              testid="setting-theme"
              value={s.theme}
              options={[
                { value: 'light', label: t('settings.theme.light') },
                { value: 'dark', label: t('settings.theme.dark') },
              ]}
              onChange={(v) => s.setTheme(v as 'light' | 'dark')}
            />
          </SettingsRow>
          <SettingsRow icon={<IconMotion />} title={t('settings.motion')} desc={t('settings.motion.desc')}>
            <Switch testid="setting-motion" checked={s.reducedMotion} onChange={s.setReducedMotion} label={t('settings.motion')} />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title={t('settings.group.language')}>
          <SettingsRow icon={<IconGlobe />} title={t('settings.lang')} desc={t('settings.lang.desc')}>
            <Segmented
              testid="setting-lang"
              value={s.lang}
              options={[
                { value: 'ar', label: 'العربية' },
                { value: 'en', label: 'English' },
              ]}
              onChange={(v) => s.setLang(v as 'ar' | 'en')}
            />
          </SettingsRow>
          <SettingsRow icon={<IconPerson />} title={t('settings.gender')} desc={t('settings.gender.desc')}>
            <Segmented
              testid="setting-gender"
              value={s.gender}
              options={[
                { value: 'f', label: t('settings.gender.f') },
                { value: 'm', label: t('settings.gender.m') },
              ]}
              onChange={(v) => s.setGender(v as 'f' | 'm')}
            />
          </SettingsRow>
        </SettingsGroup>

        <SettingsGroup title={t('settings.group.sound')}>
          <SettingsRow icon={<IconSound />} title={t('settings.sound')} desc={t('settings.sound.desc')}>
            <Switch testid="setting-sound" checked={s.sound} onChange={s.setSound} label={t('settings.sound')} />
          </SettingsRow>
        </SettingsGroup>

        <p className="mt-6 text-center text-xs text-fg-faint">{t('settings.note')}</p>
      </div>
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">{title}</h3>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">{children}</div>
    </section>
  );
}

function SettingsRow({ icon, title, desc, children }: { icon: ReactNode; title: string; desc: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-fg-muted">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium">{title}</span>
        <span className="block truncate text-xs text-fg-muted">{desc}</span>
      </span>
      <span className="shrink-0">{children}</span>
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
  testid,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  testid: string;
}) {
  return (
    <div className="segmented" role="group" data-testid={testid}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} data-testid={`${testid}-${o.value}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ checked, onChange, label, testid }: { checked: boolean; onChange: (v: boolean) => void; label: string; testid: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} data-testid={testid} />
  );
}

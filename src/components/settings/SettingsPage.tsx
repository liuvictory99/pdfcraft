import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Sun, Moon, Monitor, Info } from 'lucide-react';

interface SettingsPageProps {
  onThemeChange: (theme: 'system' | 'light' | 'dark') => void;
  onLanguageChange: (lang: string) => void;
}

export function SettingsPage({ onThemeChange, onLanguageChange }: SettingsPageProps) {
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const [currentTheme, setCurrentTheme] = useState<'system' | 'light' | 'dark'>('system');

  const handleLangChange = (lang: string) => {
    setCurrentLang(lang);
    onLanguageChange(lang);
  };

  const handleThemeChange = (theme: 'system' | 'light' | 'dark') => {
    setCurrentTheme(theme);
    onThemeChange(theme);
  };

  const themes = [
    { key: 'system' as const, icon: Monitor, label: t('settings.themeSystem') },
    { key: 'light' as const, icon: Sun, label: t('settings.themeLight') },
    { key: 'dark' as const, icon: Moon, label: t('settings.themeDark') },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold">{t('settings.title')}</h1>

      {/* Language */}
      <section
        className="border rounded-xl p-5 space-y-3"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-medium">{t('settings.language')}</h2>
        </div>
        <div className="flex gap-3">
          {[
            { key: 'zh-CN', label: '简体中文' },
            { key: 'en-US', label: 'English' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleLangChange(key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: currentLang === key ? 'var(--color-primary)' : 'var(--color-status-bg)',
                color: currentLang === key ? 'white' : 'var(--color-text)',
                border: currentLang === key ? 'none' : '1px solid var(--color-border)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Theme */}
      <section
        className="border rounded-xl p-5 space-y-3"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-medium">{t('settings.theme')}</h2>
        </div>
        <div className="flex gap-3">
          {themes.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => handleThemeChange(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: currentTheme === key ? 'var(--color-primary)' : 'var(--color-status-bg)',
                color: currentTheme === key ? 'white' : 'var(--color-text)',
                border: currentTheme === key ? 'none' : '1px solid var(--color-border)',
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* About */}
      <section
        className="border rounded-xl p-5 space-y-3"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-medium">{t('settings.about')}</h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {t('settings.aboutDesc')}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {t('settings.version', { version: '0.1.0' })}
        </p>
      </section>
    </div>
  );
}

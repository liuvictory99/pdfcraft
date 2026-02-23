import { useTranslation } from 'react-i18next';
import { FileText, BookOpen, Settings } from 'lucide-react';
import type { PageView } from '../../types';

interface SidebarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
}

const navItems: Array<{ key: PageView; icon: typeof FileText; labelKey: string }> = [
  { key: 'merge', icon: FileText, labelKey: 'nav.merge' },
  { key: 'convert', icon: BookOpen, labelKey: 'nav.convert' },
  { key: 'settings', icon: Settings, labelKey: 'nav.settings' },
];

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { t } = useTranslation();

  return (
    <aside
      className="w-56 flex flex-col border-r shrink-0"
      style={{
        backgroundColor: 'var(--color-sidebar-bg)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* App Logo */}
      <div
        className="h-14 flex items-center px-5 border-b font-bold text-lg tracking-tight"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
      >
        <FileText className="w-5 h-5 mr-2" />
        PDFCraft
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-1">
        {navItems.map(({ key, icon: Icon, labelKey }) => {
          const isActive = currentPage === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: isActive ? 'var(--color-sidebar-active)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}
            >
              <Icon className="w-4 h-4" />
              {t(labelKey)}
            </button>
          );
        })}
      </nav>

      {/* Version */}
      <div
        className="px-5 py-3 text-xs border-t"
        style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
      >
        v0.1.0
      </div>
    </aside>
  );
}

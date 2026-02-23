import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { MergePage } from './components/merge/MergePage';
import { ConvertPage } from './components/convert/ConvertPage';
import { SettingsPage } from './components/settings/SettingsPage';
import type { PageView } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('merge');
  const [statusMessage, setStatusMessage] = useState('status.ready');
  const { i18n } = useTranslation();

  const handleThemeChange = (theme: 'system' | 'light' | 'dark') => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'merge':
        return <MergePage onStatusChange={setStatusMessage} />;
      case 'convert':
        return <ConvertPage onStatusChange={setStatusMessage} />;
      case 'settings':
        return (
          <SettingsPage
            onThemeChange={handleThemeChange}
            onLanguageChange={(lang) => i18n.changeLanguage(lang)}
          />
        );
      default:
        return <MergePage onStatusChange={setStatusMessage} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden"
         style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </div>
        <StatusBar message={statusMessage} />
      </main>
    </div>
  );
}

export default App;

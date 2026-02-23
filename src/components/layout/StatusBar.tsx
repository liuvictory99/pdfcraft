import { useTranslation } from 'react-i18next';

interface StatusBarProps {
  message: string;
}

export function StatusBar({ message }: StatusBarProps) {
  const { t } = useTranslation();

  return (
    <footer
      className="h-8 flex items-center justify-between px-4 border-t text-xs shrink-0"
      style={{
        backgroundColor: 'var(--color-status-bg)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-secondary)',
      }}
    >
      <span>{t(message)}</span>
      <span>PDFCraft v0.1.0</span>
    </footer>
  );
}

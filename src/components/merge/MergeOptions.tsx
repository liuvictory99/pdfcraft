import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface MergeOptionsProps {
  keepBookmarks: boolean;
  onKeepBookmarksChange: (val: boolean) => void;
  pageSize: 'original' | 'a4' | 'letter';
  onPageSizeChange: (val: 'original' | 'a4' | 'letter') => void;
  outputPath: string;
  onOutputPathChange: (val: string) => void;
  onMerge: () => void;
  isMerging: boolean;
}

export function MergeOptions({
  keepBookmarks,
  onKeepBookmarksChange,
  pageSize,
  onPageSizeChange,
  outputPath,
  onOutputPathChange,
  onMerge,
  isMerging,
}: MergeOptionsProps) {
  const { t } = useTranslation();

  const handleBrowse = async () => {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const path = await save({
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
        defaultPath: 'merged.pdf',
      });
      if (path) {
        onOutputPathChange(path);
      }
    } catch {
      // Non-Tauri fallback
      onOutputPathChange('merged.pdf');
    }
  };

  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Bookmarks */}
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={keepBookmarks}
          onChange={(e) => onKeepBookmarksChange(e.target.checked)}
          className="rounded accent-[var(--color-primary)]"
        />
        {t('merge.keepBookmarks')}
      </label>

      {/* Page Size */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('merge.pageSize')}</label>
        <div className="flex gap-3">
          {(['original', 'a4', 'letter'] as const).map((size) => (
            <label key={size} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="radio"
                name="pageSize"
                checked={pageSize === size}
                onChange={() => onPageSizeChange(size)}
                className="accent-[var(--color-primary)]"
              />
              {t(`merge.pageSize${size.charAt(0).toUpperCase() + size.slice(1)}`)}
            </label>
          ))}
        </div>
      </div>

      {/* Output Path */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('merge.outputPath')}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={outputPath}
            onChange={(e) => onOutputPathChange(e.target.value)}
            placeholder="merged.pdf"
            className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
          />
          <button
            onClick={handleBrowse}
            className="px-3 py-1.5 rounded-lg border text-sm cursor-pointer hover:bg-black/5 transition-colors"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {t('merge.browse')}
          </button>
        </div>
      </div>

      {/* Merge Button */}
      <button
        onClick={onMerge}
        disabled={isMerging}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {isMerging ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('merge.merging')}
          </>
        ) : (
          t('merge.mergePdf')
        )}
      </button>
    </div>
  );
}

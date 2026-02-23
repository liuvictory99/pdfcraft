import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { ProgressBar } from '../common/ProgressBar';
import type { OutputFormat, LayoutMode, ConversionProgress } from '../../types';

interface ConvertPageProps {
  onStatusChange: (status: string) => void;
}

const OUTPUT_FORMATS: Array<{ value: OutputFormat; label: string }> = [
  { value: 'epub', label: 'EPUB' },
  { value: 'mobi', label: 'MOBI' },
  { value: 'azw3', label: 'AZW3' },
  { value: 'txt', label: 'TXT' },
  { value: 'md', label: 'Markdown' },
  { value: 'docx', label: 'DOCX' },
  { value: 'fb2', label: 'FB2' },
];

import { Trans } from 'react-i18next';

export function ConvertPage({ onStatusChange }: ConvertPageProps) {
  const { t } = useTranslation();

  const [inputFile, setInputFile] = useState<{ name: string; path: string; size: number } | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('epub');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('reflow');
  const [ocrEnabled, setOcrEnabled] = useState(true);
  const [ocrLanguages, setOcrLanguages] = useState<string[]>(['chi_sim', 'eng']);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [keepImages, setKeepImages] = useState(false);
  const [detectTables, setDetectTables] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [outputPath, setOutputPath] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [calibreInstalled, setCalibreInstalled] = useState<boolean | null>(null);

  // Check if Calibre is installed on mount
  useState(() => {
    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke<boolean>('check_calibre_installed')
        .then(setCalibreInstalled)
        .catch(() => setCalibreInstalled(false));
    });
  });

  const handleSelectFile = useCallback(async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: false,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (selected) {
        const rawSelected = selected as unknown;
        const path = typeof rawSelected === 'string' ? rawSelected : (rawSelected as { path: string }).path;
        const name = path.split('/').pop() || path;
        setInputFile({ name, path, size: 0 });
        setBookTitle(name.replace('.pdf', ''));
      }
    } catch {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf';
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          setInputFile({ name: file.name, path: file.name, size: file.size });
          setBookTitle(file.name.replace('.pdf', ''));
        }
      };
      input.click();
    }
  }, []);

  const handleDropFiles = useCallback((files: File[]) => {
    const file = files[0];
    if (file) {
      setInputFile({
        name: file.name,
        path: (file as unknown as { path?: string }).path || file.name,
        size: file.size,
      });
      setBookTitle(file.name.replace('.pdf', ''));
    }
  }, []);

  const handleBrowseOutput = useCallback(async () => {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const path = await save({
        filters: [{ name: outputFormat.toUpperCase(), extensions: [outputFormat] }],
        defaultPath: `${bookTitle || 'output'}.${outputFormat}`,
      });
      if (path) setOutputPath(path);
    } catch {
      setOutputPath(`${bookTitle || 'output'}.${outputFormat}`);
    }
  }, [outputFormat, bookTitle]);

  const handleConvert = useCallback(async () => {
    if (!inputFile) return;
    setIsConverting(true);
    setProgress({ taskId: '', percent: 0, stage: 'analyzing', message: t('convert.progress.analyzing') });
    onStatusChange('status.processing');

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('convert_pdf_to_ebook', {
        config: {
          input_path: inputFile.path,
          output_path: outputPath || `${bookTitle || 'output'}.${outputFormat}`,
          output_format: outputFormat,
          layout_mode: layoutMode,
          ocr: { enabled: ocrEnabled, languages: ocrLanguages },
          metadata: { title: bookTitle, author: bookAuthor, cover_path: null },
          keep_images: keepImages,
          detect_tables: detectTables,
          font_size: fontSize,
        },
      });
      setProgress({ taskId: '', percent: 100, stage: 'done', message: t('convert.convertSuccess') });
      onStatusChange('status.completed');
    } catch (err) {
      console.error('Convert failed:', err);
      onStatusChange('status.failed');
    } finally {
      setIsConverting(false);
    }
  }, [inputFile, outputPath, bookTitle, bookAuthor, outputFormat, layoutMode, ocrEnabled, ocrLanguages, keepImages, detectTables, fontSize, onStatusChange, t]);

  const toggleOcrLang = (lang: string) => {
    setOcrLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const needsCalibre = ['mobi', 'azw3', 'docx', 'fb2'].includes(outputFormat);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <h1 className="text-xl font-bold">{t('convert.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: File Input */}
        <div className="space-y-4">
          <DropZone
            onFilesDropped={handleDropFiles}
            activeLabel={t('merge.dropActive')}
            className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer min-h-[240px] transition-colors"
          >
            <div className="text-center" onClick={handleSelectFile}>
              {inputFile ? (
                <>
                  <FileText className="w-16 h-16 mx-auto mb-3" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-sm font-medium">{inputFile.name}</p>
                  {inputFile.size > 0 && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      {(inputFile.size / 1048576).toFixed(1)} MB
                    </p>
                  )}
                </>
              ) : (
                <>
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {t('convert.dropHint')}
                  </p>
                </>
              )}
            </div>
          </DropZone>
        </div>

        {/* Right: Options */}
        <div
          className="border rounded-xl p-5 space-y-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {/* Output Format */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('convert.outputFormat')}</label>
            <div className="flex flex-wrap gap-2">
              {OUTPUT_FORMATS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setOutputFormat(value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  style={{
                    backgroundColor: outputFormat === value ? 'var(--color-primary)' : 'var(--color-status-bg)',
                    color: outputFormat === value ? 'white' : 'var(--color-text)',
                    border: outputFormat === value ? 'none' : '1px solid var(--color-border)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Layout Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('convert.layoutMode')}</label>
            <div className="flex gap-3">
              {(['reflow', 'fixed'] as const).map((mode) => (
                <label key={mode} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="layout"
                    checked={layoutMode === mode}
                    onChange={() => setLayoutMode(mode)}
                    className="accent-[var(--color-primary)]"
                  />
                  {t(`convert.layout${mode.charAt(0).toUpperCase() + mode.slice(1)}`)}
                </label>
              ))}
            </div>
          </div>

          {/* OCR */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={ocrEnabled}
                onChange={(e) => setOcrEnabled(e.target.checked)}
                className="accent-[var(--color-primary)]"
              />
              {t('convert.ocrAuto')}
            </label>
            {ocrEnabled && (
              <div className="flex gap-2 ml-6">
                {[
                  { key: 'chi_sim', label: t('convert.langChineseSimplified') },
                  { key: 'eng', label: t('convert.langEnglish') },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ocrLanguages.includes(key)}
                      onChange={() => toggleOcrLang(key)}
                      className="accent-[var(--color-primary)]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('convert.metadata')}</label>
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder={t('convert.bookTitle')}
              className="w-full px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
            <input
              type="text"
              value={bookAuthor}
              onChange={(e) => setBookAuthor(e.target.value)}
              placeholder={t('convert.bookAuthor')}
              className="w-full px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
            />
          </div>

          {/* Advanced */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-sm cursor-pointer"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {t('convert.advanced')}
            </button>
            {showAdvanced && (
              <div className="mt-2 ml-5 space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={keepImages} onChange={(e) => setKeepImages(e.target.checked)} className="accent-[var(--color-primary)]" />
                  {t('convert.keepImages')}
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={detectTables} onChange={(e) => setDetectTables(e.target.checked)} className="accent-[var(--color-primary)]" />
                  {t('convert.detectTables')}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{t('convert.fontSize')}</span>
                  {(['small', 'medium', 'large'] as const).map((s) => (
                    <label key={s} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input type="radio" name="fontSize" checked={fontSize === s} onChange={() => setFontSize(s)} className="accent-[var(--color-primary)]" />
                      {t(`convert.font${s.charAt(0).toUpperCase() + s.slice(1)}`)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Output Path */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('convert.outputPath')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={outputPath}
                onChange={(e) => setOutputPath(e.target.value)}
                placeholder={`output.${outputFormat}`}
                className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
              <button
                onClick={handleBrowseOutput}
                className="px-3 py-1.5 rounded-lg border text-sm cursor-pointer hover:bg-black/5 transition-colors"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {t('convert.browse')}
              </button>
            </div>
          </div>

          {/* Calibre Warning */}
          {needsCalibre && calibreInstalled === false && (
            <div className="p-3 rounded-lg text-sm bg-yellow-50 text-yellow-800 border border-yellow-200">
              <p className="font-medium mb-1">{t('convert.calibreRequired')}</p>
              <p className="text-yellow-700 text-xs">
                <Trans i18nKey="convert.calibreDesc" values={{ format: outputFormat.toUpperCase() }}>
                  To convert to {outputFormat.toUpperCase()}, you must install the free <a href="https://calibre-ebook.com/download" target="_blank" rel="noreferrer" className="underline font-medium hover:text-yellow-900">Calibre</a> software. PDFCraft uses its engine for this format.
                </Trans>
              </p>
            </div>
          )}

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={!inputFile || isConverting || (needsCalibre && calibreInstalled === false)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('convert.converting')}
              </>
            ) : (
              t('convert.startConvert')
            )}
          </button>
        </div>
      </div>

      {/* Progress */}
      {progress && progress.percent > 0 && progress.percent < 100 && (
        <ProgressBar percent={progress.percent} message={progress.message} />
      )}
      {progress && progress.percent === 100 && (
        <div
          className="text-center py-3 rounded-lg text-sm font-medium"
          style={{ backgroundColor: '#f0fdf4', color: 'var(--color-success)' }}
        >
          {t('convert.convertSuccess')}
        </div>
      )}
    </div>
  );
}

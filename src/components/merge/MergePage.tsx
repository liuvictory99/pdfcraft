import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Trash2, ArrowUpDown } from 'lucide-react';
import { DropZone } from '../common/DropZone';
import { SortableFileItem } from './SortableFileItem';
import { MergeOptions } from './MergeOptions';
import type { PdfFileEntry } from '../../types';

interface MergePageProps {
  onStatusChange: (status: string) => void;
}

let fileIdCounter = 0;

export function MergePage({ onStatusChange }: MergePageProps) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<PdfFileEntry[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [keepBookmarks, setKeepBookmarks] = useState(true);
  const [pageSize, setPageSize] = useState<'original' | 'a4' | 'letter'>('original');
  const [outputPath, setOutputPath] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addFiles = useCallback((droppedFiles: File[]) => {
    const newEntries: PdfFileEntry[] = droppedFiles.map((f) => ({
      id: `file-${++fileIdCounter}`,
      name: f.name,
      path: (f as unknown as { path?: string }).path || f.name,
      pageCount: 0,
      fileSize: f.size,
    }));
    setFiles((prev) => [...prev, ...newEntries]);
  }, []);

  const handleAddClick = useCallback(async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: true,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (selected) {
        const rawPaths = Array.isArray(selected) ? selected : [selected];
        const newEntries: PdfFileEntry[] = rawPaths.map((p: unknown) => {
          const filePath = typeof p === 'string' ? p : (p as { path: string }).path;
          const fileName = filePath.split('/').pop() || filePath;
          return {
            id: `file-${++fileIdCounter}`,
            name: fileName,
            path: filePath,
            pageCount: 0,
            fileSize: 0,
          };
        });
        setFiles((prev) => [...prev, ...newEntries]);
      }
    } catch {
      // Fallback: use input element for non-Tauri env
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf';
      input.multiple = true;
      input.onchange = () => {
        if (input.files) {
          addFiles(Array.from(input.files));
        }
      };
      input.click();
    }
  }, [addFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const sortByName = useCallback(() => {
    setFiles((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const reverseOrder = useCallback(() => {
    setFiles((prev) => [...prev].reverse());
  }, []);

  const handleMerge = useCallback(async () => {
    if (files.length < 2) return;
    setIsMerging(true);
    onStatusChange('status.processing');

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('merge_pdfs', {
        config: {
          files: files.map((f) => ({ path: f.path, selected_pages: null })),
          output_path: outputPath || 'merged.pdf',
          keep_bookmarks: keepBookmarks,
          page_size: pageSize,
        },
      });
      onStatusChange('status.completed');
    } catch (err) {
      console.error('Merge failed:', err);
      onStatusChange('status.failed');
    } finally {
      setIsMerging(false);
    }
  }, [files, outputPath, keepBookmarks, pageSize, onStatusChange]);

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('merge.title')}</h1>
        <div className="flex gap-2">
          <button
            onClick={handleAddClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white cursor-pointer transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Plus className="w-4 h-4" />
            {t('merge.addFiles')}
          </button>
          {files.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors"
              style={{ color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}
            >
              <Trash2 className="w-4 h-4" />
              {t('merge.clearAll')}
            </button>
          )}
        </div>
      </div>

      {/* Drop Zone / File List */}
      {files.length === 0 ? (
        <DropZone
          onFilesDropped={addFiles}
          activeLabel={t('merge.dropActive')}
          className="border-2 border-dashed rounded-xl p-16 flex items-center justify-center cursor-pointer transition-colors"
        >
          <div className="text-center" onClick={handleAddClick}>
            <FileIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {t('merge.dropHint')}
            </p>
          </div>
        </DropZone>
      ) : (
        <DropZone
          onFilesDropped={addFiles}
          activeLabel={t('merge.dropActive')}
          className="border rounded-xl overflow-hidden transition-colors"
          >
          {/* Sort Controls */}
          <div
            className="flex items-center gap-2 px-4 py-2 border-b text-xs"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-status-bg)' }}
          >
            <ArrowUpDown className="w-3.5 h-3.5" style={{ color: 'var(--color-text-secondary)' }} />
            <button onClick={sortByName} className="hover:underline cursor-pointer"
                    style={{ color: 'var(--color-text-secondary)' }}>
              {t('merge.sortByName')}
            </button>
            <span style={{ color: 'var(--color-border)' }}>|</span>
            <button onClick={reverseOrder} className="hover:underline cursor-pointer"
                    style={{ color: 'var(--color-text-secondary)' }}>
              {t('merge.reverse')}
            </button>
            <span className="ml-auto" style={{ color: 'var(--color-text-secondary)' }}>
              {t('merge.fileCount', { count: files.length })}
              {totalPages > 0 && ` / ${t('merge.totalPages', { count: totalPages })}`}
            </span>
          </div>

          {/* Sortable List */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={files.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {files.map((file, index) => (
                  <SortableFileItem
                    key={file.id}
                    file={file}
                    index={index}
                    onRemove={removeFile}
                    formatSize={formatSize}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </DropZone>
      )}

      {/* Merge Options */}
      {files.length >= 2 && (
        <MergeOptions
          keepBookmarks={keepBookmarks}
          onKeepBookmarksChange={setKeepBookmarks}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          outputPath={outputPath}
          onOutputPathChange={setOutputPath}
          onMerge={handleMerge}
          isMerging={isMerging}
        />
      )}
    </div>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PdfFileEntry } from '../../types';

interface SortableFileItemProps {
  file: PdfFileEntry;
  index: number;
  onRemove: (id: string) => void;
  formatSize: (bytes: number) => string;
}

export function SortableFileItem({ file, index, onRemove, formatSize }: SortableFileItemProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? 'var(--color-primary-light)' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 group"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-black/5"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Index */}
      <span
        className="w-6 h-6 flex items-center justify-center rounded text-xs font-medium shrink-0"
        style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
      >
        {index + 1}
      </span>

      {/* Thumbnail placeholder */}
      <div
        className="w-10 h-12 rounded border flex items-center justify-center shrink-0"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-status-bg)' }}
      >
        {file.thumbnail ? (
          <img src={file.thumbnail} alt="" className="w-full h-full object-cover rounded" />
        ) : (
          <FileText className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {file.pageCount > 0 ? t('merge.pages', { count: file.pageCount }) : ''}
          {file.pageCount > 0 && file.fileSize > 0 ? ' | ' : ''}
          {file.fileSize > 0 ? formatSize(file.fileSize) : ''}
        </p>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(file.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-opacity cursor-pointer hover:bg-black/5"
        style={{ color: 'var(--color-danger)' }}
        title={t('merge.removeFile')}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

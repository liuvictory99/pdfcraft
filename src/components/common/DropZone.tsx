import { useCallback, useState, type DragEvent, type ReactNode } from 'react';

interface DropZoneProps {
  onFilesDropped: (files: File[]) => void;
  accept?: string;
  children: ReactNode;
  activeLabel?: string;
  className?: string;
}

export function DropZone({
  onFilesDropped,
  accept = '.pdf',
  children,
  activeLabel,
  className = '',
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return accept
          .split(',')
          .map((a) => a.trim().replace('.', ''))
          .includes(ext || '');
      });

      if (droppedFiles.length > 0) {
        onFilesDropped(droppedFiles);
      }
    },
    [onFilesDropped, accept],
  );

  return (
    <div
      className={`${className} ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && activeLabel ? (
        <div className="flex items-center justify-center h-full text-sm font-medium"
             style={{ color: 'var(--color-primary)' }}>
          {activeLabel}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

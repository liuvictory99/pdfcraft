interface ProgressBarProps {
  percent: number;
  message?: string;
  className?: string;
}

export function ProgressBar({ percent, message, className = '' }: ProgressBarProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent));

  return (
    <div className={`w-full ${className}`}>
      <div
        className="w-full h-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-border)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${clampedPercent}%`,
            backgroundColor: 'var(--color-primary)',
          }}
        />
      </div>
      {message && (
        <div className="flex justify-between mt-1.5 text-xs"
             style={{ color: 'var(--color-text-secondary)' }}>
          <span>{message}</span>
          <span>{clampedPercent}%</span>
        </div>
      )}
    </div>
  );
}

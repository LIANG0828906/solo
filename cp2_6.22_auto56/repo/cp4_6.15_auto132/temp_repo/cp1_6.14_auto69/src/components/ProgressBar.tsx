import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  className?: string;
}

export default function ProgressBar({ value, className }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('progress-bar-container', className)}>
      <div
        className="progress-bar-fill"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  target: number;
  label?: string;
}

export default function ProgressBar({ current, target, label }: ProgressBarProps) {
  const ratio = target > 0 ? current / target : 0;
  const percentage = Math.min(ratio * 100, 110);
  const isOverLimit = ratio > 1.1;

  const { value: displayedCurrent } = useCountUp(Math.round(current), { duration: 1500, decimals: 0 });
  const { value: displayedPercentage } = useCountUp(Math.round(percentage), { duration: 1500, decimals: 0 });

  const getGradient = (pct: number) => {
    if (pct <= 0) return '#FF5252';
    if (pct >= 100) return '#7CB342';
    const t = pct / 100;
    const r = Math.round(255 + (124 - 255) * t);
    const g = Math.round(82 + (179 - 82) * t);
    const b = Math.round(82 + (66 - 82) * t);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const fillColor = isOverLimit ? '#FF5252' : getGradient(displayedPercentage);
  const barWidth = `${Math.min(displayedPercentage, 110)}%`;

  return (
    <div className="w-full">
      {label && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold" style={{ color: fillColor }}>
              {displayedCurrent}
            </span>
            <span className="text-xs text-gray-500">/ {target} kcal</span>
          </div>
        </div>
      )}
      <div
        className={cn(
          'relative w-full overflow-hidden bg-gray-200',
          isOverLimit && 'animate-pulse'
        )}
        style={{ height: '20px', borderRadius: '10px' }}
      >
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: barWidth,
            background: isOverLimit
              ? '#FF5252'
              : `linear-gradient(90deg, #FF5252 0%, ${fillColor} 100%)`,
            borderRadius: '10px',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              'text-xs font-semibold',
              displayedPercentage > 50 ? 'text-white' : 'text-gray-700'
            )}
          >
            {displayedPercentage}%
          </span>
        </div>
      </div>
    </div>
  );
}

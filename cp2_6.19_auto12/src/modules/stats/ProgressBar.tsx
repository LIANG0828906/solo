import React from 'react';
import { getAccuracyColor } from './AnswerAggregator';

interface ProgressBarProps {
  accuracyRate: number;
  showLabel?: boolean;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  accuracyRate,
  showLabel = true,
  height = 24,
}) => {
  const color = getAccuracyColor(accuracyRate);
  const percentage = Math.round(accuracyRate * 100);

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex-1 bg-gray-200 rounded-full overflow-hidden relative"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showLabel && (
        <span
          className="text-sm font-semibold min-w-[48px] text-right"
          style={{ color }}
        >
          {percentage}%
        </span>
      )}
    </div>
  );
};

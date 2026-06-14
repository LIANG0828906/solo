import React from 'react';

interface BudgetProgressProps {
  budget: number;
  spent: number;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const interpolateColor = (progress: number): string => {
  const color1 = hexToRgb('#10b981');
  const color2 = hexToRgb('#f59e0b');
  const color3 = hexToRgb('#ef4444');

  if (progress <= 0.5) {
    const t = progress / 0.5;
    return rgbToHex(
      color1.r + (color2.r - color1.r) * t,
      color1.g + (color2.g - color1.g) * t,
      color1.b + (color2.b - color1.b) * t,
    );
  } else {
    const t = (progress - 0.5) / 0.5;
    return rgbToHex(
      color2.r + (color3.r - color2.r) * t,
      color2.g + (color3.g - color2.g) * t,
      color2.b + (color3.b - color2.b) * t,
    );
  }
};

const BudgetProgress: React.FC<BudgetProgressProps> = ({ budget, spent }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(spent / budget, 1);
  const displayProgress = spent / budget;
  const offset = circumference * (1 - progress);
  const color = interpolateColor(Math.min(displayProgress, 1));
  const isOverBudget = spent > budget;

  let statusText = '在预算内';
  let statusColor = '#10b981';

  if (displayProgress >= 1) {
    statusText = '已超支';
    statusColor = '#ef4444';
  } else if (displayProgress >= 0.8) {
    statusText = '即将超支';
    statusColor = '#f59e0b';
  }

  return (
    <div className="flex items-center gap-4 sm:gap-6 w-full max-w-sm mx-auto">
      <div
        className={`relative flex-shrink-0 rounded-full ${isOverBudget ? 'glow-red' : ''}`}
        style={{ width: 100, height: 100 }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-semibold text-gray-800 leading-tight">
            ¥{spent.toLocaleString()}
          </span>
          <span className="text-xs text-gray-500 leading-tight">
            /¥{budget.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col justify-center min-w-0 flex-1">
        <span className="text-xl sm:text-2xl font-bold" style={{ color }}>
          {Math.round(displayProgress * 100)}%
        </span>
        <span
          className="text-sm font-medium mt-1"
          style={{ color: statusColor }}
        >
          {statusText}
        </span>
      </div>
    </div>
  );
};

export default BudgetProgress;

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Color } from '@/types';
import { getContrastColor } from '@/utils/colorUtils';

interface ColorCardProps {
  color: Color;
  onClick?: () => void;
  isLocked?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32'
};

const tooltipSizeClasses = {
  sm: 'w-32',
  md: 'w-40',
  lg: 'w-48'
};

export default function ColorCard({
  color,
  onClick,
  isLocked = false,
  showTooltip = true,
  size = 'md'
}: ColorCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const textColor = getContrastColor(color.hex);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 400);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onClick={handleClick}
        className={cn(
          'relative flex items-center justify-center rounded-lg cursor-pointer select-none transition-transform',
          sizeClasses[size],
          isLocked && 'border-2 border-solid border-current',
          isAnimating && 'animate-bounce-click'
        )}
        style={{
          backgroundColor: color.hex,
          color: textColor
        }}
      >
        {isLocked && (
          <Lock className="w-5 h-5" style={{ color: textColor }} />
        )}
      </div>

      {showTooltip && isHovered && (
        <div
          className={cn(
            'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-lg bg-gray-900 dark:bg-gray-100 shadow-xl pointer-events-none',
            tooltipSizeClasses[size]
          )}
        >
          <div
            className={cn(
              'w-full rounded-md mb-2',
              size === 'sm' ? 'h-12' : size === 'md' ? 'h-16' : 'h-20'
            )}
            style={{ backgroundColor: color.hex }}
          />
          <div className="text-xs text-white dark:text-gray-900 space-y-1 font-mono">
            <div className="flex justify-between">
              <span>HEX</span>
              <span className="font-semibold">{color.hex.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>HSL</span>
              <span className="font-semibold">
                H: {color.hsl.h}°, S: {color.hsl.s}%, L: {color.hsl.l}%
              </span>
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-gray-900 dark:bg-gray-100" />
        </div>
      )}
    </div>
  );
}

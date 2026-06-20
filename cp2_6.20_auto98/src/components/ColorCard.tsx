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
  showHSLBar?: boolean;
  compact?: boolean;
}

const sizeClasses = {
  sm: 'w-14 h-14',
  md: 'w-20 h-20',
  lg: 'w-28 h-28'
};

const previewSizeClasses = {
  sm: 'h-16',
  md: 'h-24',
  lg: 'h-32'
};

const tooltipWidthClasses = {
  sm: 'w-48',
  md: 'w-56',
  lg: 'w-64'
};

export default function ColorCard({
  color,
  onClick,
  isLocked = false,
  showTooltip = true,
  size = 'md',
  showHSLBar = false,
  compact = false
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
      className={cn(
        'relative inline-flex flex-col',
        compact ? 'gap-0.5' : 'gap-1'
      )}
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
          <Lock className="w-4 h-4 md:w-5 md:h-5" style={{ color: textColor }} />
        )}
      </div>

      {showHSLBar && (
        <div className={cn(
          'text-[9px] md:text-[10px] font-mono leading-tight text-center text-[var(--text-secondary)]',
          compact ? 'px-0' : 'px-0.5'
        )}>
          <div className="flex justify-center gap-1 md:gap-1.5 whitespace-nowrap">
            <span className="opacity-80">H{color.hsl.h}°</span>
            <span className="opacity-60">S{color.hsl.s}%</span>
            <span className="opacity-80">L{color.hsl.l}%</span>
          </div>
        </div>
      )}

      {showTooltip && isHovered && (
        <div
          className={cn(
            'absolute z-50 bottom-full left-1/2 -translate-x-1/2 p-3 rounded-xl bg-gray-900 dark:bg-gray-100 shadow-2xl pointer-events-none',
            tooltipWidthClasses[size],
            showHSLBar ? 'mb-6' : 'mb-3'
          )}
        >
          <div
            className={cn(
              'relative w-full rounded-lg mb-3 overflow-hidden',
              previewSizeClasses[size]
            )}
            style={{ backgroundColor: color.hex }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-black/40 dark:bg-black/30" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/40 dark:bg-black/30" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-3 h-3 rounded-full border-2 border-black/60 dark:border-black/40 bg-transparent" />
              </div>
            </div>
          </div>
          <div className="text-[11px] md:text-xs text-white dark:text-gray-900 space-y-1.5 font-mono">
            <div className="flex justify-between items-center">
              <span className="opacity-70">HEX</span>
              <span className="font-bold tracking-wide">{color.hex.toUpperCase()}</span>
            </div>
            <div className="h-px bg-white/15 dark:bg-gray-900/15" />
            <div className="flex justify-between items-center">
              <span className="opacity-70">H</span>
              <span className="font-semibold">{color.hsl.h}°</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-70">S</span>
              <span className="font-semibold">{color.hsl.s}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-70">L</span>
              <span className="font-semibold">{color.hsl.l}%</span>
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-gray-900 dark:bg-gray-100" />
        </div>
      )}
    </div>
  );
}

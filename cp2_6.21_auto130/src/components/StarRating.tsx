import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  allowHalf?: boolean;
}

const SIZE_MAP = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

export default function StarRating({
  value,
  max = 5,
  onChange,
  readOnly = false,
  size = 'md',
  className,
  allowHalf = false,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [halfHover, setHalfHover] = useState(false);
  const displayValue = hover ?? value;
  const sizeClass = SIZE_MAP[size];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (readOnly || !allowHalf) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeft = e.clientX - rect.left < rect.width / 2;
    setHalfHover(isLeft);
    setHover(isLeft ? index - 0.5 : index);
  };

  const handleClick = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onChange) return;
    if (allowHalf) {
      const rect = e.currentTarget.getBoundingClientRect();
      const isLeft = e.clientX - rect.left < rect.width / 2;
      onChange(isLeft ? index - 0.5 : index);
    } else {
      onChange(index);
    }
  };

  return (
    <div
      role={readOnly ? undefined : 'radiogroup'}
      aria-label={readOnly ? `${value} out of ${max} stars` : 'rating'}
      aria-roledescription={readOnly ? undefined : 'rating'}
      className={cn(
        'inline-flex items-center gap-0.5 select-none',
        !readOnly && 'cursor-pointer',
        className
      )}
      onMouseLeave={() => {
        setHover(null);
        setHalfHover(false);
      }}
    >
      {Array.from({ length: max }, (_, i) => {
        const index = i + 1;
        const isFilled = displayValue >= index;
        const isHalf = !isFilled && allowHalf && displayValue >= index - 0.5;

        return (
          <div
            key={i}
            role={readOnly ? undefined : 'radio'}
            aria-checked={readOnly ? undefined : value === index}
            aria-label={readOnly ? undefined : `${index} stars`}
            className={cn(
              'relative transition-transform duration-150',
              !readOnly && 'hover:scale-110 active:scale-95',
              hover === index && !readOnly && 'scale-110',
              !halfHover && hover === index - 0.5 && !readOnly && 'scale-110'
            )}
            onClick={(e) => handleClick(index, e)}
            onMouseMove={(e) => handleMouseMove(e, index)}
            onMouseEnter={() => {
              if (!readOnly && !allowHalf) setHover(index);
            }}
          >
            <Star
              className={cn(
                sizeClass,
                'transition-all duration-150',
                isFilled || isHalf
                  ? 'text-primary'
                  : 'text-gray-300 hover:text-primary/40'
              )}
              fill={isFilled ? 'currentColor' : isHalf ? 'url(#half-star-gradient)' : 'none'}
            />
            {isHalf && (
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 24 24" aria-hidden>
                <defs>
                  <linearGradient id="half-star-gradient">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            )}
            {isHalf && !isFilled && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                <Star className={cn(sizeClass, 'text-primary')} fill="currentColor" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

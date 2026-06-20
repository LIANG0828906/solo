import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: number;
  onChange?: (val: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showValue?: boolean;
  count?: number;
}

const sizeMap = { sm: 14, md: 18, lg: 24 };

export default function StarRating({ value, onChange, size = 'md', readonly = false, showValue = false, count }: Props) {
  const sz = sizeMap[size];
  const stars = [1, 2, 3, 4, 5];
  const handleClick = (n: number) => {
    if (readonly) return;
    onChange?.(n);
  };
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {stars.map((n) => {
          const filled = value >= n;
          const half = !filled && value >= n - 0.5;
          return (
            <button
              key={n}
              type="button"
              onClick={() => handleClick(n)}
              disabled={readonly}
              className={cn(
                'transition-transform',
                !readonly && 'hover:scale-115 cursor-pointer',
                readonly && 'cursor-default'
              )}
              style={{ width: sz + 2, height: sz + 2 }}
            >
              <Star
                size={sz}
                className={cn(
                  'transition-colors',
                  filled ? 'fill-amber-400 text-amber-400 stroke-amber-400'
                    : half ? 'fill-amber-200/60 text-amber-400 stroke-amber-400'
                    : 'fill-transparent text-slate-300 stroke-slate-300'
                )}
                strokeWidth={2}
              />
            </button>
          );
        })}
      </div>
      {showValue && value > 0 && (
        <span className="ml-1.5 flex items-baseline gap-1">
          <span className={cn(
            'font-bold text-city-dark',
            size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'
          )}>
            {value.toFixed(1)}
          </span>
          {count !== undefined && count > 0 && (
            <span className="text-xs text-city-light">({count})</span>
          )}
        </span>
      )}
    </div>
  );
}

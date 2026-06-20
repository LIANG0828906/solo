import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  allowHalf?: boolean;
  className?: string;
}

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 20,
  allowHalf = false,
  className,
}: StarRatingProps) {
  const handleClick = (index: number, isHalf: boolean) => {
    if (readOnly || !onChange) return;
    const newValue = isHalf ? index + 0.5 : index + 1;
    onChange(newValue);
  };

  const renderStar = (index: number) => {
    const fullStar = value >= index + 1;
    const halfStar = allowHalf && value > index && value < index + 1;

    return (
      <div
        key={index}
        className={cn('relative', !readOnly && 'cursor-pointer')}
        onClick={() => handleClick(index, false)}
      >
        <Star
          size={size}
          className={cn(
            'transition-colors',
            fullStar ? 'fill-[#fa8c16] text-[#fa8c16]' : 'text-gray-300'
          )}
        />
        {halfStar && (
          <div className="absolute top-0 left-0 overflow-hidden w-1/2">
            <Star size={size} className="fill-[#fa8c16] text-[#fa8c16]" />
          </div>
        )}
        {allowHalf && !readOnly && (
          <div
            className="absolute top-0 left-0 w-1/2 h-full"
            onClick={(e) => {
              e.stopPropagation();
              handleClick(index, true);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[0, 1, 2, 3, 4].map(renderStar)}
    </div>
  );
}

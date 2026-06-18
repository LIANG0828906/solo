import { Heart } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  count: number;
  liked: boolean;
  onLike: () => void;
  disabled?: boolean;
}

export default function LikeButton({ count, liked, onLike, disabled }: LikeButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setIsAnimating(true);
    onLike();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1 text-sm font-medium',
        'transition-colors duration-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      style={{ color: liked ? '#E74C3C' : '#CCCCCC' }}
    >
      <Heart
        size={18}
        fill={liked ? '#E74C3C' : 'none'}
        className={cn(
          'transition-transform duration-300 ease-in-out',
          isAnimating && 'scale-130'
        )}
      />
      <span>{count}</span>
    </button>
  );
}

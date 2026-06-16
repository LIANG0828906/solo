import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/formatters';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
};

export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-semibold shrink-0',
        sizeClasses[size],
        className,
      )}
      style={{ background: 'linear-gradient(135deg, #FF8F00, #FFC107)' }}
    >
      {getInitials(name)}
    </div>
  );
}

import { cn } from '@/lib/utils';
import { getAvatarColor, getInitials } from '@/utils/avatar';

export interface AvatarProps {
  username: string;
  color?: string;
  size?: 32 | 40 | 50 | 80;
  className?: string;
}

const sizeMap: Record<number, string> = {
  32: 'w-8 h-8 text-xs',
  40: 'w-10 h-10 text-sm',
  50: 'w-[50px] h-[50px] text-base',
  80: 'w-20 h-20 text-2xl',
};

export default function Avatar({
  username,
  color,
  size = 40,
  className,
}: AvatarProps) {
  const bgColor = color || getAvatarColor(username);
  const initials = getInitials(username);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-medium select-none',
        sizeMap[size],
        className
      )}
      style={{ backgroundColor: bgColor }}
      title={username}
    >
      {initials}
    </div>
  );
}

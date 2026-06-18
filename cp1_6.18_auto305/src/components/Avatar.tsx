import { themes } from '@/utils/theme';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<string, string> = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const themeColors = Object.values(themes).map(t => t.primaryColor);

function getRandomColor(): string {
  return themeColors[Math.floor(Math.random() * themeColors.length)];
}

export default function Avatar({ name, color, size = 'md' }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  const bgColor = color || getRandomColor();

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-bold',
        sizeClasses[size]
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initial}
    </div>
  );
}

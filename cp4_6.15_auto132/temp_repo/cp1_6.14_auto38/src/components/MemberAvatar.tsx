import { cn } from '@/lib/utils';

interface MemberAvatarProps {
  name: string;
  avatar: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export default function MemberAvatar({
  name,
  avatar,
  size = 'md',
  className,
}: MemberAvatarProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 text-sm',
    md: 'h-8 w-8 text-lg',
    lg: 'h-12 w-12 text-2xl',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-white shadow-md',
        'border-2 border-primary-200',
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {avatar}
    </div>
  );
}

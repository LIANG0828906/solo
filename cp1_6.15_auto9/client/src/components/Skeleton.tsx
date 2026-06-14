import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'circular' | 'rectangular' | 'text';
  width?: number | string;
  height?: number | string;
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] dark:from-gray-700 dark:via-gray-600 dark:to-gray-700';

  const variantStyles = {
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    text: 'rounded',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], className)}
      style={style}
    />
  );
}

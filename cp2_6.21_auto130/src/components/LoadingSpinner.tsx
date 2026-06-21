import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
  fullScreen?: boolean;
}

const SIZE_MAP = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
} as const;

const LABEL_SIZE = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
} as const;

export default function LoadingSpinner({
  size = 'md',
  className,
  label,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        role="status"
        aria-label={label ?? 'loading'}
        className={cn(
          'rounded-full border-primary/20 border-t-primary animate-spin',
          'motion-reduce:animate-[spin_1.5s_linear_infinite]',
          SIZE_MAP[size],
          {
            'border-t-primary border-r-primary/60 border-b-primary/20': true,
          }
        )}
        style={{ animationDuration: size === 'xl' ? '1.1s' : '0.85s' }}
      >
        <span className="sr-only">{label ?? '加载中...'}</span>
      </div>
      {label && (
        <span
          className={cn(
            'font-medium tracking-wide text-primary-dark animate-pulse',
            LABEL_SIZE[size]
          )}
        >
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/60 bg-white/70 px-10 py-8 shadow-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary-light/20">
            <div
              role="status"
              aria-label={label ?? 'loading'}
              className={cn(
                'rounded-full border-primary/20 border-t-primary animate-spin',
                'h-9 w-9 border-2 border-t-primary border-r-primary/60 border-b-primary/20'
              )}
              style={{ animationDuration: '0.85s' }}
            />
          </div>
          <p className="font-display text-lg tracking-wider text-gray-700">
            {label ?? '正在加载美味食谱...'}
          </p>
        </div>
      </div>
    );
  }

  return spinner;
}

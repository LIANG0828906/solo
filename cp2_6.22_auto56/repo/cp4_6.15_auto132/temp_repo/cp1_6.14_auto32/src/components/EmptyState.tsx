import { cn } from '@/lib/utils';

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = '暂无物品' }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4')}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-28 w-28 text-gray-300"
      >
        <rect
          x="20" y="50" width="80" height="50" rx="4"
          stroke="currentColor" strokeWidth="2.5"
        />
        <path
          d="M20 50 L60 30 L100 50" stroke="currentColor"
          strokeWidth="2.5" strokeLinejoin="round"
        />
        <line
          x1="60" y1="30" x2="60" y2="50"
          stroke="currentColor" strokeWidth="2.5"
        />
        <path
          d="M45 50 L45 75" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round"
        />
        <path
          d="M75 50 L75 75" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round"
        />
        <circle cx="60" cy="35" r="2" fill="currentColor" />
      </svg>
      <p className="mt-4 text-sm text-gray-400">{message}</p>
    </div>
  );
}

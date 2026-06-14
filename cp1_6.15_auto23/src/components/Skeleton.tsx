import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-skeleton-pulse rounded-lg', className)} />;
}

export function BookCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="rounded-card bg-warm-white p-4 shadow-soft animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Skeleton className="w-full h-44 rounded-lg mb-3" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-3" />
      <div className="flex items-center gap-2">
        <Skeleton className="w-5 h-5 rounded-full" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

export function BookListSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {Array.from({ length: 15 }).map((_, i) => (
        <BookCardSkeleton key={i} delay={i * 30} />
      ))}
    </div>
  );
}

export function BookDetailSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-warm-white rounded-card p-6 shadow-soft">
        <div className="flex gap-6">
          <Skeleton className="w-40 h-56 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-5 w-1/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>
      <div className="bg-warm-white rounded-card p-6 shadow-soft">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-warm-white rounded-card p-6 shadow-soft">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-cream/50">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  count?: number;
}

export default function Skeleton({ className = '', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton-pulse rounded-lg bg-secondary/60 ${className}`}
        />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="skeleton-pulse aspect-[3/4] w-full rounded-lg bg-secondary/60 mb-3" />
      <div className="skeleton-pulse h-4 w-3/4 rounded bg-secondary/60 mb-2" />
      <div className="skeleton-pulse h-3 w-1/2 rounded bg-secondary/60" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="skeleton-pulse h-4 w-1/4 rounded bg-secondary/60" />
          <div className="skeleton-pulse h-4 w-1/3 rounded bg-secondary/60" />
          <div className="skeleton-pulse h-4 w-1/5 rounded bg-secondary/60" />
          <div className="skeleton-pulse h-4 w-1/6 rounded bg-secondary/60" />
        </div>
      ))}
    </div>
  );
}

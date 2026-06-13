interface ListSkeletonProps {
  count?: number;
}

export function CardSkeleton() {
  return (
    <div className="card-skeleton">
      <div className="img skeleton" />
      <div className="lines">
        <div className="line-1 skeleton" />
        <div className="line-2 skeleton" />
        <div className="line-3 skeleton" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 12 }: ListSkeletonProps) {
  return (
    <div className="waterfall">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

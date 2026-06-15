interface CardSkeletonProps {
  style?: React.CSSProperties;
}

export function CardSkeleton({ style }: CardSkeletonProps) {
  return (
    <div className="card-skeleton" style={style}>
      <div className="skeleton img" />
      <div className="lines">
        <div className="skeleton line-1" />
        <div className="skeleton line-2" />
        <div className="skeleton line-3" />
      </div>
    </div>
  );
}

interface ListSkeletonProps {
  count?: number;
}

export function ListSkeleton({ count = 12 }: ListSkeletonProps) {
  return (
    <div className="waterfall">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export default { CardSkeleton, ListSkeleton };

import '../index.css';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 50%, #e5e7eb 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      className="flex flex-col rounded-xl bg-white p-4"
      style={{
        width: '280px',
        height: '320px',
        boxShadow: '0 2px 8px #E0E0E0',
      }}
    >
      <Skeleton className="w-full mb-3" style={{ height: '180px' }} />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-1/2 mb-3" />
      <div className="mt-auto flex justify-between items-center">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonPriceCard() {
  return (
    <div
      className="w-full rounded-xl p-6 relative"
      style={{
        background: '#FFF3E0',
        borderLeft: '4px solid #FF9800',
      }}
    >
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-10 w-48 mb-3" />
      <Skeleton className="h-4 w-64 mb-4" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

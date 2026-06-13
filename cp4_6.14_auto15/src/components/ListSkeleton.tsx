import CardSkeleton from './CardSkeleton';

export default function ListSkeleton() {
  return (
    <div className="waterfall">
      {Array.from({ length: 8 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

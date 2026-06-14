import ItemCard, { type Item } from '@/components/ItemCard';
import SkeletonCard from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';

interface ItemListProps {
  items: Item[];
  loading: boolean;
  onCardClick: (item: Item) => void;
}

export default function ItemList({ items, loading, onCardClick }: ItemListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="animate-fade-slide"
          style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
        >
          <ItemCard item={item} onClick={onCardClick} />
        </div>
      ))}
    </div>
  );
}

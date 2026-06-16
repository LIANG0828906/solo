import { useState, useCallback } from 'react';
import { Package } from 'lucide-react';
import type { Item } from '@/types';
import { useMarketStore } from '@/stores/marketStore';
import { cn } from '@/lib/utils';

interface ItemCardProps {
  item: Item;
  onCardClick: (itemId: string) => void;
  index?: number;
}

const ItemCardInner = ({ item, onCardClick, index = 0 }: ItemCardProps) => {
  const [imageError, setImageError] = useState(false);

  const wearPercent = Math.round(item.wearLevel * 100);

  const handleClick = useCallback(() => {
    onCardClick(item.id);
  }, [onCardClick, item.id]);

  return (
    <div
      className={cn('card', 'animate-fade-in-up')}
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {item.imageUrl && !imageError ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="item-card-image"
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className="item-card-image"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--color-card)',
          }}
        >
          <Package size={40} color="var(--color-text-muted)" />
        </div>
      )}

      <div className="wear-indicator">
        <span>{wearPercent}%</span>
        <div className="progress-bar" style={{ width: 48 }}>
          <div
            className="progress-bar-fill"
            style={{ width: `${wearPercent}%` }}
          />
        </div>
      </div>

      <div style={{ padding: '0.875rem 1rem 1rem' }}>
        <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>
          {item.category}
        </span>

        <h3
          className="overflow-ellipsis"
          style={{
            fontSize: '1rem',
            margin: '0.375rem 0 0.25rem',
            lineHeight: 1.4,
          }}
        >
          {item.name}
        </h3>

        <p
          className="overflow-ellipsis"
          style={{
            color: 'var(--color-text-muted)',
            fontSize: '0.8125rem',
            lineHeight: 1.5,
          }}
        >
          {item.desiredExchange}
        </p>
      </div>
    </div>
  );
};

const ItemCard = React.memo(ItemCardInner);

export default ItemCard;

import { Star, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Dish } from '@shared/types';

interface DishCardProps {
  dish: Dish;
  onSelect?: (dish: Dish) => void;
  selected?: boolean;
  actionButtons?: React.ReactNode;
  style?: React.CSSProperties;
}

export default function DishCard({ dish, onSelect, selected, actionButtons, style }: DishCardProps) {
  const navigate = useNavigate();

  const stars = Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      size={14}
      fill={i < Math.round(dish.rating) ? 'var(--color-gold)' : 'none'}
      color={i < Math.round(dish.rating) ? 'var(--color-gold)' : 'var(--color-muted)'}
    />
  ));

  return (
    <div
      className={`card fade-in ${selected ? 'selected' : ''}`}
      style={{
        width: 280,
        maxWidth: '100%',
        flexShrink: 0,
        position: 'relative',
        cursor: onSelect ? 'pointer' : 'default',
        border: selected ? '2px solid var(--color-primary)' : '2px solid transparent',
        ...style,
      }}
      onClick={() => onSelect?.(dish)}
    >
      {actionButtons && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 6,
            zIndex: 2,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {actionButtons}
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: 220,
          background: dish.coverImage
            ? `url(${dish.coverImage}) center/cover no-repeat`
            : 'linear-gradient(135deg, var(--color-beige-deep), var(--color-primary-light))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: dish.coverImage ? 0 : 72,
        }}
      >
        {!dish.coverImage && (dish.methods[0] ? '🍽️' : '🍳')}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--color-brown-deep)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {dish.name}
          </h3>
          <div style={{ display: 'flex', gap: 1 }}>{stars}</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {dish.tags.slice(0, 3).map((t) => (
            <span key={t} className="tag-pill">
              {t}
            </span>
          ))}
        </div>

        <div
          style={{
            fontSize: 13,
            color: 'var(--color-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          🥬 {dish.ingredients.slice(0, 4).map((i) => i.name).join('、')}
          {dish.ingredients.length > 4 ? '...' : ''}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            👨‍🍳 {dish.author}
          </span>
          <button
            className="btn btn-primary"
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dish/${dish.id}`);
            }}
          >
            <Eye size={14} />
            详情
          </button>
        </div>
      </div>

      <style>{`
        .card.selected {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-card-hover);
        }
        @media (max-width: 768px) {
          .card { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

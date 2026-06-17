import React, { memo, useState } from 'react';
import { Wish, Priority, useWishStore } from '../store';

interface WishCardProps {
  wish: Wish;
  isDragging?: boolean;
  onDelete?: () => void;
  showProgress?: boolean;
}

const priorityColors: Record<Priority, string> = {
  high: '#E74C3C',
  medium: '#F39C12',
  low: '#27AE60'
};

const priorityLabels: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低'
};

const HeartIcon = memo(function HeartIcon({
  filled,
  onClick
}: {
  filled: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const [animating, setAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    setAnimating(true);
    onClick(e);
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: animating ? 'scale(1.1)' : 'scale(1)',
        fill: filled ? '#E74C3C' : 'none',
        stroke: filled ? '#E74C3C' : '#999',
        strokeWidth: 2,
        filter: animating && !filled ? 'opacity(0.5)' : 'none'
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as SVGElement).style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as SVGElement).style.transform = animating ? 'scale(1.1)' : 'scale(1)';
      }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
});

function WishCardComponent({ wish, isDragging = false, onDelete, showProgress = true }: WishCardProps) {
  const { toggleFavorite, isFavorite } = useWishStore();
  const favorite = isFavorite(wish.id);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getDaysLeft = () => {
    const target = new Date(wish.targetDate).getTime();
    const now = Date.now();
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysLeft = getDaysLeft();

  return (
    <div
      style={{
        width: 280,
        height: 220,
        backgroundColor: '#fff',
        borderRadius: 12,
        boxShadow: isDragging
          ? '0 4px 16px rgba(0,0,0,0.2)'
          : '0 2px 8px rgba(0,0,0,0.1)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s ease',
        transform: isDragging ? 'translateY(-3px)' : 'none',
        opacity: isDragging ? 0.85 : 1,
        boxSizing: 'border-box'
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 2
        }}
      >
        <HeartIcon
          filled={favorite}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(wish.id);
          }}
        />
        {wish.isOwn && onDelete && (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#999"
            strokeWidth="2"
            style={{ cursor: 'pointer', transition: 'stroke 0.2s' }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            onMouseEnter={(e) => ((e.currentTarget as SVGElement).style.stroke = '#E74C3C')}
            onMouseLeave={(e) => ((e.currentTarget as SVGElement).style.stroke = '#999')}
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingRight: 60 }}>
        <span
          style={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: priorityColors[wish.priority],
            flexShrink: 0
          }}
        />
        <span
          style={{
            fontSize: 12,
            color: priorityColors[wish.priority],
            fontWeight: 600,
            padding: '2px 8px',
            backgroundColor: `${priorityColors[wish.priority]}15`,
            borderRadius: 4
          }}
        >
          {priorityLabels[wish.priority]}优先级
        </span>
      </div>

      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: '#2c3e50',
          margin: '0 0 8px 0',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          paddingRight: 40
        }}
        title={wish.title}
      >
        {wish.title}
      </h3>

      <p
        style={{
          fontSize: 13,
          color: '#7f8c8d',
          margin: 0,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1,
          minHeight: 40
        }}
        title={wish.description}
      >
        {wish.description}
      </p>

      {showProgress && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6
            }}
          >
            <span style={{ fontSize: 11, color: '#95a5a6' }}>
              进度 {wish.progress}%
            </span>
            <span
              style={{
                fontSize: 11,
                color: daysLeft < 0 ? '#E74C3C' : daysLeft <= 7 ? '#F39C12' : '#95a5a6',
                fontWeight: daysLeft <= 7 ? 600 : 400
              }}
            >
              {daysLeft < 0 ? `已逾期 ${Math.abs(daysLeft)} 天` : `还剩 ${daysLeft} 天`}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              backgroundColor: '#ecf0f1',
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(0, Math.min(100, wish.progress))}%`,
                background: 'linear-gradient(90deg, #3498DB 0%, #2ECC71 100%)',
                borderRadius: 3,
                transition: 'width 0.6s ease-out'
              }}
            />
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid #f0f0f0'
        }}
      >
        <span style={{ fontSize: 11, color: '#95a5a6' }}>
          📅 {formatDate(wish.targetDate)}
        </span>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#95a5a6' }}>
          <span>❤️ {wish.favorites}</span>
          <span>💬 {wish.comments}</span>
        </div>
      </div>
    </div>
  );
}

export const WishCard = memo(WishCardComponent);

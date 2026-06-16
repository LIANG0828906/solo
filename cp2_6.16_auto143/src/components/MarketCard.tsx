import React from 'react';
import { Market } from '@/types';
import { useAppStore } from '@/store';

interface MarketCardProps {
  market: Market;
  onClick: () => void;
  index: number;
}

const MarketCard: React.FC<MarketCardProps> = ({ market, onClick, index }) => {
  const { favorites, toggleFavorite } = useAppStore();
  const isFavorite = favorites.includes(market.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(market.id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      secondhand: '二手市集',
      handmade: '手作市集',
      food: '美食市集',
      mixed: '综合市集',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      secondhand: '#8D6E63',
      handmade: '#AB47BC',
      food: '#EF5350',
      mixed: '#FF7043',
    };
    return colors[type] || '#FF7043';
  };

  return (
    <div
      className="fade-in-up"
      style={{
        ...styles.card,
        animationDelay: `${index * 80}ms`,
        opacity: 0,
      }}
      onClick={onClick}
    >
      <div style={styles.imageContainer}>
        <img src={market.image} alt={market.name} style={styles.image} />
        <div
          style={{
            ...styles.typeBadge,
            backgroundColor: getTypeColor(market.type),
          }}
        >
          {getTypeLabel(market.type)}
        </div>
        <button
          className="bounce"
          style={{
            ...styles.favoriteBtn,
            backgroundColor: isFavorite ? '#FF7043' : 'rgba(255, 255, 255, 0.9)',
            color: isFavorite ? 'white' : '#D84315',
          }}
          onClick={handleFavoriteClick}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>

      <div style={styles.content}>
        <h3 style={styles.title}>{market.name}</h3>
        
        <div style={styles.metaRow}>
          <span style={styles.metaItem}>📅 {formatDate(market.date)}</span>
        </div>
        
        <div style={styles.metaRow}>
          <span style={styles.metaItem}>📍 {market.location}</span>
        </div>

        <p style={styles.description}>{market.description}</p>

        <div style={styles.footer}>
          <div style={styles.popularity}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                style={{
                  ...styles.star,
                  color: i < market.popularity ? '#FFB300' : '#E0E0E0',
                }}
              >
                ★
              </span>
            ))}
          </div>
          <div style={styles.boothCount}>
            {market.booths.filter(b => b.status === 'approved').length} 个摊位
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius)',
    border: '2px solid var(--border-color)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'var(--transition)',
    boxShadow: 'var(--shadow)',
    display: 'flex',
    flexDirection: 'column',
  },
  imageContainer: {
    position: 'relative',
    height: '160px',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 300ms ease-out',
  },
  typeBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    padding: '4px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 600,
  },
  favoriteBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  content: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
  },
  metaItem: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  description: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: '8px',
  },
  popularity: {
    display: 'flex',
    gap: '2px',
  },
  star: {
    fontSize: '16px',
  },
  boothCount: {
    fontSize: '12px',
    color: 'var(--accent)',
    fontWeight: 600,
  },
};

export default MarketCard;

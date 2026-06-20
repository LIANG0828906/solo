import React, { useState } from 'react';
import { WeatherCardData, WeatherCondition } from './weatherData';

interface CollectionPageProps {
  cards: WeatherCardData[];
  onViewCard: (card: WeatherCardData) => void;
  onRemoveCard: (id: string) => void;
}

const CONDITION_STYLES: Record<WeatherCondition, { bg: string; accent: string }> = {
  sunny: { bg: 'radial-gradient(circle at 50% 35%, #FFD54F 0%, #FFA726 60%, #FB8C00 100%)', accent: '#FFD54F' },
  rainy: { bg: 'linear-gradient(180deg, #37474F 0%, #607D8B 100%)', accent: '#90A4AE' },
  snowy: { bg: 'linear-gradient(180deg, #ECEFF1 0%, #B0BEC5 100%)', accent: '#E3F2FD' },
  windy: { bg: 'linear-gradient(180deg, #455A64 0%, #78909C 100%)', accent: '#B0BEC5' },
  cloudy: { bg: 'linear-gradient(180deg, #546E7A 0%, #90A4AE 100%)', accent: '#CFD8DC' }
};

interface MiniCardProps {
  card: WeatherCardData;
  onView: (card: WeatherCardData) => void;
  onRemove: (id: string) => void;
}

const MiniCard: React.FC<MiniCardProps> = React.memo(({ card, onView, onRemove }) => {
  const [deleting, setDeleting] = useState(false);
  const [hovered, setHovered] = useState(false);
  const style = CONDITION_STYLES[card.condition];
  const isLight = card.condition === 'snowy';
  const textColor = isLight ? '#37474F' : '#FFFFFF';

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    setTimeout(() => onRemove(card.id), 280);
  };

  const heights = [240, 260, 280, 250, 270, 290, 255];
  const h = heights[Math.abs(card.id.charCodeAt(0)) % heights.length];

  return (
    <div
      className={deleting ? 'card-delete' : ''}
      onClick={() => onView(card)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 180,
        minHeight: 240,
        height: h,
        marginBottom: 16,
        breakInside: 'avoid',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        background: style.bg,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)',
        display: 'inline-block'
      }}
    >
      <button
        onClick={handleRemove}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.35)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
          zIndex: 5,
          fontSize: 14,
          lineHeight: 1
        }}
      >
        ×
      </button>

      {card.condition === 'snowy' && (
        <div style={{ position: 'absolute', top: 20, right: 24, fontSize: 28, opacity: 0.7 }}>❄</div>
      )}
      {card.condition === 'sunny' && (
        <div style={{ position: 'absolute', top: 24, right: 24, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', boxShadow: '0 0 24px rgba(255,255,255,0.6)' }} />
      )}
      {card.condition === 'rainy' && (
        <div style={{ position: 'absolute', top: 26, right: 24, fontSize: 28, opacity: 0.8 }}>☂</div>
      )}
      {card.condition === 'windy' && (
        <div style={{ position: 'absolute', top: 26, right: 24, fontSize: 26, opacity: 0.8 }}>〰</div>
      )}
      {card.condition === 'cloudy' && (
        <div style={{ position: 'absolute', top: 26, right: 24, fontSize: 28, opacity: 0.75 }}>☁</div>
      )}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '14px 14px 16px',
          color: textColor,
          zIndex: 2
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>{card.city}</div>
        <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4, lineHeight: 1 }}>
          {card.temperature}°
        </div>
        <div style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}>
          {card.conditionText} · {card.date}
        </div>
      </div>
    </div>
  );
});

MiniCard.displayName = 'MiniCard';

const CollectionPage: React.FC<CollectionPageProps> = ({ cards, onViewCard, onRemoveCard }) => {
  if (cards.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)',
          padding: 40
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.4 }}>🗂</div>
        <div style={{ fontSize: 16 }}>还没有收藏的卡片</div>
        <div style={{ fontSize: 13, marginTop: 6, opacity: 0.7 }}>
          去「今日天气」点击心形按钮收藏喜欢的卡片吧
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 24px 100px',
        width: '100%',
        maxWidth: 900,
        margin: '0 auto'
      }}
    >
      <div style={{ marginBottom: 20, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
        共收藏 {cards.length} 张卡片
      </div>
      <div
        style={{
          columnCount: 'auto',
          columnWidth: 180,
          columnGap: 16
        }}
      >
        {cards.map((c) => (
          <MiniCard key={c.id} card={c} onView={onViewCard} onRemove={onRemoveCard} />
        ))}
      </div>
    </div>
  );
};

export default CollectionPage;

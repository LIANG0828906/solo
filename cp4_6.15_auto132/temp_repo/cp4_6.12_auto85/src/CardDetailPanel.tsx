import React, { useState, useEffect } from 'react';
import { X, Star, Link2 } from 'lucide-react';
import { CardData, ConnectionData } from './utils';

interface CardDetailPanelProps {
  card: CardData | null;
  allCards: CardData[];
  connections: ConnectionData[];
  onClose: () => void;
  onRatingChange: (cardId: string, rating: number) => void;
  onRelatedCardClick: (cardId: string) => void;
}

const CardDetailPanel: React.FC<CardDetailPanelProps> = ({
  card,
  allCards,
  connections,
  onClose,
  onRatingChange,
  onRelatedCardClick,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (card) {
      setIsVisible(true);
      setIsFadingOut(false);
    }
  }, [card]);

  const handleClose = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && card) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [card]);

  if (!card || !isVisible) return null;

  const relatedConnections = connections.filter(
    (c) => c.fromCardId === card.id || c.toCardId === card.id
  );

  const relatedCards = relatedConnections
    .map((conn) => {
      const targetId = conn.fromCardId === card.id ? conn.toCardId : conn.fromCardId;
      const targetCard = allCards.find((c) => c.id === targetId);
      return targetCard ? { card: targetCard, connection: conn } : null;
    })
    .filter(Boolean) as { card: CardData; connection: ConnectionData }[];

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    opacity: isFadingOut ? 0 : 1,
    transition: 'opacity 0.3s ease',
  };

  const panelStyle: React.CSSProperties = {
    width: '320px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
    padding: '24px',
    position: 'relative',
    transform: isFadingOut ? 'scale(0.95)' : 'scale(1)',
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    opacity: isFadingOut ? 0 : 1,
  };

  const closeBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    transition: 'all 0.2s ease',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  };

  const iconStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: card.color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
    margin: 0,
    flex: 1,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#666',
    margin: '20px 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#444',
    lineHeight: 1.6,
    margin: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: '12px',
    borderRadius: '8px',
  };

  const starsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    marginTop: '8px',
  };

  const starBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    transition: 'transform 0.15s ease',
  };

  const relatedItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginBottom: '4px',
  };

  const relatedIconStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    flexShrink: 0,
  };

  const relatedTitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#333',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const strengthBadgeStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#888',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: '2px 6px',
    borderRadius: '4px',
  };

  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <button
          style={closeBtnStyle}
          onClick={handleClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.06)';
          }}
        >
          <X size={16} />
        </button>

        <div style={headerStyle}>
          <div style={iconStyle}>{card.icon}</div>
          <h3 style={titleStyle}>{card.title}</h3>
        </div>

        <div style={sectionTitleStyle}>
          <span>📖 概念解释</span>
        </div>
        <p style={descriptionStyle}>
          {card.relatedSentences.length > 0
            ? card.relatedSentences.join(' ')
            : card.description || '暂无详细描述'}
        </p>

        <div style={sectionTitleStyle}>
          <Star size={14} />
          <span>关联度评分</span>
        </div>
        <div style={starsContainerStyle}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              style={starBtnStyle}
              onClick={() => onRatingChange(card.id, star === card.rating ? 0 : star)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Star
                size={20}
                fill={star <= card.rating ? '#FFC107' : 'none'}
                color={star <= card.rating ? '#FFC107' : '#DDD'}
              />
            </button>
          ))}
        </div>

        {relatedCards.length > 0 && (
          <>
            <div style={sectionTitleStyle}>
              <Link2 size={14} />
              <span>关联卡片 ({relatedCards.length})</span>
            </div>
            <div>
              {relatedCards.map(({ card: relCard, connection }) => (
                <div
                  key={relCard.id}
                  style={relatedItemStyle}
                  onClick={() => {
                    onRelatedCardClick(relCard.id);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ ...relatedIconStyle, backgroundColor: relCard.color }}>
                    {relCard.icon}
                  </div>
                  <span style={relatedTitleStyle}>{relCard.title}</span>
                  <span style={strengthBadgeStyle}>
                    {'●'.repeat(connection.strength)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CardDetailPanel;

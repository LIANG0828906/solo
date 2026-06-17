import { CreativeCard, TYPE_COLORS, TYPE_LABELS } from './types';
import { useTimelineStore } from './store';
import { memo, CSSProperties } from 'react';

interface CardProps {
  card: CreativeCard;
  index: number;
  draggable: boolean;
  onDragStart: (e: React.DragEvent, cardId: string, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

const CardComponent = memo(function CardComponent({
  card,
  index,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}: CardProps) {
  const setSelectedCard = useTimelineStore((state) => state.setSelectedCard);

  const cardStyle: CSSProperties = {
    height: '160px',
    width: '100%',
    maxWidth: '420px',
    background: '#3C096C',
    borderRadius: '12px',
    display: 'flex',
    overflow: 'hidden',
    cursor: draggable ? 'grab' : 'pointer',
    opacity: isDragging ? 0.6 : 1,
    transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
    boxShadow: isDragOver
      ? '0 8px 24px rgba(224, 170, 255, 0.5), 0 0 0 2px rgba(224, 170, 255, 0.3)'
      : '0 4px 16px rgba(0, 0, 0, 0.3)',
    transition: 'box-shadow 0.3s ease, transform 0.2s ease, opacity 0.2s ease',
    animation: `fadeInUp 0.5s ease ${index * 0.1}s both`,
    position: 'relative',
  };

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStart(e, card.id, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      style={cardStyle}
      onClick={() => setSelectedCard(card)}
      onMouseEnter={(e) => {
        if (!isDragging && !isDragOver) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
          e.currentTarget.style.boxShadow =
            '0 8px 24px rgba(224, 170, 255, 0.4), 0 0 0 1px rgba(224, 170, 255, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging && !isDragOver) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
        }
      }}
    >
      <div
        style={{
          width: '4px',
          height: '100%',
          background: TYPE_COLORS[card.type],
          flexShrink: 0,
        }}
      />

      <div
        style={{
          padding: '16px',
          display: 'flex',
          gap: '14px',
          flex: 1,
          minWidth: 0,
        }}
      >
        <img
          src={card.thumbnail}
          alt={card.title}
          draggable={false}
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '6px',
            objectFit: 'cover',
            flexShrink: 0,
            border: '1px solid rgba(224, 170, 255, 0.15)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: TYPE_COLORS[card.type],
                background: `${TYPE_COLORS[card.type]}15`,
                padding: '2px 8px',
                borderRadius: '4px',
                border: `1px solid ${TYPE_COLORS[card.type]}30`,
                flexShrink: 0,
              }}
            >
              {TYPE_LABELS[card.type]}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.4)',
                flexShrink: 0,
              }}
            >
              {card.createdAt}
            </span>
          </div>

          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {card.title}
          </h3>

          <p
            style={{
              fontSize: '14px',
              color: '#C77DFF',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flex: 1,
            }}
          >
            {card.summary}
          </p>
        </div>
      </div>
    </div>
  );
});

interface ModalProps {
  card: CreativeCard;
  onClose: () => void;
}

function Modal({ card, onClose }: ModalProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#00000080',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '640px',
          maxWidth: '100%',
          maxHeight: '85vh',
          background: 'linear-gradient(180deg, #3C096C 0%, #240046 100%)',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow:
            '0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(224, 170, 255, 0.1)',
          animation: 'fadeInUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={card.detailImage}
            alt={card.title}
            style={{
              width: '100%',
              height: '280px',
              objectFit: 'cover',
              display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, transparent 40%, rgba(36, 0, 70, 0.9) 100%)',
            }}
          />
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(224, 170, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>

          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '24px',
              right: '24px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                fontSize: '12px',
                fontWeight: 500,
                color: TYPE_COLORS[card.type],
                background: `${TYPE_COLORS[card.type]}25`,
                padding: '4px 12px',
                borderRadius: '6px',
                border: `1px solid ${TYPE_COLORS[card.type]}40`,
                marginBottom: '12px',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            >
              {TYPE_LABELS[card.type]} · {card.createdAt}
            </span>
            <h2
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: '#FFFFFF',
                lineHeight: 1.3,
                textShadow: '0 2px 12px rgba(0, 0, 0, 0.5)',
              }}
            >
              {card.title}
            </h2>
          </div>
        </div>

        <div
          style={{
            padding: '24px 28px 28px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {card.content.split('\n\n').map((paragraph, idx) => (
            <p
              key={idx}
              style={{
                fontSize: '15px',
                lineHeight: 1.8,
                color: 'rgba(255, 255, 255, 0.85)',
                marginBottom: idx < card.content.split('\n\n').length - 1 ? '16px' : 0,
                textIndent: '2em',
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Object.assign(CardComponent, { Modal });

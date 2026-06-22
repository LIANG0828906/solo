import { useDrag } from 'react-dnd';
import type { StoryCard, CardType, DragItem } from '../types';
import { useGameStore } from '../store/gameStore';

interface CardPoolProps {
  onMobileClose?: () => void;
  isMobile?: boolean;
}

const typeLabels: Record<CardType, { title: string; color: string }> = {
  character: { title: '角色', color: '#E94560' },
  scene: { title: '场景', color: '#0F3460' },
  event: { title: '事件', color: '#533483' },
  object: { title: '物件', color: '#1A1A2E' },
};

function DraggableCard({ card }: { card: StoryCard }) {
  const [{ isDragging }, drag] = useDrag<DragItem, unknown, { isDragging: boolean }>(() => ({
    type: 'CARD',
    item: { type: 'CARD', card },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [card]);

  const labelClass = `label-${card.type}`;

  return (
    <div
      ref={drag}
      style={{
        position: 'relative',
        padding: '14px 16px',
        marginBottom: 10,
        background: card.placedInEditor
          ? 'rgba(83, 52, 131, 0.3)'
          : 'linear-gradient(135deg, rgba(26,26,46,0.9), rgba(15,52,96,0.7))',
        borderRadius: 10,
        border: `1px solid ${card.placedInEditor ? 'rgba(83,52,131,0.5)' : 'rgba(233,69,96,0.3)'}`,
        cursor: card.placedInEditor ? 'not-allowed' : 'grab',
        opacity: isDragging ? 0.4 : card.placedInEditor ? 0.5 : 1,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.2s ease',
        boxShadow: isDragging
          ? '0 8px 32px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.2)',
        pointerEvents: card.placedInEditor ? 'none' : 'auto',
      }}
    >
      <div className={`card-type-label ${labelClass}`} />
      <div style={{ fontSize: 14, fontWeight: 600, color: '#E0E0E0', marginBottom: 4 }}>
        {card.name}
      </div>
      <div
        style={{
          fontSize: 11,
          color: '#8892B0',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {card.description}
      </div>
    </div>
  );
}

export default function CardPool({ onMobileClose, isMobile }: CardPoolProps) {
  const cards = useGameStore((s) => s.cards);

  const grouped: Record<CardType, StoryCard[]> = {
    character: [],
    scene: [],
    event: [],
    object: [],
  };

  cards.forEach((c) => grouped[c.type].push(c));

  return (
    <div
      className="custom-scrollbar"
      style={{
        width: '100%',
        height: '100%',
        background: '#1A1A2E',
        overflowY: 'auto',
        padding: isMobile ? '70px 20px 20px' : '24px 16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 8,
          background: 'linear-gradient(90deg, #E94560, #533483)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: 1,
        }}
      >
        故事编织器
      </div>
      <div style={{ fontSize: 12, color: '#8892B0', marginBottom: 20 }}>
        拖拽卡片到右侧编辑区
      </div>

      {(Object.keys(grouped) as CardType[]).map((type) => (
        <div key={type} style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 4,
                height: 16,
                borderRadius: 2,
                background: typeLabels[type].color,
              }}
            />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#E0E0E0' }}>
              {typeLabels[type].title}
            </div>
            <div style={{ fontSize: 11, color: '#8892B0' }}>
              ({grouped[type].filter((c) => !c.placedInEditor).length}/{grouped[type].length})
            </div>
          </div>
          {grouped[type].map((card) => (
            <DraggableCard key={card.id} card={card} />
          ))}
        </div>
      ))}

      {isMobile && (
        <button
          onClick={onMobileClose}
          style={{
            marginTop: 'auto',
            padding: '12px 16px',
            borderRadius: 8,
            background: 'rgba(233,69,96,0.15)',
            border: '1px solid #E94560',
            color: '#E94560',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.3s',
          }}
        >
          关闭菜单
        </button>
      )}
    </div>
  );
}

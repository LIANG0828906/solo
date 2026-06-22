import React, { useRef } from 'react';
import { Card, CardType, useGameStore } from '../stores/gameStore';

interface CardComponentProps {
  card: Card;
  draggable?: boolean;
  onClick?: () => void;
  floating?: boolean;
  small?: boolean;
}

const gradientMap: Record<CardType, string> = {
  attack: 'linear-gradient(180deg, #C62828 0%, #E53935 100%)',
  defense: 'linear-gradient(180deg, #1565C0 0%, #1E88E5 100%)',
  energy: 'linear-gradient(180deg, #6A1B9A 0%, #AB47BC 100%)',
};

const skillIcons: Record<string, string> = {
  double_strike: '⚔',
  critical: '💥',
  pierce: '🗡',
  shield_wall: '🛡',
  reflect: '🔄',
  absorb: '💠',
  energy_burst: '⚡',
  heal: '💚',
  empower: '✨',
  rage: '🔥',
  iron_wall: '🏰',
  chaos: '🌀',
};

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  draggable = false,
  onClick,
  floating = false,
  small = false,
}) => {
  const setDraggedCard = useGameStore((s) => s.setDraggedCard);
  const dragTimer = useRef<number | null>(null);

  const width = small ? 100 : 120;
  const height = small ? 142 : 170;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!draggable) return;
    e.preventDefault();
    dragTimer.current = window.setTimeout(() => {
      setDraggedCard(card);
    }, 50);
  };

  const handlePointerUp = () => {
    if (dragTimer.current) {
      clearTimeout(dragTimer.current);
      dragTimer.current = null;
    }
  };

  const hpPercent = (card.hp / card.maxHp) * 100;

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={onClick}
      className={floating ? 'card-float' : ''}
      style={{
        width,
        height,
        borderRadius: 8,
        background: gradientMap[card.type],
        boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
        border: '2px solid rgba(255,255,255,0.15)',
        display: 'flex',
        flexDirection: 'column',
        padding: small ? 6 : 8,
        cursor: draggable ? 'grab' : onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.2) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          fontSize: small ? 13 : 16,
          fontWeight: 700,
          color: '#fff',
          textAlign: 'center',
          marginBottom: small ? 4 : 6,
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          zIndex: 1,
        }}
      >
        {card.name}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: small ? 2 : 4,
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: small ? 12 : 14,
            fontWeight: 600,
            color: '#FFD700',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          ⚔ {card.attack}
        </div>
        <div
          style={{
            fontSize: small ? 12 : 14,
            fontWeight: 600,
            color: '#FFD700',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          🛡 {card.defense}
        </div>
      </div>

      {!small && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: 16,
            marginBottom: 6,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            {skillIcons[card.skill] || '⭐'}
          </div>
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: small ? 5 : 6,
          background: 'rgba(0,0,0,0.4)',
          borderRadius: 3,
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${hpPercent}%`,
            background:
              hpPercent > 50
                ? 'linear-gradient(90deg, #4CAF50, #66BB6A)'
                : hpPercent > 25
                ? 'linear-gradient(90deg, #FF9800, #FFB74D)'
                : 'linear-gradient(90deg, #F44336, #EF5350)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {!small && (
        <div
          style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.8)',
            textAlign: 'center',
            marginTop: 2,
            zIndex: 1,
          }}
        >
          HP {card.hp}/{card.maxHp}
        </div>
      )}
    </div>
  );
};

interface DraggedCardOverlayProps {
  position: { x: number; y: number } | null;
}

export const DraggedCardOverlay: React.FC<DraggedCardOverlayProps> = ({ position }) => {
  const draggedCard = useGameStore((s) => s.draggedCard);

  if (!draggedCard || !position) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x - 60,
        top: position.y - 85,
        opacity: 0.7,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'scale(1.05)',
      }}
    >
      <CardComponent card={draggedCard} />
    </div>
  );
};

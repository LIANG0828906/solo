import { useEffect } from 'react';
import type { Piece, PlayerColor } from '@/types/game';

const STYLE_ID = 'piece-keyframe-animations';

const GRADIENTS: Record<PlayerColor, string> = {
  red: 'radial-gradient(circle, #ff6b6b 40%, #e74c3c 60%, transparent 70%)',
  blue: 'radial-gradient(circle, #5dade2 40%, #3498db 60%, transparent 70%)',
  yellow: 'radial-gradient(circle, #f9e154 40%, #f1c40f 60%, transparent 70%)',
  green: 'radial-gradient(circle, #58d68d 40%, #2ecc71 60%, transparent 70%)',
};

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes piece-collide {
      0%, 100% { box-shadow: 0 0 0 0 transparent; }
      50% { box-shadow: 0 0 8px 4px rgba(255, 0, 0, 0.7); }
    }
    @keyframes piece-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    .piece-clickable {
      transition: transform 0.15s;
    }
    .piece-clickable:hover {
      transform: scale(1.2) !important;
    }
  `;
  document.head.appendChild(style);
}

function getIndexFromId(id: string): number {
  const match = id.match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
}

interface PieceProps {
  piece: Piece;
  color: PlayerColor;
  isCollided: boolean;
  onClick?: () => void;
  isCurrentPlayer: boolean;
}

export default function PieceComponent({ piece, color, isCollided, onClick, isCurrentPlayer }: PieceProps) {
  useEffect(() => {
    injectStyles();
  }, []);

  const index = getIndexFromId(piece.id);
  const isPulse = isCurrentPlayer && piece.position === -1;

  const animations: string[] = [];
  if (isCollided) animations.push('piece-collide 0.5s ease-in-out infinite');
  if (isPulse) animations.push('piece-pulse 1s ease-in-out infinite');

  const style: React.CSSProperties = {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: GRADIENTS[color],
    position: 'absolute' as const,
    bottom: 2,
    left: index * 4,
    zIndex: index + 1,
    cursor: onClick ? 'pointer' : undefined,
    animation: animations.length > 0 ? animations.join(', ') : undefined,
  };

  return (
    <div
      className={onClick ? 'piece-clickable' : undefined}
      style={style}
      onClick={onClick}
    >
      <div
        style={{
          width: 3,
          height: 3,
          borderRadius: '50%',
          background: 'white',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}

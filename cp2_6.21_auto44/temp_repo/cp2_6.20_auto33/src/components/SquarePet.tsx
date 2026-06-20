import React from 'react';
import PetSprite from './PetSprite';
import type { Pet } from '../types';

interface Props {
  pet: Pet;
  x: number;
  y: number;
  size?: number;
  showHeart?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const SquarePet: React.FC<Props> = ({ pet, x, y, size = 80, showHeart, onClick, style }) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        transform: `translate(${x}%, ${y}%) translate(-50%, -100%)`,
        willChange: 'transform',
        cursor: 'pointer',
        width: size,
        zIndex: Math.floor(y),
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.filter = 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = ''; }}
    >
      <PetSprite pet={pet} size={size} />
      <div style={{
        marginTop: -6,
        textAlign: 'center',
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 11,
        fontWeight: 700,
        color: '#5D4037',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        border: '1.5px solid #FFE0B2',
        display: 'inline-block',
        maxWidth: '100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }}>
        {pet.name} · Lv.{pet.level}
      </div>
      {showHeart && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          pointerEvents: 'none',
        }}>
          {[0, 1, 2, 3].map(i => {
            const angles = [-45, 0, 45, 90];
            const angle = angles[i] * (Math.PI / 180);
            const distance = 50;
            const hx = Math.cos(angle) * distance;
            const hy = -Math.sin(angle) * distance - 30;
            return (
              <span key={i} style={{
                position: 'absolute',
                fontSize: 22,
                left: 0,
                top: 0,
                animation: `heart-burst-${i} 1.1s ease-out ${i * 0.08}s both`,
              } as React.CSSProperties}>❤️</span>
            );
          })}
        </div>
      )}
      <style>{`
        @keyframes heart-burst-0 {
          0% { opacity: 1; transform: translate(0, 0) scale(0.5); }
          100% { opacity: 0; transform: translate(-35px, -35px) scale(1.2); }
        }
        @keyframes heart-burst-1 {
          0% { opacity: 1; transform: translate(0, 0) scale(0.5); }
          100% { opacity: 0; transform: translate(0px, -60px) scale(1.2); }
        }
        @keyframes heart-burst-2 {
          0% { opacity: 1; transform: translate(0, 0) scale(0.5); }
          100% { opacity: 0; transform: translate(35px, -35px) scale(1.2); }
        }
        @keyframes heart-burst-3 {
          0% { opacity: 1; transform: translate(0, 0) scale(0.5); }
          100% { opacity: 0; transform: translate(50px, -10px) scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default SquarePet;

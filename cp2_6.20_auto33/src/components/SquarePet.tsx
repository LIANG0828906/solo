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
}

export const SquarePet: React.FC<Props> = ({ pet, x, y, size = 80, showHeart, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -100%)',
        cursor: 'pointer',
        transition: 'left 0.9s linear, top 0.9s linear',
        width: size,
        zIndex: Math.floor(y),
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
          {[0, 1, 2, 3].map(i => (
            <span key={i} style={{
              position: 'absolute',
              fontSize: 22,
              ['--hx' as any]: `${(i - 1.5) * 16}px`,
              animation: `heart-burst 1.1s ease-out ${i * 0.08}s both`,
              left: 0, top: 0,
            } as React.CSSProperties}>❤️</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SquarePet;

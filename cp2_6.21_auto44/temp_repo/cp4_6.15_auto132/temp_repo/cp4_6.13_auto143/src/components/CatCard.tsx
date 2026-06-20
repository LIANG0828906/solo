import React, { useEffect, useRef } from 'react';
import type { CatBreed } from '../data/cats';
import { RARITY_BORDER, RARITY_STARS } from '../data/cats';
import { animateCardFlip } from '../utils/animation';

interface CatCardProps {
  breed: CatBreed;
  unlocked: boolean;
  count: number;
  isNewlyUnlocked: boolean;
  onCardClick: () => void;
  hasSpawnedCats: boolean;
}

export const CatCard: React.FC<CatCardProps> = ({
  breed,
  unlocked,
  count,
  isNewlyUnlocked,
  onCardClick,
  hasSpawnedCats
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNewlyUnlocked && innerRef.current) {
      animateCardFlip(innerRef.current);
    }
  }, [isNewlyUnlocked]);

  const borderStyle = unlocked
    ? breed.rarity === 'legendary'
      ? {
          background: RARITY_BORDER[breed.rarity],
          backgroundSize: '200% 200%',
          animation: 'rainbow 3s ease infinite'
        }
      : { borderColor: RARITY_BORDER[breed.rarity] }
    : { borderColor: '#666' };

  const stars = RARITY_STARS[breed.rarity];

  return (
    <div
      ref={cardRef}
      className={`cat-card ${unlocked ? 'unlocked' : 'locked'} ${hasSpawnedCats && unlocked ? 'clickable' : ''}`}
      style={borderStyle}
      onClick={unlocked && hasSpawnedCats ? onCardClick : undefined}
    >
      <div ref={innerRef} className="cat-card-inner">
        <div className="cat-emoji" style={{ filter: unlocked ? 'none' : 'grayscale(100%) brightness(0.5)' }}>
          {breed.emoji}
        </div>
        <div className="cat-name" style={{ color: unlocked ? breed.colorTheme.accent : '#666' }}>
          {unlocked ? breed.name : '???'}
        </div>
        <div className="cat-rarity">
          {Array.from({ length: stars }).map((_, i) => (
            <span key={i} className="star" style={{ opacity: unlocked ? 1 : 0.3 }}>
              ⭐
            </span>
          ))}
        </div>
        <div className="cat-personality">
          {unlocked ? breed.personalities[0] : '尚未收集'}
        </div>
        {unlocked && (
          <div className="cat-count">
            已遇见 × {count}
          </div>
        )}
      </div>
      <style>{`
        .cat-card {
          width: 100%;
          aspect-ratio: 3 / 4;
          border-radius: 12px;
          border: 3px solid;
          overflow: hidden;
          cursor: default;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          background: #2a1f1a;
          position: relative;
        }
        
        .cat-card.unlocked.clickable {
          cursor: pointer;
        }
        
        .cat-card.unlocked.clickable:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
        
        .cat-card-inner {
          width: 100%;
          height: 100%;
          padding: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        
        .cat-emoji {
          font-size: 40px;
          line-height: 1;
          transition: filter 0.3s ease;
        }
        
        .cat-name {
          font-family: 'ZCOOL KuaiLe', cursive;
          font-size: 14px;
          font-weight: bold;
          text-align: center;
        }
        
        .cat-rarity {
          display: flex;
          gap: 2px;
        }
        
        .star {
          font-size: 12px;
          transition: opacity 0.3s ease;
        }
        
        .cat-personality {
          font-family: 'ZCOOL KuaiLe', cursive;
          font-size: 11px;
          color: #aaa;
          text-align: center;
          line-height: 1.3;
          min-height: 28px;
          display: flex;
          align-items: center;
        }
        
        .cat-count {
          font-family: 'Press Start 2P', cursive;
          font-size: 8px;
          color: #FFD700;
          margin-top: 4px;
        }
        
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @media (max-width: 768px) {
          .cat-emoji {
            font-size: 32px;
          }
          .cat-name {
            font-size: 12px;
          }
          .cat-personality {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  );
};

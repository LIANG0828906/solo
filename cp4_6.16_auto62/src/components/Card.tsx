import React, { useState, useCallback } from 'react';
import type { Card as CardType } from '../types';
import { TAG_COLORS, COST_GRADIENTS } from '../types';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  isInShop?: boolean;
  isNew?: boolean;
  index?: number;
  total?: number;
  size?: 'small' | 'normal' | 'large';
  onSelect?: (cardId: string) => void;
  onPlay?: (cardId: string) => void;
}

export const Card: React.FC<CardProps> = ({
  card,
  isSelected = false,
  isInShop = false,
  isNew = false,
  index = 0,
  total = 1,
  size = 'normal',
  onSelect,
  onPlay,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const tagColor = TAG_COLORS[card.tag];
  const gradient = COST_GRADIENTS[card.cost];

  const sizeMultiplier = size === 'small' ? 0.6 : size === 'large' ? 1.2 : 1;
  const baseWidth = 8 * sizeMultiplier;
  const baseHeight = 11.2 * sizeMultiplier;

  const arcOffset = !isInShop && total > 1
    ? Math.sin(((index - (total - 1) / 2) / (total - 1 || 1)) * Math.PI * 0.35) * 1.5
    : 0;

  const rotation = !isInShop && total > 1
    ? ((index - (total - 1) / 2) / (total - 1 || 1)) * 8
    : 0;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInShop) return;
    onSelect?.(card.id);
  }, [card.id, isInShop, onSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInShop) return;
    onPlay?.(card.id);
  }, [card.id, isInShop, onPlay]);

  const particleCount = isHovered && !isInShop ? 6 : 0;

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative select-none"
      style={{
        width: `${baseWidth}vw`,
        height: `${baseHeight}vw`,
        minWidth: `${60 * sizeMultiplier}px`,
        minHeight: `${84 * sizeMultiplier}px`,
        cursor: isInShop ? 'default' : 'pointer',
        perspective: '1000px',
        flexShrink: 0,
      }}
    >
      <div
        className={`
          absolute inset-0 rounded-xl overflow-hidden
          transition-all duration-300 ease-out
          will-change-transform
        `}
        style={{
          background: gradient,
          borderRadius: '12px',
          border: isSelected
            ? '2px solid #ffd700'
            : '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: isSelected
            ? '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4)'
            : isHovered && !isInShop
            ? `0 0 15px ${tagColor.glow}, 0 10px 30px rgba(0, 0, 0, 0.5)`
            : '0 4px 15px rgba(0, 0, 0, 0.3)',
          transform: isInShop
            ? `rotate(${(index % 2 === 0 ? 1 : -1) * 1.5}deg)`
            : isHovered
            ? `translateY(-1.2vw) scale(1.2) rotate(${rotation * 0.2}deg) translateZ(0)`
            : `translateY(${arcOffset}vw) rotate(${rotation}deg) translateZ(0)`,
          transformOrigin: 'bottom center',
          zIndex: isHovered ? 100 : isSelected ? 50 : index,
          animation: isNew ? 'cardFlipIn 0.6s ease-out forwards' : 'none',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

        <div className="absolute top-[0.3vw] left-[0.3vw] right-[0.3vw] flex justify-between items-start z-10">
          <div
            className="flex items-center justify-center text-white font-bold shadow-lg"
            style={{
              width: `${1.8 * sizeMultiplier}vw`,
              height: `${1.8 * sizeMultiplier}vw`,
              minWidth: `${14 * sizeMultiplier}px`,
              minHeight: `${14 * sizeMultiplier}px`,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e3a5f, #0f1d30)',
              border: '1px solid rgba(255,255,255,0.5)',
              fontSize: `${0.9 * sizeMultiplier}vw`,
            }}
          >
            {card.cost}
          </div>
          <div
            className="font-bold text-white"
            style={{
              padding: `${0.15 * sizeMultiplier}vw ${0.5 * sizeMultiplier}vw`,
              borderRadius: '4px',
              background: tagColor.primary,
              fontSize: `${0.7 * sizeMultiplier}vw`,
            }}
          >
            {card.tag}
          </div>
        </div>

        <div
          className="absolute inset-x-0 text-center px-1"
          style={{ top: `${2.2 * sizeMultiplier}vw` }}
        >
          <div
            className="font-bold text-white truncate"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: `${0.85 * sizeMultiplier}vw`,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {card.name}
          </div>
        </div>

        <div
          className="absolute inset-x-[0.5vw] rounded-lg flex items-center justify-center"
          style={{
            top: `${4 * sizeMultiplier}vw`,
            bottom: `${3.5 * sizeMultiplier}vw`,
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="text-center">
            <div
              style={{
                fontSize: `${2.2 * sizeMultiplier}vw`,
                marginBottom: `${0.3 * sizeMultiplier}vw`,
                filter: `drop-shadow(0 0 8px ${tagColor.glow})`,
              }}
            >
              {card.tag === '火焰' && '🔥'}
              {card.tag === '冰霜' && '❄️'}
              {card.tag === '暗影' && '🌑'}
              {card.tag === '物理' && '⚔️'}
            </div>
            <div
              className="text-white/80 leading-tight px-1"
              style={{ fontSize: `${0.65 * sizeMultiplier}vw` }}
            >
              {card.description}
            </div>
          </div>
        </div>

        <div
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ bottom: `${0.6 * sizeMultiplier}vw` }}
        >
          <div
            className="flex items-center justify-center text-white font-bold"
            style={{
              width: `${2.8 * sizeMultiplier}vw`,
              height: `${2.8 * sizeMultiplier}vw`,
              minWidth: `${20 * sizeMultiplier}px`,
              minHeight: `${20 * sizeMultiplier}px`,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              boxShadow: `0 0 10px ${tagColor.glow}`,
              fontSize: `${1 * sizeMultiplier}vw`,
            }}
          >
            {card.attack}
          </div>
        </div>
      </div>

      {Array.from({ length: particleCount }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: '0.4vw',
            height: '0.4vw',
            minWidth: '4px',
            minHeight: '4px',
            background: tagColor.particle,
            boxShadow: `0 0 6px ${tagColor.particle}`,
            left: `${20 + Math.random() * 60}%`,
            top: `${30 + Math.random() * 40}%`,
            animation: `particleFloat-${i} 1.2s ease-out forwards`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}

      <style>{`
        @keyframes cardFlipIn {
          0% {
            transform: rotateY(180deg) scale(0.5);
            opacity: 0;
          }
          100% {
            transform: rotateY(0deg) scale(1);
            opacity: 1;
          }
        }

        @keyframes shopWiggle {
          0%, 100% { transform: rotate(-2deg) translateY(0); }
          50% { transform: rotate(2deg) translateY(-5px); }
        }
      `}</style>

      {Array.from({ length: 6 }).map((_, i) => (
        <style key={i}>{`
          @keyframes particleFloat-${i} {
            0% {
              transform: translate(0, 0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translate(
                ${(Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 20)}px,
                -${20 + Math.random() * 30}px
              ) scale(0);
              opacity: 0;
            }
          }
        `}</style>
      ))}
    </div>
  );
};

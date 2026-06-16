import React, { useRef, useEffect, useState } from 'react';
import type { Card as CardType } from '../types';
import { TAG_COLORS, COST_GRADIENTS } from '../types';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  isInShop?: boolean;
  isNew?: boolean;
  index?: number;
  total?: number;
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
  onSelect,
  onPlay,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHovered && !isInShop) {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: i * 0.1,
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isHovered, isInShop]);

  const tagColor = TAG_COLORS[card.tag];
  const gradient = COST_GRADIENTS[card.cost];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInShop) return;
    onSelect?.(card.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInShop) return;
    onPlay?.(card.id);
  };

  const baseWidth = isInShop ? '8vw' : '10vw';
  const baseHeight = isInShop ? '11.2vw' : '14vw';
  const minWidth = isInShop ? '102px' : '128px';
  const minHeight = isInShop ? '143px' : '179px';

  const arcOffset = !isInShop && total > 1
    ? Math.sin(((index - (total - 1) / 2) / (total - 1 || 1)) * Math.PI * 0.4) * 30
    : 0;

  const rotation = !isInShop && total > 1
    ? ((index - (total - 1) / 2) / (total - 1 || 1)) * 10
    : 0;

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative cursor-pointer select-none
        transition-all duration-300 ease-out will-change-transform
        ${isInShop ? 'shop-card' : ''}
        ${isNew ? 'card-flip-in' : ''}
      `}
      style={{
        width: baseWidth,
        minWidth: minWidth,
        height: baseHeight,
        minHeight: minHeight,
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
          ? `scale(0.7) rotate(${(Math.random() - 0.5) * 4}deg)`
          : isHovered
          ? `translateY(-20px) scale(1.2) rotate(${rotation * 0.3}deg)`
          : `translateY(${arcOffset}px) rotate(${rotation}deg)`,
        transformOrigin: 'bottom center',
        zIndex: isHovered ? 100 : isSelected ? 50 : index,
      }}
    >
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        <div className="absolute top-1 left-1 right-1 flex justify-between items-start">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg"
            style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f1d30)', border: '1px solid rgba(255,255,255,0.5)' }}
          >
            {card.cost}
          </div>
          <div
            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
            style={{ background: tagColor.primary }}
          >
            {card.tag}
          </div>
        </div>

        <div className="absolute inset-x-0 top-8 text-center px-1">
          <div
            className="font-bold text-white truncate"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: isInShop ? '0.7vw' : '0.9vw',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {card.name}
          </div>
        </div>

        <div
          className="absolute inset-x-2 top-[35%] bottom-16 rounded-lg flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="text-center">
            <div
              className="text-4xl mb-1"
              style={{
                filter: `drop-shadow(0 0 8px ${tagColor.glow})`,
                fontSize: isInShop ? '2vw' : '3vw',
              }}
            >
              {card.tag === '火焰' && '🔥'}
              {card.tag === '冰霜' && '❄️'}
              {card.tag === '暗影' && '🌑'}
              {card.tag === '物理' && '⚔️'}
            </div>
            <div
              className="text-white/80 text-[10px] leading-tight px-1"
              style={{ fontSize: isInShop ? '0.55vw' : '0.7vw' }}
            >
              {card.description}
            </div>
          </div>
        </div>

        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              boxShadow: `0 0 10px ${tagColor.glow}`,
              fontSize: isInShop ? '0.8vw' : '1vw',
              width: isInShop ? '28px' : '40px',
              height: isInShop ? '28px' : '40px',
            }}
          >
            {card.attack}
          </div>
        </div>
      </div>

      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: tagColor.particle,
            boxShadow: `0 0 6px ${tagColor.particle}`,
            animation: `particleFloat 1s ease-out forwards`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

import React, { useState } from 'react';
import { Card as CardType, Rarity, BoardCard } from '../modules/card/CardTypes';
import { Sword, Shield, Zap } from 'lucide-react';

interface CardItemProps {
  card: CardType | BoardCard;
  size?: 'small' | 'medium' | 'large';
  isSelected?: boolean;
  isPlayable?: boolean;
  isDragging?: boolean;
  canAttack?: boolean;
  showTooltip?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  draggable?: boolean;
  className?: string;
}

const rarityColors: Record<Rarity, string> = {
  [Rarity.COMMON]: '#888888',
  [Rarity.RARE]: '#4a9eff',
  [Rarity.EPIC]: '#b34aff',
  [Rarity.LEGENDARY]: '#ff8c00',
};

const rarityGlows: Record<Rarity, string> = {
  [Rarity.COMMON]: 'rgba(136, 136, 136, 0.3)',
  [Rarity.RARE]: 'rgba(74, 158, 255, 0.4)',
  [Rarity.EPIC]: 'rgba(179, 74, 255, 0.4)',
  [Rarity.LEGENDARY]: 'rgba(255, 140, 0, 0.5)',
};

export const CardItem: React.FC<CardItemProps> = ({
  card,
  size = 'medium',
  isSelected = false,
  isPlayable = true,
  isDragging = false,
  canAttack = false,
  showTooltip = true,
  onClick,
  onDragStart,
  onDragEnd,
  draggable = true,
  className = '',
}) => {
  const [showDesc, setShowDesc] = useState(false);

  const sizeClasses = {
    small: 'w-16 h-20 text-xs',
    medium: 'w-20 h-28 text-sm',
    large: 'w-28 h-40 text-base',
  };

  const isBoardCard = 'instanceId' in card;
  const boardCard = isBoardCard ? (card as BoardCard) : null;

  const currentAttack = boardCard ? boardCard.currentAttack : card.attack;
  const currentDefense = boardCard ? boardCard.currentDefense : card.defense;
  const maxDefense = boardCard ? boardCard.maxDefense : card.defense;

  const rarityColor = rarityColors[card.rarity];
  const rarityGlow = rarityGlows[card.rarity];

  return (
    <div
      className={`
        relative cursor-pointer transition-all duration-200
        ${sizeClasses[size]}
        ${isSelected ? 'ring-2 ring-yellow-400 scale-105' : ''}
        ${!isPlayable ? 'opacity-50 grayscale' : ''}
        ${isDragging ? 'opacity-50' : ''}
        ${canAttack ? 'ring-2 ring-green-400 animate-pulse' : ''}
        hover:scale-110 hover:z-10
        ${className}
      `}
      style={{
        borderRadius: '8px',
        background: `linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 100%)`,
        border: `2px solid ${rarityColor}`,
        boxShadow: isSelected || showDesc ? `0 0 15px ${rarityGlow}` : 'none',
      }}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setShowDesc(true)}
      onMouseLeave={() => setShowDesc(false)}
    >
      <div
        className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs"
        style={{
          background: 'linear-gradient(135deg, #4a9eff 0%, #2563eb 100%)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {card.cost}
      </div>

      <div className="flex flex-col h-full p-1 pt-3">
        <div
          className="text-center font-bold text-white truncate"
          style={{ fontSize: size === 'small' ? '10px' : size === 'medium' ? '12px' : '14px' }}
        >
          {card.name}
        </div>

        <div
          className="flex-1 flex items-center justify-center my-1 rounded"
          style={{
            background: `linear-gradient(180deg, ${rarityColor}20 0%, transparent 100%)`,
          }}
        >
          <Zap size={size === 'small' ? 16 : size === 'medium' ? 24 : 32} color={rarityColor} />
        </div>

        {size !== 'small' && (
          <div className="text-gray-400 text-center line-clamp-2" style={{ fontSize: '10px' }}>
            {card.description}
          </div>
        )}

        <div className="flex justify-between mt-auto">
          <div className="flex items-center gap-0.5">
            <Sword size={size === 'small' ? 10 : 12} className="text-red-400" />
            <span className="text-red-400 font-bold" style={{ fontSize: size === 'small' ? '10px' : '12px' }}>
              {currentAttack}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Shield size={size === 'small' ? 10 : 12} className="text-blue-400" />
            <span
              className={`font-bold ${currentDefense < maxDefense ? 'text-yellow-400' : 'text-blue-400'}`}
              style={{ fontSize: size === 'small' ? '10px' : '12px' }}
            >
              {currentDefense}
            </span>
          </div>
        </div>
      </div>

      {boardCard?.isFrozen && (
        <div className="absolute inset-0 bg-blue-400/30 rounded flex items-center justify-center">
          <span className="text-2xl">❄️</span>
        </div>
      )}

      {boardCard?.hasTaunt && (
        <div className="absolute top-1 right-1">
          <Shield size={12} className="text-yellow-400" />
        </div>
      )}

      {boardCard?.hasCharge && !boardCard.hasAttacked && (
        <div className="absolute top-1 left-1">
          <Zap size={12} className="text-yellow-400" />
        </div>
      )}

      {showDesc && showTooltip && (
        <div
          className="absolute z-50 left-full ml-2 top-0 w-48 p-3 rounded-lg shadow-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="font-bold text-gray-800 mb-1">{card.name}</div>
          <div className="text-xs text-gray-500 mb-2">费用: {card.cost}</div>
          <div className="text-sm text-gray-700 mb-2">{card.description}</div>
          <div className="text-xs text-gray-600 border-t pt-2">
            <span className="font-semibold">技能:</span> {card.skillDescription}
          </div>
          <div className="flex gap-2 mt-2 text-xs">
            <span className="text-red-500">攻击: {card.attack}</span>
            <span className="text-blue-500">防御: {card.defense}</span>
          </div>
        </div>
      )}
    </div>
  );
};

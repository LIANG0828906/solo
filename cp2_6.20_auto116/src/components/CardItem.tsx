import React, { useState } from 'react';
import { Card as CardType, Rarity, BoardCard } from '../modules/card/CardTypes';
import { Sword, Shield, Zap, Coins } from 'lucide-react';

interface CardItemProps {
  card: CardType | BoardCard;
  size?: 'small' | 'medium' | 'large';
  isSelected?: boolean;
  isPlayable?: boolean;
  isDragging?: boolean;
  canAttack?: boolean;
  isAttacking?: boolean;
  isDamaged?: boolean;
  showTooltip?: boolean;
  showStatsOnCard?: boolean;
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
  isAttacking = false,
  isDamaged = false,
  showTooltip = true,
  showStatsOnCard = true,
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

  const attackAnimationClass = isAttacking ? 'card-attacking' : '';
  const damageAnimationClass = isDamaged ? 'card-damaged' : '';

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
        ${attackAnimationClass} ${damageAnimationClass}
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

        {showStatsOnCard && (
          <div
            className="flex items-center justify-around py-0.5 rounded"
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              fontSize: size === 'small' ? '10px' : '11px',
            }}
          >
            <div className="flex items-center gap-0.5 text-blue-300">
              <Coins size={size === 'small' ? 8 : 9} />
              <span className="font-bold">{card.cost}</span>
            </div>
            <div className="flex items-center gap-0.5 text-red-400">
              <Sword size={size === 'small' ? 8 : 9} />
              <span className="font-bold">{currentAttack}</span>
            </div>
            <div
              className={`flex items-center gap-0.5 ${currentDefense < maxDefense ? 'text-yellow-400' : 'text-blue-400'}`}
            >
              <Shield size={size === 'small' ? 8 : 9} />
              <span className="font-bold">{currentDefense}</span>
            </div>
          </div>
        )}

        {!showStatsOnCard && (
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
        )}
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

      {isDamaged && (
        <div className="absolute inset-0 pointer-events-none rounded">
          <div
            className="absolute inset-0 rounded"
            style={{
              border: '2px solid rgba(255, 80, 80, 0.9)',
              animation: 'damageFlash 0.35s ease-out',
            }}
          />
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ animation: 'damageShake 0.4s ease-in-out' }}
          >
            <span
              className="text-2xl font-bold text-red-500"
              style={{
                textShadow: '0 0 8px rgba(255,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)',
                animation: 'damageFloat 0.5s ease-out forwards',
              }}
            >
              💥
            </span>
          </div>
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
          <div className="text-xs text-gray-500 mb-2">
            费用: {card.cost} | 攻击: {card.attack} | 防御: {card.defense}
          </div>
          <div className="text-sm text-gray-700 mb-2">{card.description}</div>
          <div className="text-xs text-gray-600 border-t pt-2">
            <span className="font-semibold">技能:</span> {card.skillDescription}
          </div>
        </div>
      )}

      <style>{`
        @keyframes cardAttackLunge {
          0% { transform: translateY(0) scale(1); }
          30% { transform: translateY(-10px) scale(1.1); box-shadow: 0 8px 25px rgba(255, 80, 80, 0.5); }
          60% { transform: translateY(0) scale(1.05); }
          100% { transform: translateY(0) scale(1); }
        }
        .card-attacking {
          animation: cardAttackLunge 0.6s ease-in-out;
          z-index: 10;
        }
        @keyframes damageFlash {
          0% { background: rgba(255, 0, 0, 0.6); opacity: 1; }
          30% { background: rgba(255, 120, 120, 0.5); }
          60% { background: rgba(255, 0, 0, 0.3); }
          100% { background: rgba(255, 0, 0, 0); opacity: 0.2; }
        }
        @keyframes damageShake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-4px) rotate(-1deg); }
          30% { transform: translateX(4px) rotate(1deg); }
          45% { transform: translateX(-3px) rotate(-0.5deg); }
          60% { transform: translateX(3px) rotate(0.5deg); }
          75% { transform: translateX(-1px); }
        }
        @keyframes damageFloat {
          0% { opacity: 0; transform: scale(0.5) translateY(0); }
          30% { opacity: 1; transform: scale(1.4) translateY(-8px); }
          60% { opacity: 1; transform: scale(1.1) translateY(-14px); }
          100% { opacity: 0; transform: scale(0.9) translateY(-20px); }
        }
        .card-damaged {
          animation: damagedShake 0.4s ease-in-out;
        }
        @keyframes damagedShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
};

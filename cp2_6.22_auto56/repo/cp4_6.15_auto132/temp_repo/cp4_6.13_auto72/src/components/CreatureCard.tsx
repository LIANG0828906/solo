import React, { useState, useRef } from 'react';
import { Creature, getElementColor } from '../creatures';

interface CreatureCardProps {
  creature: Creature;
  isEnemy?: boolean;
  isDragging?: boolean;
  showHp?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent, creature: Creature) => void;
  onDragEnd?: () => void;
  draggable?: boolean;
}

const CreatureCard: React.FC<CreatureCardProps> = ({
  creature,
  isEnemy = false,
  isDragging = false,
  showHp = true,
  size = 'medium',
  onClick,
  onDragStart,
  onDragEnd,
  draggable = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const elementColor = getElementColor(creature.element);
  
  const sizeClasses = {
    small: 'w-16 h-20',
    medium: 'w-24 h-32',
    large: 'w-32 h-44',
  };
  
  const emojiSize = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-5xl',
  };

  const hpPercent = (creature.currentHp / creature.maxHp) * 100;
  
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, creature);
    }
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      ref={cardRef}
      className={`
        relative rounded-lg cursor-pointer select-none
        ${sizeClasses[size]}
        transition-all duration-200 ease-out
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isHovered && !isDragging ? 'scale-105 z-10' : ''}
      `}
      style={{
        background: isEnemy
          ? 'linear-gradient(180deg, #4a1a1a 0%, #2a0a0a 100%)'
          : 'linear-gradient(180deg, #1a3a5a 0%, #0a1a2a 100%)',
        border: `2px solid ${elementColor}`,
        boxShadow: isHovered
          ? `0 0 20px ${elementColor}80, inset 0 0 15px ${elementColor}30`
          : `0 0 10px ${elementColor}40, inset 0 0 8px ${elementColor}20`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      <div
        className="absolute inset-0 rounded-lg opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${elementColor}40 0%, transparent 60%)`,
        }}
      />
      
      <div className="relative flex flex-col items-center justify-between h-full p-1">
        <div className="text-xs font-bold w-full text-center truncate" style={{ color: elementColor }}>
          {creature.name}
        </div>
        
        <div className={`${emojiSize[size]} drop-shadow-lg transform transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}>
          {creature.emoji}
        </div>
        
        {size !== 'small' && (
          <div className="text-xs text-gray-300">
            Lv.{creature.level}
          </div>
        )}
        
        {showHp && (
          <div className="w-full px-1 pb-1">
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
              <div
                className="h-full transition-all duration-200 ease-out"
                style={{
                  width: `${hpPercent}%`,
                  background: hpPercent > 50
                    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                    : hpPercent > 25
                    ? 'linear-gradient(90deg, #eab308, #facc15)'
                    : 'linear-gradient(90deg, #ef4444, #f87171)',
                  boxShadow: `0 0 8px ${hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#eab308' : '#ef4444'}`,
                }}
              />
            </div>
            {size !== 'small' && (
              <div className="text-[10px] text-center text-gray-400 mt-0.5">
                {creature.currentHp}/{creature.maxHp}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div
        className="absolute top-1 right-1 w-3 h-3 rounded-full border border-gray-700"
        style={{ backgroundColor: elementColor }}
        title={creature.element}
      />
    </div>
  );
};

export default React.memo(CreatureCard);

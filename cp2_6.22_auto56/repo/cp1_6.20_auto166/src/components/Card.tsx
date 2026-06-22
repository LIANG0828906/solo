import React, { useState } from 'react';
import type { Card as CardType } from '../types';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  isOnBoard?: boolean;
  isEnemy?: boolean;
  canAttackNow?: boolean;
  attacking?: boolean;
  targetable?: boolean;
  size?: 'normal' | 'small';
}

const Card: React.FC<CardProps> = ({
  card,
  onClick,
  selected,
  disabled,
  isOnBoard,
  isEnemy,
  canAttackNow,
  attacking,
  targetable,
  size = 'normal',
}) => {
  const [hovered, setHovered] = useState(false);

  const isMinion = card.type === 'minion';
  const cardWidth = size === 'small' ? 90 : 130;
  const cardHeight = size === 'small' ? 130 : 180;

  const getGradient = () => {
    if (isMinion) {
      return 'linear-gradient(135deg, #2a3f5f 0%, #1a2a4f 100%)';
    }
    return 'linear-gradient(135deg, #4a2a5f 0%, #3a1a4f 100%)';
  };

  const renderEffectIcon = () => {
    if (!isMinion || !card.effect || card.effect === 'none') return null;
    const icons: Record<string, string> = {
      taunt: '🛡️',
      charge: '⚔️',
    };
    return (
      <div
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          fontSize: size === 'small' ? 12 : 16,
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '50%',
          width: size === 'small' ? 20 : 26,
          height: size === 'small' ? 20 : 26,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title={card.effect === 'taunt' ? '嘲讽' : '冲锋'}
      >
        {icons[card.effect]}
      </div>
    );
  };

  const renderSpellIcon = () => {
    if (isMinion || !card.spellEffect) return null;
    const icons: Record<string, string> = {
      damage: '🔥',
      heal: '💚',
      buff: '💪',
      draw: '📜',
    };
    return (
      <div
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          fontSize: size === 'small' ? 12 : 16,
          background: 'rgba(0,0,0,0.6)',
          borderRadius: '50%',
          width: size === 'small' ? 20 : 26,
          height: size === 'small' ? 20 : 26,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icons[card.spellEffect]}
      </div>
    );
  };

  return (
    <>
      <div
        onClick={disabled ? undefined : onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: cardWidth,
          height: cardHeight,
          background: getGradient(),
          borderRadius: 12,
          padding: size === 'small' ? 4 : 8,
          position: 'relative',
          cursor: disabled ? 'not-allowed' : onClick ? 'pointer' : 'default',
          opacity: disabled ? 0.5 : 1,
          filter: disabled ? 'grayscale(0.6)' : 'none',
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          transform: selected
            ? 'translateY(-10px) scale(1.05)'
            : hovered && !isOnBoard
            ? 'scale(1.1) translateY(-15px) z-index: 100'
            : attacking
            ? 'rotate(-15deg) translateX(-10px)'
            : 'none',
          boxShadow: selected
            ? '0 0 20px rgba(255, 215, 0, 0.8), 0 8px 25px rgba(0,0,0,0.5)'
            : targetable
            ? '0 0 15px rgba(255, 80, 80, 0.8), 0 4px 15px rgba(0,0,0,0.4)'
            : canAttackNow
            ? '0 0 12px rgba(100, 255, 100, 0.6), 0 4px 12px rgba(0,0,0,0.4)'
            : '0 4px 12px rgba(0,0,0,0.4)',
          border: targetable
            ? '2px solid rgba(255, 80, 80, 0.8)'
            : selected
            ? '2px solid #FFD700'
            : canAttackNow
            ? '2px solid rgba(100, 255, 100, 0.7)'
            : '1px solid rgba(255,255,255,0.1)',
          animation: !isOnBoard ? 'flipIn 500ms ease-out' : 'fadeInScale 300ms ease-out',
          overflow: 'hidden',
          perspective: '1000px',
          zIndex: hovered || selected ? 50 : 1,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: size === 'small' ? 2 : 4,
            left: size === 'small' ? 2 : 4,
            width: size === 'small' ? 22 : 30,
            height: size === 'small' ? 22 : 30,
            background: 'linear-gradient(135deg, #4a90d9, #2563eb)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: size === 'small' ? 12 : 16,
            color: '#fff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            border: '2px solid rgba(255,255,255,0.3)',
          }}
        >
          {card.cost}
        </div>

        {renderEffectIcon()}
        {renderSpellIcon()}

        <div
          style={{
            marginTop: size === 'small' ? 24 : 34,
            textAlign: 'center',
            fontSize: size === 'small' ? 10 : 13,
            fontWeight: 'bold',
            color: '#fff',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            padding: '2px 4px',
          }}
        >
          {card.name}
        </div>

        <div
          style={{
            marginTop: size === 'small' ? 4 : 8,
            height: size === 'small' ? 30 : 50,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size === 'small' ? 20 : 32,
            overflow: 'hidden',
          }}
        >
          {isMinion ? '👹' : '✨'}
        </div>

        {!isOnBoard && (
          <div
            style={{
              marginTop: size === 'small' ? 2 : 4,
              fontSize: size === 'small' ? 7 : 9,
              color: '#ccc',
              textAlign: 'center',
              lineHeight: 1.2,
              height: size === 'small' ? 16 : 28,
              overflow: 'hidden',
            }}
          >
            {card.description}
          </div>
        )}

        {isMinion && (
          <>
            <div
              style={{
                position: 'absolute',
                bottom: size === 'small' ? 2 : 4,
                left: size === 'small' ? 2 : 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: 'rgba(255,80,80,0.9)',
                padding: size === 'small' ? '2px 5px' : '3px 8px',
                borderRadius: 10,
                fontSize: size === 'small' ? 10 : 14,
                fontWeight: 'bold',
                color: '#fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >
              ❤️ {card.health}
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: size === 'small' ? 2 : 4,
                right: size === 'small' ? 2 : 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: 'rgba(220,160,60,0.95)',
                padding: size === 'small' ? '2px 5px' : '3px 8px',
                borderRadius: 10,
                fontSize: size === 'small' ? 10 : 14,
                fontWeight: 'bold',
                color: '#fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >
              ⚔️ {card.attack}
            </div>
          </>
        )}

        {!isMinion && card.spellValue !== undefined && (
          <div
            style={{
              position: 'absolute',
              bottom: size === 'small' ? 2 : 4,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: 'rgba(160,100,220,0.95)',
              padding: size === 'small' ? '2px 6px' : '3px 10px',
              borderRadius: 10,
              fontSize: size === 'small' ? 10 : 13,
              fontWeight: 'bold',
              color: '#fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            {card.spellValue}
          </div>
        )}
      </div>

      {hovered && !disabled && (
        <div
          style={{
            position: 'fixed',
            bottom: size === 'small' ? 40 : 60,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 15, 30, 0.98)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: 12,
            padding: '14px 20px',
            minWidth: 220,
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            animation: 'fadeInScale 200ms ease-out',
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#FFD700',
              marginBottom: 6,
            }}
          >
            {card.name}
          </div>
          <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8 }}>
            费用: {card.cost} | {isMinion ? `攻击: ${card.attack} / 生命: ${card.health}` : '法术'}
          </div>
          {isMinion && card.effect && card.effect !== 'none' && (
            <div style={{ fontSize: 12, color: '#6ec5ff', marginBottom: 6 }}>
              特殊效果: {card.effect === 'taunt' ? '嘲讽 - 敌方必须先攻击此随从' : '冲锋 - 召唤当回合即可攻击'}
            </div>
          )}
          <div style={{ fontSize: 13, color: '#ddd', lineHeight: 1.5 }}>
            {card.description}
          </div>
        </div>
      )}
    </>
  );
};

export default Card;

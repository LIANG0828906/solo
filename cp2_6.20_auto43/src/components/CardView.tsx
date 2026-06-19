import React from 'react';
import { motion, Transition } from 'framer-motion';
import type { Card, BoardCard } from '../types';

type MotionAnimate = any;
type MotionInitial = any;

interface CardViewProps {
  card: Card | BoardCard;
  size?: 'thumb' | 'board' | 'preview';
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  customInitial?: MotionInitial;
  customAnimate?: MotionAnimate;
  customTransition?: Transition;
  onAnimationComplete?: () => void;
  disableDefaultAnimation?: boolean;
}

const CARD_ICONS: Record<string, string> = {
  c1: '⚔️', c2: '🏹', c3: '🛡️', c4: '🔥', c5: '🗡️',
  c6: '✨', c7: '🪓', c8: '🗡️', c9: '🐎', c10: '⚡',
  c11: '🦅', c12: '🛡️', c13: '❄️', c14: '👹', c15: '🐉',
  c16: '🌟', c17: '🗿', c18: '👑', c19: '👺', c20: '👹',
  c21: '📜', c22: '🎯', c23: '⚔️', c24: '🌋',
};

const getTierClass = (cost: number): string => {
  if (cost <= 3) return 'card-tier-bronze';
  if (cost <= 6) return 'card-tier-silver';
  return 'card-tier-gold';
};

const CardView: React.FC<CardViewProps> = ({
  card,
  size = 'thumb',
  className = '',
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
  customInitial,
  customAnimate,
  customTransition,
  onAnimationComplete,
  disableDefaultAnimation = false,
}) => {
  const sizeClass =
    size === 'board' ? 'board-card' : size === 'preview' ? 'preview-card-large' : 'card-thumbnail';

  const boardCard = card as BoardCard;
  const isBoard = 'currentHealth' in card;
  const healthValue = isBoard ? boardCard.currentHealth : card.health;

  const icon = CARD_ICONS[card.id] || '🃏';

  const getInitial = () => {
    if (customInitial) return customInitial;
    if (disableDefaultAnimation) return undefined;
    if (size === 'board') return { scale: 0.8, y: -20, opacity: 0 };
    return undefined;
  };

  const getAnimate = () => {
    if (customAnimate !== undefined) return customAnimate;
    if (disableDefaultAnimation) return undefined;
    if (size === 'board') return { scale: 1, y: 0, opacity: 1 };
    return undefined;
  };

  const getTransition = () => {
    if (customTransition) return customTransition;
    if (size === 'board') return { type: 'spring', stiffness: 300, damping: 24 };
    return undefined;
  };

  return (
    <motion.div
      layout
      initial={getInitial()}
      animate={getAnimate()}
      transition={getTransition()}
      onAnimationComplete={onAnimationComplete}
      className={`card-base ${sizeClass} ${getTierClass(card.cost)} ${className}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="card-cost-badge">{card.cost}</div>
      <div className={`card-rarity-gem rarity-${card.rarity}`} />
      <div className="card-inner">
        <div className="card-name">{card.name}</div>
        <div className="card-art">{icon}</div>
        <div className="card-skill">{card.skill}</div>
        <div className="card-stats">
          <div className="card-atk">{card.attack}</div>
          <div
            className="card-hp"
            style={isBoard && healthValue < card.health ? {
              background: 'radial-gradient(circle, #f59e0b, #b45309)',
            } : undefined}
          >
            {healthValue}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CardView;

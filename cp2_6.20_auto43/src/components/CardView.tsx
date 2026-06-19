import React from 'react';
import { motion } from 'framer-motion';
import type { Card, BoardCard } from '../types';

interface CardViewProps {
  card: Card | BoardCard;
  size?: 'thumb' | 'board' | 'preview';
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
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
}) => {
  const sizeClass =
    size === 'board' ? 'board-card' : size === 'preview' ? 'preview-card-large' : 'card-thumbnail';

  const boardCard = card as BoardCard;
  const isBoard = 'currentHealth' in card;
  const healthValue = isBoard ? boardCard.currentHealth : card.health;

  const icon = CARD_ICONS[card.id] || '🃏';

  return (
    <motion.div
      layout
      initial={size === 'board' ? { scale: 0.8, y: -20, opacity: 0 } : undefined}
      animate={size === 'board' ? { scale: 1, y: 0, opacity: 1 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
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

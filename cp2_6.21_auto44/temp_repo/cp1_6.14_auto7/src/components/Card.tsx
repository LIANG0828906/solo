import React from 'react';
import { Card } from '@/types';
import { getPresetIcon, getPresetBorder, getRarityLabel } from '@/utils/cardUtils';

interface Props {
  card: Card | Partial<Card>;
  size?: 'normal' | 'mini';
  flipped?: boolean;
  showBack?: boolean;
  onClick?: () => void;
  attacking?: 'left' | 'right' | null;
  shaking?: boolean;
  damaged?: boolean;
  damageNumber?: number | null;
  className?: string;
}

export default function CardView({
  card,
  size = 'normal',
  flipped = false,
  showBack = false,
  onClick,
  attacking = null,
  shaking = false,
  damaged = false,
  damageNumber = null,
  className = '',
}: Props) {
  const isMini = size === 'mini';
  const baseClass = isMini ? 'mini-card' : 'card-frame';
  const rarityClass = card.rarity ? `card-rarity-${card.rarity}` : '';
  const flippedClass = flipped ? 'flipped' : '';
  const attackingClass = attacking === 'right' ? 'attacking-right' : attacking === 'left' ? 'attacking-left' : '';
  const shakingClass = shaking ? 'shaking' : '';
  const showBackFace = showBack || flipped;

  const borderPreset = card.borderId ? getPresetBorder(card.borderId) : undefined;
  const iconPreset = card.iconId ? getPresetIcon(card.iconId) : undefined;

  const rootClassName = [
    baseClass,
    rarityClass,
    flippedClass,
    attackingClass,
    shakingClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName} onClick={onClick}>
      {showBackFace ? (
        <div className="card-face card-face-back" />
      ) : (
        <div className="card-face">
          <div className={isMini ? 'mini-card-cost' : 'card-cost'}>{card.cost ?? 0}</div>
          <div className={isMini ? 'mini-card-name' : 'card-name'}>{card.name ?? ''}</div>
          {card.rarity && (
            <div className={`card-rarity-badge ${card.rarity}`} title={getRarityLabel(card.rarity)} />
          )}
          {borderPreset && borderPreset.pattern && card.borderId !== 'none' && (
            <div
              className="card-border-pattern"
              style={{ background: borderPreset.pattern }}
            />
          )}
          <div
            className={isMini ? 'mini-card-icon' : 'card-icon'}
            dangerouslySetInnerHTML={{ __html: iconPreset?.svg || '' }}
          />
          {!isMini && (
            <div className="card-description">{card.description ?? ''}</div>
          )}
          <div className={isMini ? 'mini-card-stats' : 'card-stats'}>
            <div className={isMini ? 'mini-card-attack' : 'card-attack'}>
              {card.attack ?? 0}
            </div>
            <div
              className={[
                isMini ? 'mini-card-health' : 'card-health',
                damaged ? 'damaged' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {card.health ?? 0}
            </div>
          </div>
        </div>
      )}
      {damageNumber !== null && damageNumber !== undefined && (
        <div className="damage-number">-{damageNumber}</div>
      )}
    </div>
  );
}

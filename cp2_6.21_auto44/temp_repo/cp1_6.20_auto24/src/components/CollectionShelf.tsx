import React, { useState, useEffect, useRef } from 'react';
import { PotionInfo } from '../utils/recipes';
import { ParticleSystem } from '../utils/effects';

const SHELF_SLOTS = 4;
const MAX_PER_SLOT = 3;

interface CollectionShelfProps {
  potions: (PotionInfo & { id?: string })[];
  particleSystem: ParticleSystem | null;
}

export const CollectionShelf: React.FC<CollectionShelfProps> = ({ potions, particleSystem }) => {
  const [showGrandPrize, setShowGrandPrize] = useState(false);
  const [isFullFlash, setIsFullFlash] = useState(false);
  const prevCountRef = useRef(0);

  const reversedPotions = [...potions].reverse();

  const slots: (PotionInfo & { id?: string })[][] = [];
  for (let i = 0; i < SHELF_SLOTS; i++) {
    const start = i * MAX_PER_SLOT;
    const end = start + MAX_PER_SLOT;
    slots.push(reversedPotions.slice(start, end));
  }

  const totalMax = SHELF_SLOTS * MAX_PER_SLOT;
  const isFull = potions.length >= totalMax;

  useEffect(() => {
    if (isFull && prevCountRef.current < totalMax) {
      setIsFullFlash(true);
      setShowGrandPrize(true);

      if (particleSystem) {
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            particleSystem?.addExplosionParticles(x, y, '#D4AF37');
          }, i * 100);
        }
      }

      setTimeout(() => setIsFullFlash(false), 1500);
      setTimeout(() => setShowGrandPrize(false), 4000);
    }
    prevCountRef.current = potions.length;
  }, [isFull, potions.length, particleSystem]);

  return (
    <div className="collection-shelf-wrapper">
      <h3 className="shelf-title">
        <span className="title-icon">📚</span>
        收藏架
        <span className="shelf-count">{potions.length}/{totalMax}</span>
      </h3>

      <div className="shelf-container-horizontal">
        {slots.map((slot, slotIndex) => (
          <div key={slotIndex} className={`shelf-slot-horizontal ${slot.length === MAX_PER_SLOT ? 'full' : ''}`}>
            <div className="slot-bottles-horizontal">
              {slot.map((potion, idx) => (
                <div
                  key={potion.id || `${slotIndex}-${idx}`}
                  className="potion-bottle-small"
                  style={{ '--potion-color': potion.color, '--potion-glow': potion.glowColor } as React.CSSProperties}
                >
                  <div className="bottle-body-small">
                    <div className="bottle-liquid-small" />
                  </div>
                  <div className="bottle-cork-small" />
                </div>
              ))}
            </div>
            <div className="slot-base-horizontal" />
          </div>
        ))}
      </div>

      <div className="shelf-legend">
        <div className="legend-title">已发现配方</div>
        <div className="legend-items">
          {Array.from(new Set(potions.map((p) => p.type))).map((type) => {
            const potion = potions.find((p) => p.type === type)!;
            return (
              <div key={type} className="legend-item">
                <span
                  className="legend-dot"
                  style={{ backgroundColor: potion.color, boxShadow: `0 0 8px ${potion.glowColor}` }}
                />
                <span className="legend-name">{potion.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {isFullFlash && <div className="fullscreen-flash" />}

      {showGrandPrize && (
        <div className="grand-prize-popup">
          <div className="prize-icon">🏆</div>
          <div className="prize-title">终极大奖!</div>
          <div className="prize-desc">恭喜你收集满所有药水!</div>
          <div className="prize-total">总得分: {potions.reduce((sum, p) => sum + p.score, 0)}</div>
        </div>
      )}
    </div>
  );
};

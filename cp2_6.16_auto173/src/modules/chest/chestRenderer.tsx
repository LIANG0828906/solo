import React, { useState, useEffect, useMemo } from 'react';
import type { ChestOpenResult, Rarity, ItemFragment, EquipmentSlot } from '../../types';
import './chestRenderer.css';

interface ChestRendererProps {
  isOpen: boolean;
  chestRarity: Rarity;
  result: ChestOpenResult | null;
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  angle: number;
  speed: number;
}

const rarityColors: Record<Rarity, string> = {
  common: '#7F8C8D',
  rare: '#2980B9',
  epic: '#8E44AD',
  legendary: '#F39C12',
};

const slotColors: Record<EquipmentSlot, string> = {
  weapon: '#E74C3C',
  armor: '#3498DB',
  accessory: '#2ECC71',
};

const particleColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00D4AA',
];

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: 50 + (Math.random() - 0.5) * 40,
      y: 50,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      size: 6 + Math.random() * 4,
      delay: Math.random() * 0.3,
      duration: 1 + Math.random() * 0.5,
      angle: -90 + (Math.random() - 0.5) * 120,
      speed: 80 + Math.random() * 120,
    });
  }
  return particles;
}

export const ChestRenderer: React.FC<ChestRendererProps> = ({
  isOpen,
  chestRarity,
  result,
  onComplete,
}) => {
  const [phase, setPhase] = useState<'idle' | 'shake' | 'open' | 'particles' | 'reveal'>('idle');
  const [showItems, setShowItems] = useState(false);
  const chestColor = rarityColors[chestRarity];

  const particleCount = useMemo(() => {
    const base = 100;
    const bonus = { common: 0, rare: 30, epic: 60, legendary: 100 }[chestRarity];
    return base + bonus + Math.floor(Math.random() * 50);
  }, [chestRarity]);

  const particles = useMemo(() => generateParticles(particleCount), [particleCount]);

  const hasEpicOrLegendary = chestRarity === 'epic' || chestRarity === 'legendary' ||
    (result !== null && result.highestRarity === 'epic') ||
    (result !== null && result.highestRarity === 'legendary');

  useEffect(() => {
    if (!isOpen) {
      setPhase('idle');
      setShowItems(false);
      return;
    }

    setPhase('shake');

    const shakeTimer = setTimeout(() => {
      setPhase('open');
    }, 800);

    const particlesTimer = setTimeout(() => {
      setPhase('particles');
    }, 1200);

    const revealTimer = setTimeout(() => {
      setPhase('reveal');
      setShowItems(true);
    }, 2000);

    return () => {
      clearTimeout(shakeTimer);
      clearTimeout(particlesTimer);
      clearTimeout(revealTimer);
    };
  }, [isOpen]);

  const handleClose = () => {
    onComplete();
  };

  if (!isOpen) return null;

  const lidOpen = phase === 'open' || phase === 'particles' || phase === 'reveal';
  const showParticles = phase === 'particles' || phase === 'reveal';
  const lightBeamActive = phase === 'particles' || phase === 'reveal';

  return (
    <div className="chest-renderer-overlay" onClick={handleClose}>
      <div className="chest-renderer-container" onClick={(e) => e.stopPropagation()}>
        {hasEpicOrLegendary && phase !== 'idle' && (
          <div className={`light-beam ${lightBeamActive ? 'light-beam-active' : ''}`} />
        )}

        <div className={`chest-animation ${phase}`}>
          <div
            className="chest-body"
            style={{
              background: `linear-gradient(180deg, ${chestColor} 0%, ${chestColor}88 100%)`,
              boxShadow: `0 0 50px ${chestColor}66`,
            }}
          >
            <div
              className={`chest-lid-anim ${lidOpen ? 'lid-open' : ''}`}
              style={{ backgroundColor: chestColor }}
            />
            <div className="chest-lock-anim" />
          </div>
        </div>

        {showParticles && (
          <div className="particles-container">
            {particles.map((p) => (
              <div
                key={p.id}
                className="particle"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                  '--tx': `${Math.cos((p.angle * Math.PI) / 180) * p.speed}px`,
                  '--ty': `${Math.sin((p.angle * Math.PI) / 180) * p.speed}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}

        {showItems && result && (
          <div className="loot-reveal">
            <h3 className="loot-title">恭喜获得!</h3>
            <div className="loot-items">
              {result.items.map((item, index) => (
                <LootItem key={`${item.id}-${index}`} item={item} delay={index * 0.15} />
              ))}
            </div>
            <button className="loot-close-btn" onClick={handleClose}>
              确认
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface LootItemProps {
  item: ItemFragment;
  delay: number;
}

const LootItem: React.FC<LootItemProps> = ({ item, delay }) => {
  const color = slotColors[item.slot];
  const rarityColor = rarityColors[item.rarity];

  return (
    <div
      className="loot-item"
      style={{
        animationDelay: `${delay}s`,
        borderColor: rarityColor,
        boxShadow: `0 0 15px ${rarityColor}66`,
      }}
    >
      <div className="loot-item-icon">
        {item.slot === 'weapon' && (
          <div
            className="weapon-shape"
            style={{ borderBottomColor: color }}
          />
        )}
        {item.slot === 'armor' && (
          <div className="armor-shape" style={{ backgroundColor: color }} />
        )}
        {item.slot === 'accessory' && (
          <div className="accessory-shape" style={{ backgroundColor: color }} />
        )}
      </div>
      <div className="loot-item-name">{item.name}</div>
      <div className="loot-item-rarity" style={{ color: rarityColor }}>
        {getRarityStars(item.rarity)}
      </div>
    </div>
  );
};

function getRarityStars(rarity: Rarity): string {
  const counts: Record<Rarity, number> = {
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 5,
  };
  return '★'.repeat(counts[rarity]);
}

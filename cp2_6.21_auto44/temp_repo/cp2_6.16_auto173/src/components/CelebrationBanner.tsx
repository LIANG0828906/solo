import React, { useEffect } from 'react';
import type { Equipment } from '../types';
import './CelebrationBanner.css';

interface CelebrationBannerProps {
  equipment: Equipment | null;
  onClose: () => void;
}

const rarityColors: Record<string, string> = {
  common: '#7F8C8D',
  rare: '#2980B9',
  epic: '#8E44AD',
  legendary: '#F39C12',
};

const slotColors: Record<string, string> = {
  weapon: '#E74C3C',
  armor: '#3498DB',
  accessory: '#2ECC71',
};

const rarityNames: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const CelebrationBanner: React.FC<CelebrationBannerProps> = ({ equipment, onClose }) => {
  useEffect(() => {
    if (equipment) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [equipment, onClose]);

  if (!equipment) return null;

  const color = rarityColors[equipment.rarity];

  return (
    <div className="celebration-banner" style={{ borderColor: color }}>
      <div className="banner-confetti">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#F39C12'][i % 5],
            }}
          />
        ))}
      </div>

      <div className="banner-content">
        <div className="banner-icon">
          {equipment.slot === 'weapon' && (
            <div
              className="banner-weapon-shape"
              style={{ borderBottomColor: slotColors[equipment.slot] }}
            />
          )}
          {equipment.slot === 'armor' && (
            <div
              className="banner-armor-shape"
              style={{ backgroundColor: slotColors[equipment.slot] }}
            />
          )}
          {equipment.slot === 'accessory' && (
            <div
              className="banner-accessory-shape"
              style={{ backgroundColor: slotColors[equipment.slot] }}
            />
          )}
        </div>

        <div className="banner-text">
          <p className="banner-label" style={{ color }}>
            恭喜合成 {rarityNames[equipment.rarity]} 装备!
          </p>
          <h3 className="banner-name" style={{ color }}>
            {equipment.name}
          </h3>
          <p className="banner-set">{equipment.setName}</p>
        </div>
      </div>

      <div className="banner-glow" style={{ boxShadow: `0 0 40px ${color}66` }} />
    </div>
  );
};

export default CelebrationBanner;

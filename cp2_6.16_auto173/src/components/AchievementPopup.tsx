import React, { useEffect } from 'react';
import type { Rarity } from '../types';
import './AchievementPopup.css';

interface AchievementPopupProps {
  data: { rarity: Rarity; amount: number } | null;
  onClose: () => void;
}

const rarityColors: Record<Rarity, string> = {
  common: '#7F8C8D',
  rare: '#2980B9',
  epic: '#8E44AD',
  legendary: '#F39C12',
};

const rarityNames: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

const AchievementPopup: React.FC<AchievementPopupProps> = ({ data, onClose }) => {
  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [data, onClose]);

  if (!data) return null;

  const color = rarityColors[data.rarity];

  return (
    <div className="achievement-overlay" onClick={onClose}>
      <div className="achievement-popup" onClick={(e) => e.stopPropagation()}>
        <div className="achievement-glow" style={{ boxShadow: `0 0 60px ${color}66` }} />

        <div className="achievement-icon-wrapper">
          <div className="achievement-icon" style={{ backgroundColor: color }}>
            <span className="achievement-key-icon">🔑</span>
          </div>
        </div>

        <h2 className="achievement-title">成就达成!</h2>

        <p className="achievement-desc">
          收集碎片里程碑奖励
        </p>

        <div className="achievement-reward" style={{ borderColor: color }}>
          <span className="reward-key-icon">🔑</span>
          <span className="reward-text" style={{ color }}>
            {rarityNames[data.rarity]}钥匙 x{data.amount}
          </span>
        </div>

        <p className="achievement-hint">点击任意位置关闭</p>
      </div>
    </div>
  );
};

export default AchievementPopup;

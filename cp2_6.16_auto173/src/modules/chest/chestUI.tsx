import React from 'react';
import type { Rarity } from '../../types';
import { CHEST_CONFIGS } from './chestLogic';
import './chestUI.css';

interface ChestCardProps {
  rarity: Rarity;
  keyCount: number;
  onOpen: (rarity: Rarity) => void;
  isShaking?: boolean;
}

const rarityNames: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export const ChestCard: React.FC<ChestCardProps> = ({
  rarity,
  keyCount,
  onOpen,
  isShaking = false,
}) => {
  const config = CHEST_CONFIGS[rarity];
  const hasEnough = keyCount >= config.keyCost;

  return (
    <div
      className={`chest-card ${isShaking ? 'chest-shake' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${config.color}22 0%, ${config.color}66 100%)`,
        borderColor: config.color,
      }}
      onClick={() => onOpen(rarity)}
    >
      <div className="chest-key-badge" style={{ backgroundColor: config.color }}>
        <span className="chest-key-icon">🔑</span>
        <span className="chest-key-count">{config.keyCost}</span>
      </div>

      <div className="chest-icon-wrapper">
        <div
          className="chest-icon"
          style={{
            background: `linear-gradient(180deg, ${config.color} 0%, ${config.color}88 100%)`,
            boxShadow: `0 0 30px ${config.color}66`,
          }}
        >
          <div className="chest-lid" style={{ backgroundColor: config.color }} />
          <div className="chest-lock" />
        </div>
      </div>

      <div className="chest-info">
        <h3 className="chest-name" style={{ color: config.color }}>
          {config.name}
        </h3>
        <p className="chest-rarity-badge" style={{ color: config.color }}>
          {rarityNames[rarity]}
        </p>
        <p className="chest-item-count">可获得 {config.itemCount} 件物品</p>
      </div>

      <div className={`chest-button ${hasEnough ? '' : 'disabled'}`}>
        {hasEnough ? '开启宝箱' : '钥匙不足'}
      </div>

      <div className="chest-keys-owned">
        持有: <span style={{ color: config.color }}>{keyCount}</span> 把钥匙
      </div>
    </div>
  );
};

interface ChestGridProps {
  keys: Record<Rarity, number>;
  onOpenChest: (rarity: Rarity) => void;
  shakingRarity: Rarity | null;
}

export const ChestGrid: React.FC<ChestGridProps> = ({
  keys,
  onOpenChest,
  shakingRarity,
}) => {
  const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

  return (
    <div className="chest-grid">
      {rarities.map((rarity) => (
        <ChestCard
          key={rarity}
          rarity={rarity}
          keyCount={keys[rarity]}
          onOpen={onOpenChest}
          isShaking={shakingRarity === rarity}
        />
      ))}
    </div>
  );
};

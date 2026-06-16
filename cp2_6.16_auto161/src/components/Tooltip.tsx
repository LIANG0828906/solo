import React from 'react';
import { Flower, Enemy } from '../types';

interface TooltipProps {
  flower: Flower | null;
  enemy: Enemy | null;
  position: { x: number; y: number };
  visible: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ flower, enemy, position, visible }) => {
  if (!visible || (!flower && !enemy)) return null;

  return (
    <div 
      className="tooltip"
      style={{
        left: position.x + 15,
        top: position.y + 15,
      }}
    >
      {flower && (
        <div className="tooltip-content flower-tooltip">
          <div className="tooltip-title">🌸 花朵</div>
          <div className="tooltip-row">
            <span>蜂蜜量:</span>
            <span>{Math.floor(flower.honeyAmount)} / {flower.maxHoney}</span>
          </div>
          <div className="tooltip-honey-bar">
            <div 
              className="tooltip-honey-fill"
              style={{ width: `${(flower.honeyAmount / flower.maxHoney) * 100}%` }}
            />
          </div>
          <div className="tooltip-tip">点击可优先派遣采集蜂</div>
        </div>
      )}
      {enemy && (
        <div className="tooltip-content enemy-tooltip">
          <div className="tooltip-title">
            {enemy.type === 'wasp' && '🐝 黄蜂'}
            {enemy.type === 'bumblebee' && '🐻 熊蜂'}
            {enemy.type === 'hornet' && '🔪 胡蜂'}
          </div>
          <div className="tooltip-row">
            <span>生命值:</span>
            <span>{Math.floor(enemy.health)} / {enemy.maxHealth}</span>
          </div>
          <div className="tooltip-enemy-bar">
            <div 
              className="tooltip-enemy-fill"
              style={{ 
                width: `${(enemy.health / enemy.maxHealth) * 100}%`,
                backgroundColor: enemy.health / enemy.maxHealth > 0.5 ? '#4CAF50' : '#F44336'
              }}
            />
          </div>
          <div className="tooltip-row">
            <span>速度:</span>
            <span>
              {enemy.type === 'wasp' && '快'}
              {enemy.type === 'bumblebee' && '慢 (冲撞)'}
              {enemy.type === 'hornet' && '极快'}
            </span>
          </div>
          <div className="tooltip-row">
            <span>伤害:</span>
            <span>{enemy.damage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

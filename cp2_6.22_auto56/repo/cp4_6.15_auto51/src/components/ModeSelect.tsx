import React from 'react';
import type { GameMode } from '../types';

interface ModeSelectProps {
  onSelectMode: (mode: GameMode) => void;
}

export const ModeSelect: React.FC<ModeSelectProps> = ({ onSelectMode }) => {
  return (
    <div className="mode-select">
      <h1 className="mode-select__title">
        纸牌<span className="mode-select__title--accent">接龙</span>对战
      </h1>
      
      <div className="mode-select__cards">
        <div
          className="mode-card animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
          onClick={() => onSelectMode('single')}
        >
          <span className="mode-card__icon">🃏</span>
          <span className="mode-card__label">单人模式</span>
          <span className="mode-card__desc">
            经典克朗代克接龙规则<br/>
            挑战自我，刷新最高分
          </span>
        </div>
        
        <div
          className="mode-card animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
          onClick={() => onSelectMode('dual')}
        >
          <span className="mode-card__icon">⚔️</span>
          <span className="mode-card__label">双人对战</span>
          <span className="mode-card__desc">
            回合制双人对决<br/>
            共享牌堆，比拼速度与策略
          </span>
        </div>
      </div>
    </div>
  );
};

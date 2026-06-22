import React from 'react';

interface ScoreDisplayProps {
  score: number;
  isAnimating: boolean;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, isAnimating }) => {
  return (
    <div className={`score-display ${isAnimating ? 'score-pop' : ''}`}>
      <span className="score-label">分数</span>
      <span className="score-value">{score}</span>
    </div>
  );
};

interface EnergyBarProps {
  energy: number;
  maxEnergy: number;
}

export const EnergyBar: React.FC<EnergyBarProps> = ({ energy, maxEnergy }) => {
  const percentage = Math.min((energy / maxEnergy) * 100, 100);
  return (
    <div className="energy-bar-container">
      <div className="energy-bar-bg">
        <div
          className="energy-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="energy-text">{Math.floor(energy)} / {maxEnergy}</span>
    </div>
  );
};

interface LevelDisplayProps {
  level: number;
}

export const LevelDisplay: React.FC<LevelDisplayProps> = ({ level }) => {
  return (
    <div className="level-display">
      <span className="level-label">第</span>
      <span className="level-value">{level}</span>
      <span className="level-label">关</span>
    </div>
  );
};

interface ComboIndicatorProps {
  combo: number;
}

export const ComboIndicator: React.FC<ComboIndicatorProps> = ({ combo }) => {
  if (combo < 2) return null;

  const size = 20 + (combo - 1) * 5;
  const clampedCombo = Math.min(combo, 5);

  return (
    <div className="combo-indicator">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        className="combo-flame"
        style={{ '--combo-level': clampedCombo } as React.CSSProperties}
      >
        <defs>
          <linearGradient id="flameGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FF9800" />
            <stop offset="100%" stopColor="#F44336" />
          </linearGradient>
        </defs>
        <path
          d="M20 2 C15 10 8 15 8 24 C8 32 14 38 20 38 C26 38 32 32 32 24 C32 15 25 10 20 2 Z"
          fill="url(#flameGradient)"
        />
      </svg>
      <span className="combo-text">x{clampedCombo}</span>
    </div>
  );
};

interface SidebarProps {
  side: 'left' | 'right';
  level?: number;
  moonCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ side, level, moonCount }) => {
  if (side === 'left') {
    return (
      <div className="sidebar sidebar-left">
        <h3 className="sidebar-title">游戏说明</h3>
        <div className="sidebar-content">
          <p className="sidebar-text">拖动连接相邻的相同元素</p>
          <p className="sidebar-text">路径长度 3-5 即可消除</p>
          <div className="sidebar-divider" />
          <h4 className="sidebar-subtitle">快捷键</h4>
          <p className="sidebar-text">WASD / 方向键：选择</p>
          <p className="sidebar-text">鼠标点击拖动：连接</p>
          <p className="sidebar-text">空格：暂停</p>
          <p className="sidebar-text">R：重新开始</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar sidebar-right">
      <h3 className="sidebar-title">状态信息</h3>
      <div className="sidebar-content">
        <div className="sidebar-stat">
          <span className="stat-label">当前关卡</span>
          <span className="stat-value">{level}</span>
        </div>
        <div className="sidebar-stat">
          <span className="stat-label">月光元素</span>
          <span className="stat-value">{moonCount}</span>
        </div>
        <div className="sidebar-divider" />
        <h4 className="sidebar-subtitle">元素图鉴</h4>
        <div className="element-legend">
          <div className="legend-item">
            <div className="legend-icon fire-icon" />
            <span>火焰</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon water-icon" />
            <span>水流</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon wind-icon" />
            <span>风</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon earth-icon" />
            <span>大地</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon moon-icon" />
            <span>月光</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ControlButtonProps {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export const ControlButton: React.FC<ControlButtonProps> = ({ label, onClick, icon }) => {
  return (
    <button className="control-button" onClick={onClick}>
      {icon && <span className="button-icon">{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

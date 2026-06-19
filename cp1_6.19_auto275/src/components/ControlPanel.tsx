import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getStatusBarColor, COLORS } from '../utils/pixelArt';

const controlPanelSelector = (state: {
  stats: { mood: number; hunger: number; cleanliness: number; energy: number };
  animation: { actionTimer: number };
  feed: () => void;
  play: () => void;
  clean: () => void;
  train: () => void;
}) => ({
  stats: state.stats,
  actionTimer: state.animation.actionTimer,
  feed: state.feed,
  play: state.play,
  clean: state.clean,
  train: state.train,
});

interface StatBarProps {
  label: string;
  value: number;
  icon: string;
}

function StatBar({ label, value, icon }: StatBarProps) {
  const blocks = 20;
  const filledBlocks = Math.ceil((value / 100) * blocks);
  const color = getStatusBarColor(value);

  return (
    <div className="stat-bar-row">
      <span className="stat-icon" title={label}>{icon}</span>
      <div className="stat-bar-container">
        {Array.from({ length: blocks }).map((_, i) => (
          <div
            key={i}
            className="stat-bar-block"
            style={{
              backgroundColor: i < filledBlocks ? color : '#ddd',
              borderColor: COLORS.SPRITE_OUTLINE,
            }}
          />
        ))}
      </div>
      <span className="stat-value">{Math.round(value)}</span>
    </div>
  );
}

interface ActionButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
  bgColor: string;
}

function ActionButton({ icon, label, onClick, disabled, bgColor }: ActionButtonProps) {
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setPressed(true);
    onClick();
    setTimeout(() => setPressed(false), 150);
  };

  return (
    <button
      className={`action-button ${pressed ? 'pressed' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      disabled={disabled}
      style={{
        backgroundColor: bgColor,
        borderColor: COLORS.SPRITE_OUTLINE,
      }}
    >
      <span className="action-icon">{icon}</span>
      <span className="action-label">{label}</span>
    </button>
  );
}

export default function ControlPanel() {
  const { stats, actionTimer, feed, play, clean, train } = useGameStore(controlPanelSelector);
  const isDisabled = actionTimer > 0;

  const statItems = [
    { label: '心情', value: stats.mood, icon: '❤️' },
    { label: '饱腹', value: stats.hunger, icon: '🍎' },
    { label: '清洁', value: stats.cleanliness, icon: '🛁' },
    { label: '活力', value: stats.energy, icon: '⚡' },
  ];

  const actionItems = [
    { icon: '🍔', label: '喂食', onClick: feed, bgColor: COLORS.HAMBURGER_BUN },
    { icon: '🏃', label: '玩耍', onClick: play, bgColor: COLORS.BAR_GREEN },
    { icon: '💧', label: '清洁', onClick: clean, bgColor: COLORS.BATHTUB },
    { icon: '❗', label: '训练', onClick: train, bgColor: COLORS.LIGHTNING },
  ];

  return (
    <div className="control-panel" style={{ borderColor: COLORS.SPRITE_OUTLINE }}>
      <div className="stats-section">
        <h3 className="panel-title" style={{ color: COLORS.SPRITE_OUTLINE }}>状态</h3>
        <div className="stats-list">
          {statItems.map((item) => (
            <StatBar key={item.label} {...item} />
          ))}
        </div>
      </div>

      <div className="actions-section">
        <h3 className="panel-title" style={{ color: COLORS.SPRITE_OUTLINE }}>互动</h3>
        <div className="actions-grid">
          {actionItems.map((item) => (
            <ActionButton
              key={item.label}
              {...item}
              disabled={isDisabled}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

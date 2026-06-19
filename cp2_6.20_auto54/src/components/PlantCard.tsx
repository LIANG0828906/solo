import React, { useEffect, useState, useMemo } from 'react';
import { Plant, GrowthStage, PLANT_CONFIGS, FERTILIZE_COOLDOWN } from '../types';
import { useGardenStore } from '../store';
import { GrowthLog } from './GrowthLog';

interface PlantCardProps {
  plant: Plant;
}

const getStageLabel = (stage: GrowthStage): { label: string; icon: string; color: string } => {
  switch (stage) {
    case GrowthStage.SEEDLING:
      return { label: '幼苗期', icon: '🌱', color: '#a0d468' };
    case GrowthStage.GROWING:
      return { label: '生长期', icon: '🌿', color: '#48cfad' };
    case GrowthStage.MATURE:
      return { label: '成熟期', icon: '🌸', color: '#ac92ec' };
    default:
      return { label: '', icon: '', color: '#ccc' };
  }
};

const CooldownProgress: React.FC<{ remaining: number; total: number }> = ({ remaining, total }) => {
  const progress = 1 - remaining / total;
  const size = 36;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className="cooldown-container">
      <svg width={size} height={size} className="cooldown-ring">
        <defs>
          <linearGradient id="cooldown-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff9800" />
            <stop offset="100%" stopColor="#f44336" />
          </linearGradient>
          <filter id="cooldown-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          className="cooldown-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          className="cooldown-progress-circle"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#cooldown-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter="url(#cooldown-shadow)"
          style={{
            transition: 'stroke-dashoffset 0.1s linear'
          }}
        />
        <circle
          className="cooldown-pulse"
          cx={size / 2}
          cy={size / 2}
          r={radius - 1}
          fill="none"
          stroke="rgba(255, 152, 0, 0.3)"
          strokeWidth="1"
          opacity={progress < 1 ? 1 : 0}
        >
          <animate
            attributeName="r"
            values={`${radius - 1};${radius + 2};${radius - 1}`}
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.4;0;0.4"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
      <div className="cooldown-inner">
        <span className="cooldown-seconds">{seconds}</span>
        <span className="cooldown-unit">s</span>
      </div>
    </div>
  );
};

export const PlantCard: React.FC<PlantCardProps> = ({ plant }) => {
  const {
    waterPlant,
    fertilizePlant,
    expandedPlantId,
    toggleExpandPlant,
    getFertilizeCooldownRemaining,
    updateTime,
    currentTime,
    playSound
  } = useGardenStore();

  const config = PLANT_CONFIGS[plant.type];
  const isExpanded = expandedPlantId === plant.id;
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCooldownRemaining(getFertilizeCooldownRemaining(plant.id));
      updateTime();
    }, 100);
    return () => clearInterval(interval);
  }, [plant.id, getFertilizeCooldownRemaining, updateTime]);

  useEffect(() => {
    setCooldownRemaining(getFertilizeCooldownRemaining(plant.id));
  }, [plant.id, getFertilizeCooldownRemaining, currentTime]);

  const stageInfo = useMemo(() => getStageLabel(plant.stage), [plant.stage]);

  const handleWater = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    if (plant.progress >= 100) {
      return;
    }
    waterPlant(plant.id);
  };

  const handleFertilize = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    if (plant.progress >= 100 || cooldownRemaining > 0) {
      return;
    }
    fertilizePlant(plant.id);
  };

  const handleToggleExpand = () => {
    playSound('click');
    toggleExpandPlant(plant.id);
  };

  const isFullyGrown = plant.progress >= 100;
  const isCooldownActive = cooldownRemaining > 0;

  return (
    <div
      className={`plant-card ${isExpanded ? 'expanded' : ''}`}
      style={{ '--plant-color': config.color } as React.CSSProperties}
      onClick={handleToggleExpand}
    >
      <div className="card-header">
        <div className="plant-info">
          <div
            className={`plant-avatar ${plant.stage === GrowthStage.MATURE ? 'mature' : ''}`}
            style={{
              background: `linear-gradient(135deg, ${config.color}15, ${config.color}30)`
            }}
          >
            <span className="avatar-icon">
              {plant.stage === GrowthStage.SEEDLING && config.seedlingIcon}
              {plant.stage === GrowthStage.GROWING && config.growingIcon}
              {plant.stage === GrowthStage.MATURE && config.matureIcon}
            </span>
          </div>
          <div className="plant-details">
            <div className="plant-name-row">
              <span className="plant-name">{config.name}</span>
              {isFullyGrown && <span className="plant-complete-badge">✓</span>}
            </div>
            <div className="plant-stage" style={{ color: stageInfo.color }}>
              <span className="stage-icon">{stageInfo.icon}</span>
              <span>{stageInfo.label}</span>
              {plant.isWatering && <span className="status-pill watering-pill">💧 浇水中</span>}
              {plant.isFertilizing && <span className="status-pill fertilizing-pill">✨ 施肥中</span>}
            </div>
          </div>
        </div>
        <div className={`expand-arrow ${isExpanded ? 'up' : 'down'}`}>
          {isExpanded ? '▲' : '▼'}
        </div>
      </div>

      <div className="card-progress">
        <div className="progress-text">
          <span>成长进度</span>
          <span className="progress-percent">
            {Math.round(plant.progress)}%
            {isFullyGrown && <span className="complete-text"> · 已成熟</span>}
          </span>
        </div>
        <div className="card-progress-bar">
          <div
            className="card-progress-fill"
            style={{
              width: `${plant.progress}%`,
              background: `linear-gradient(90deg, ${config.color}66, ${config.color})`
            }}
          />
          {!isFullyGrown && (
            <div
              className="progress-glow"
              style={{
                left: `${plant.progress}%`,
                boxShadow: `0 0 10px 2px ${config.color}`
              }}
            />
          )}
        </div>
        <div className="progress-milestones">
          <div className={`milestone ${plant.progress >= 0 ? 'passed' : ''}`}>
            <span className="ms-dot" />
            <span className="ms-label">0%</span>
          </div>
          <div className={`milestone ${plant.progress >= 33 ? 'passed' : ''}`}>
            <span className="ms-dot" />
            <span className="ms-label">33%</span>
          </div>
          <div className={`milestone ${plant.progress >= 100 ? 'passed' : ''}`}>
            <span className="ms-dot" />
            <span className="ms-label">100%</span>
          </div>
        </div>
      </div>

      <div className="card-actions">
        <button
          className={`action-btn water-btn ${isFullyGrown ? 'disabled' : ''} ${plant.isWatering ? 'active' : ''}`}
          onClick={handleWater}
          disabled={isFullyGrown}
        >
          <span className={`action-icon-wrap ${plant.isWatering ? 'bounce' : ''}`}>💧</span>
          <div className="action-text">
            <span className="action-label">浇水</span>
            <span className="action-boost">+{config.waterBoost}%</span>
          </div>
        </button>

        <button
          className={`action-btn fertilize-btn ${(isFullyGrown || isCooldownActive) ? 'disabled' : ''} ${plant.isFertilizing ? 'active' : ''}`}
          onClick={handleFertilize}
          disabled={isFullyGrown || isCooldownActive}
        >
          {isCooldownActive ? (
            <CooldownProgress remaining={cooldownRemaining} total={FERTILIZE_COOLDOWN} />
          ) : (
            <span className={`action-icon-wrap ${plant.isFertilizing ? 'sparkle' : ''}`}>✨</span>
          )}
          {!isCooldownActive && (
            <div className="action-text">
              <span className="action-label">施肥</span>
              <span className="action-boost">+{config.fertilizerBoost}%</span>
            </div>
          )}
        </button>
      </div>

      {isExpanded && <GrowthLog logs={plant.logs} plantedAt={plant.plantedAt} />}

      <style>{`
        .plant-card {
          background: linear-gradient(180deg, #fdfaf0, #faf5e8);
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 2px 10px rgba(139, 111, 71, 0.1);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid rgba(240, 232, 216, 0.8);
          min-width: 300px;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .plant-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--plant-color), transparent);
          opacity: 0.6;
        }
        .plant-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 28px rgba(139, 111, 71, 0.15), 0 4px 12px rgba(0, 0, 0, 0.06);
          border-color: var(--plant-color);
        }
        .plant-card.expanded {
          box-shadow: 0 10px 32px rgba(90, 143, 76, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: var(--plant-color);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }
        .plant-info {
          display: flex;
          gap: 12px;
          align-items: center;
          flex: 1;
          min-width: 0;
        }
        .plant-avatar {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          border: 2px solid var(--plant-color);
          flex-shrink: 0;
          overflow: hidden;
        }
        .plant-avatar.mature {
          animation: avatar-breathe 2s ease-in-out infinite;
        }
        @keyframes avatar-breathe {
          0%, 100% {
            box-shadow: 0 0 8px var(--plant-color), inset 0 0 4px rgba(255,255,255,0.3);
          }
          50% {
            box-shadow: 0 0 22px var(--plant-color), inset 0 0 10px rgba(255,255,255,0.5);
          }
        }
        .avatar-icon {
          font-size: 26px;
          line-height: 1;
        }
        .plant-details {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
          flex: 1;
        }
        .plant-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .plant-name {
          font-size: 16px;
          font-weight: 800;
          color: #2d2a24;
        }
        .plant-complete-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #5a8f4c, #8bc34a);
          color: white;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 2px 4px rgba(90, 143, 76, 0.4);
        }
        .plant-stage {
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 3px;
          flex-wrap: wrap;
        }
        .stage-icon {
          font-size: 12px;
        }
        .status-pill {
          font-size: 10px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 8px;
          margin-left: 4px;
          animation: pill-pulse 0.8s ease-in-out infinite;
        }
        .watering-pill {
          background: rgba(33, 150, 243, 0.15);
          color: #1976d2;
        }
        .fertilizing-pill {
          background: rgba(255, 152, 0, 0.15);
          color: #f57c00;
        }
        @keyframes pill-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .expand-arrow {
          font-size: 10px;
          color: #bbb;
          padding: 6px 10px;
          border-radius: 8px;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .expand-arrow.up {
          color: var(--plant-color);
          background: color-mix(in srgb, var(--plant-color) 15%, transparent);
        }
        .card-progress {
          margin-bottom: 16px;
        }
        .progress-text {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #8b7d6b;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .progress-percent {
          font-weight: 800;
          color: var(--plant-color);
        }
        .complete-text {
          color: #5a8f4c;
          font-weight: 700;
        }
        .card-progress-bar {
          height: 10px;
          background: #ebe4d4;
          border-radius: 5px;
          overflow: visible;
          position: relative;
          margin-bottom: 6px;
        }
        .card-progress-fill {
          height: 100%;
          border-radius: 5px;
          transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }
        .card-progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%);
        }
        .progress-glow {
          position: absolute;
          top: 50%;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          animation: glow-pulse 1.5s ease-in-out infinite;
        }
        @keyframes glow-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.7; }
        }
        .progress-milestones {
          display: flex;
          justify-content: space-between;
          padding: 0 2px;
        }
        .milestone {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          position: relative;
        }
        .ms-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d4cdbd;
          transition: all 0.3s;
        }
        .milestone.passed .ms-dot {
          background: var(--plant-color);
          box-shadow: 0 0 6px var(--plant-color);
        }
        .ms-label {
          font-size: 9px;
          color: #c4bab0;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          transition: color 0.3s;
        }
        .milestone.passed .ms-label {
          color: #8b7d6b;
        }
        .card-actions {
          display: flex;
          gap: 10px;
        }
        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 10px;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          gap: 8px;
          overflow: hidden;
        }
        .action-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 40%;
          background: linear-gradient(180deg, rgba(255,255,255,0.5), transparent);
          pointer-events: none;
        }
        .water-btn {
          background: linear-gradient(180deg, #e3f2fd, #90caf9);
          color: #1565c0;
          border: 1px solid rgba(21, 101, 192, 0.2);
        }
        .water-btn:hover:not(.disabled) {
          background: linear-gradient(180deg, #bbdefb, #64b5f6);
          transform: scale(1.03);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.25);
        }
        .fertilize-btn {
          background: linear-gradient(180deg, #fff8e1, #ffe082);
          color: #e65100;
          border: 1px solid rgba(230, 81, 0, 0.2);
        }
        .fertilize-btn:hover:not(.disabled) {
          background: linear-gradient(180deg, #ffecb3, #ffd54f);
          transform: scale(1.03);
          box-shadow: 0 4px 12px rgba(255, 152, 0, 0.25);
        }
        .action-btn.disabled {
          opacity: 0.55;
          cursor: not-allowed;
          filter: grayscale(0.3);
        }
        .action-btn.active {
          animation: btn-press 0.3s ease;
        }
        @keyframes btn-press {
          0% { transform: scale(1); }
          50% { transform: scale(0.97); }
          100% { transform: scale(1.02); }
        }
        .action-icon-wrap {
          font-size: 20px;
          line-height: 1;
          transition: transform 0.3s;
        }
        .action-icon-wrap.bounce {
          animation: icon-bounce 0.6s ease;
        }
        @keyframes icon-bounce {
          0%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px) scale(1.15); }
          60% { transform: translateY(2px); }
        }
        .action-icon-wrap.sparkle {
          animation: icon-sparkle 0.6s ease;
        }
        @keyframes icon-sparkle {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.3) rotate(15deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .action-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1px;
        }
        .action-label {
          font-size: 12px;
          font-weight: 700;
        }
        .action-boost {
          font-size: 10px;
          opacity: 0.85;
          font-weight: 600;
        }
        .cooldown-container {
          position: relative;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cooldown-ring {
          position: absolute;
          top: 0;
          left: 0;
          overflow: visible;
        }
        .cooldown-inner {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 1px;
          z-index: 1;
        }
        .cooldown-seconds {
          font-size: 14px;
          font-weight: 800;
          color: #e65100;
          line-height: 1;
          font-family: 'Courier New', monospace;
        }
        .cooldown-unit {
          font-size: 9px;
          font-weight: 700;
          color: #ff9800;
          line-height: 1;
        }
      `}</style>
    </div>
  );
};

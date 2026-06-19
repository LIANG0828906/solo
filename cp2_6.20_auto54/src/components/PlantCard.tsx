import React, { useEffect, useState } from 'react';
import { Plant, GrowthStage, PLANT_CONFIGS, FERTILIZE_COOLDOWN } from '../types';
import { useGardenStore } from '../store';
import { GrowthLog } from './GrowthLog';

interface PlantCardProps {
  plant: Plant;
}

const getStageLabel = (stage: GrowthStage): string => {
  switch (stage) {
    case GrowthStage.SEEDLING:
      return '🌱 幼苗期';
    case GrowthStage.GROWING:
      return '🌿 生长期';
    case GrowthStage.MATURE:
      return '🌸 成熟期';
    default:
      return '';
  }
};

const getStageColor = (stage: GrowthStage): string => {
  switch (stage) {
    case GrowthStage.SEEDLING:
      return '#a0d468';
    case GrowthStage.GROWING:
      return '#48cfad';
    case GrowthStage.MATURE:
      return '#ac92ec';
    default:
      return '#ccc';
  }
};

const playSound = (type: 'click' | 'success' | 'fail') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    if (type === 'click') {
      oscillator.frequency.value = 600;
      gainNode.gain.value = 0.08;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.05);
    } else if (type === 'success') {
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.08);
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.16);
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.25);
    } else {
      oscillator.frequency.value = 200;
      oscillator.type = 'sawtooth';
      gainNode.gain.value = 0.08;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
    }
  } catch {
    /* ignore */
  }
};

export const PlantCard: React.FC<PlantCardProps> = ({ plant }) => {
  const { waterPlant, fertilizePlant, expandedPlantId, toggleExpandPlant, getFertilizeCooldownRemaining, updateTime, currentTime } = useGardenStore();
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

  const cooldownProgress = (cooldownRemaining / FERTILIZE_COOLDOWN) * 100;

  const handleWater = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    if (plant.progress >= 100) {
      playSound('fail');
      return;
    }
    waterPlant(plant.id);
    playSound('success');
  };

  const handleFertilize = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click');
    if (plant.progress >= 100 || cooldownRemaining > 0) {
      playSound('fail');
      return;
    }
    fertilizePlant(plant.id);
    playSound('success');
  };

  const handleToggleExpand = () => {
    playSound('click');
    toggleExpandPlant(plant.id);
  };

  const circumference = 2 * Math.PI * 12;
  const strokeDashoffset = circumference - (cooldownProgress / 100) * circumference;

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
            style={{ background: `${config.color}22` }}
          >
            <span className="avatar-icon">
              {plant.stage === GrowthStage.SEEDLING && config.seedlingIcon}
              {plant.stage === GrowthStage.GROWING && config.growingIcon}
              {plant.stage === GrowthStage.MATURE && config.matureIcon}
            </span>
          </div>
          <div className="plant-details">
            <div className="plant-name">{config.name}</div>
            <div className="plant-stage" style={{ color: getStageColor(plant.stage) }}>
              {getStageLabel(plant.stage)}
            </div>
          </div>
        </div>
        <div className="expand-arrow">{isExpanded ? '▲' : '▼'}</div>
      </div>

      <div className="card-progress">
        <div className="progress-text">
          <span>成长进度</span>
          <span className="progress-percent">{Math.round(plant.progress)}%</span>
        </div>
        <div className="card-progress-bar">
          <div
            className="card-progress-fill"
            style={{
              width: `${plant.progress}%`,
              background: `linear-gradient(90deg, ${config.color}66, ${config.color})`
            }}
          />
        </div>
      </div>

      <div className="card-actions">
        <button
          className={`action-btn water-btn ${plant.progress >= 100 ? 'disabled' : ''}`}
          onClick={handleWater}
          disabled={plant.progress >= 100}
        >
          <span className="action-icon">💧</span>
          <span className="action-label">浇水</span>
          <span className="action-boost">+{config.waterBoost}%</span>
        </button>

        <button
          className={`action-btn fertilize-btn ${(plant.progress >= 100 || cooldownRemaining > 0) ? 'disabled' : ''}`}
          onClick={handleFertilize}
          disabled={plant.progress >= 100 || cooldownRemaining > 0}
        >
          {cooldownRemaining > 0 ? (
            <div className="cooldown-wrapper">
              <svg className="cooldown-svg" viewBox="0 0 32 32">
                <circle
                  className="cooldown-bg"
                  cx="16"
                  cy="16"
                  r="12"
                />
                <circle
                  className="cooldown-progress"
                  cx="16"
                  cy="16"
                  r="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 16 16)"
                />
              </svg>
              <span className="cooldown-text">{Math.ceil(cooldownRemaining / 1000)}s</span>
            </div>
          ) : (
            <span className="action-icon">✨</span>
          )}
          <span className="action-label">施肥</span>
          <span className="action-boost">+{config.fertilizerBoost}%</span>
        </button>
      </div>

      {isExpanded && <GrowthLog logs={plant.logs} plantedAt={plant.plantedAt} />}

      <style>{`
        .plant-card {
          background: #fdfaf0;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(139, 111, 71, 0.12);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid #f0e8d8;
          min-width: 280px;
          flex-shrink: 0;
        }
        .plant-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(139, 111, 71, 0.18), 0 4px 12px rgba(0, 0, 0, 0.06);
        }
        .plant-card.expanded {
          box-shadow: 0 8px 28px rgba(90, 143, 76, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: var(--plant-color);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .plant-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .plant-avatar {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          border: 2px solid var(--plant-color);
        }
        .plant-avatar.mature {
          animation: avatar-breathe 2s ease-in-out infinite;
        }
        @keyframes avatar-breathe {
          0%, 100% {
            box-shadow: 0 0 8px var(--plant-color);
          }
          50% {
            box-shadow: 0 0 20px var(--plant-color);
          }
        }
        .avatar-icon {
          font-size: 24px;
          line-height: 1;
        }
        .plant-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .plant-name {
          font-size: 16px;
          font-weight: 700;
          color: #333;
        }
        .plant-stage {
          font-size: 12px;
          font-weight: 600;
        }
        .expand-arrow {
          font-size: 10px;
          color: #999;
          padding: 4px 8px;
          transition: all 0.3s;
        }
        .plant-card.expanded .expand-arrow {
          color: var(--plant-color);
        }
        .card-progress {
          margin-bottom: 14px;
        }
        .progress-text {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #888;
          margin-bottom: 6px;
        }
        .progress-percent {
          font-weight: 700;
          color: var(--plant-color);
        }
        .card-progress-bar {
          height: 8px;
          background: #f0e8d8;
          border-radius: 4px;
          overflow: hidden;
        }
        .card-progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .card-actions {
          display: flex;
          gap: 8px;
        }
        .action-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 8px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          gap: 2px;
        }
        .water-btn {
          background: linear-gradient(135deg, #e3f2fd, #bbdefb);
          color: #1976d2;
        }
        .water-btn:hover:not(.disabled) {
          background: linear-gradient(135deg, #bbdefb, #90caf9);
          transform: scale(1.03);
        }
        .fertilize-btn {
          background: linear-gradient(135deg, #fff8e1, #ffecb3);
          color: #f57f17;
        }
        .fertilize-btn:hover:not(.disabled) {
          background: linear-gradient(135deg, #ffecb3, #ffe082);
          transform: scale(1.03);
        }
        .action-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .action-icon {
          font-size: 18px;
          line-height: 1;
        }
        .action-label {
          font-size: 12px;
          font-weight: 600;
        }
        .action-boost {
          font-size: 10px;
          opacity: 0.8;
        }
        .cooldown-wrapper {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cooldown-svg {
          position: absolute;
          width: 32px;
          height: 32px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .cooldown-bg {
          fill: none;
          stroke: rgba(0, 0, 0, 0.1);
          stroke-width: 3;
        }
        .cooldown-progress {
          fill: none;
          stroke: #f57f17;
          stroke-width: 3;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.1s linear;
        }
        .cooldown-text {
          font-size: 10px;
          font-weight: 700;
          color: #f57f17;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

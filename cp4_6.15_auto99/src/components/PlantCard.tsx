import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Plant } from '@/types/plant';
import { getWateringProgress, getTimeUntilWatering } from '@/services/reminderService';
import styles from './PlantCard.module.css';

interface PlantCardProps {
  plant: Plant;
  weatherCoefficient: number;
  onClick: () => void;
  onWater: () => void;
}

const lightIcons: Record<Plant['lightRequirement'], string> = {
  sunny: '☀️',
  indirect: '⛅',
  shade: '🌙',
};

const lightLabels: Record<Plant['lightRequirement'], string> = {
  sunny: '喜阳',
  indirect: '散射光',
  shade: '喜阴',
};

export function PlantCard({ plant, weatherCoefficient, onClick, onWater }: PlantCardProps) {
  const [progress, setProgress] = useState(() =>
    getWateringProgress(plant, weatherCoefficient)
  );
  const [timeUntil, setTimeUntil] = useState(() =>
    getTimeUntilWatering(plant, weatherCoefficient)
  );
  const timerRef = useRef<number | null>(null);

  const updateTimers = useCallback(() => {
    setProgress(getWateringProgress(plant, weatherCoefficient));
    setTimeUntil(getTimeUntilWatering(plant, weatherCoefficient));
  }, [plant, weatherCoefficient]);

  useEffect(() => {
    updateTimers();

    timerRef.current = window.setInterval(updateTimers, 1000);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [updateTimers]);

  const lastWateredText = plant.lastWateredAt
    ? format(new Date(plant.lastWateredAt), 'M月d日', { locale: zhCN })
    : '暂无记录';

  const countdownText = (() => {
    if (progress >= 100) {
      return '需要浇水';
    }
    if (timeUntil.hours > 24) {
      const days = Math.floor(timeUntil.hours / 24);
      return `${days}天后`;
    }
    if (timeUntil.hours > 0) {
      return `${timeUntil.hours}小时后`;
    }
    if (timeUntil.minutes > 0) {
      return `${timeUntil.minutes}分钟后`;
    }
    return `${timeUntil.seconds}秒后`;
  })();

  const handleWaterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWater();
  };

  const firstPhoto = plant.photos[0];

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.imageWrapper}>
        {firstPhoto ? (
          <img
            src={firstPhoto.url}
            alt={plant.name}
            className={styles.plantImage}
          />
        ) : (
          <div className={styles.placeholder}>🪴</div>
        )}
        
        <div className={styles.lightIcon} title={lightLabels[plant.lightRequirement]}>
          {lightIcons[plant.lightRequirement]}
        </div>

        <button
          className={styles.waterButton}
          onClick={handleWaterClick}
        >
          💧 浇水
        </button>
      </div>

      <div className={styles.info}>
        <h3 className={styles.name}>{plant.name}</h3>
        {plant.species && (
          <p className={styles.species}>{plant.species}</p>
        )}

        <div className={styles.progressContainer}>
          <div className={styles.progressLabel}>
            <span>浇水进度</span>
            <span>{countdownText}</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <span className={styles.waterDrop}>💧</span>
            </div>
          </div>
        </div>

        <p className={styles.lastWatered}>上次浇水：{lastWateredText}</p>
      </div>
    </div>
  );
}

import React, { memo, useCallback, useRef, useState } from 'react';
import type { Plant } from '../types';
import { getLastWatering, getLastFertilizing } from '../growthLogger';
import styles from './PlantCard.module.css';

interface PlantCardProps {
  plant: Plant;
  onClick: (plant: Plant) => void;
  onDelete: (id: string) => void;
  isVisible: boolean;
}

const categoryColors: Record<string, string> = {
  多肉: styles.categorySucculent,
  观叶: styles.categoryFoliage,
  开花: styles.categoryFlowering,
  水生: styles.categoryAquatic,
};

const formatDate = (isoString: string | null): string => {
  if (!isoString) return '暂无记录';
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days === 0) {
    if (hours === 0) return '刚刚';
    return `${hours}小时前`;
  }
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const PlantCard: React.FC<PlantCardProps> = memo(function PlantCard({
  plant,
  onClick,
  onDelete,
  isVisible,
}) {
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const lastWatering = getLastWatering(plant.id);
  const lastFertilizing = getLastFertilizing(plant.id);

  const handleMouseDown = useCallback(() => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowDelete(true);
    }, 800);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (isLongPress.current || showDelete) {
      return;
    }
    onClick(plant);
  }, [plant, onClick, showDelete]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDeleting(true);
      setTimeout(() => {
        onDelete(plant.id);
      }, 500);
    },
    [plant.id, onDelete]
  );

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (showDelete && !isLongPress.current) {
        e.stopPropagation();
        setShowDelete(false);
        return;
      }
      handleClick();
    },
    [showDelete, handleClick]
  );

  return (
    <div
      className={`${styles.card} ${showDelete ? styles.showDelete : ''} ${
        isDeleting ? styles.deleting : ''
      }`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.8)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        pointerEvents: isVisible ? 'auto' : 'none',
        position: isVisible ? 'relative' : 'absolute',
        width: isVisible ? 'auto' : '100%',
      }}
      onClick={handleCardClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      <button
        className={styles.deleteBtn}
        onClick={handleDeleteClick}
        aria-label="删除植物"
      >
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
      <h3 className={styles.name}>{plant.name}</h3>
      <div style={{ textAlign: 'center' }}>
        <span className={`${styles.categoryTag} ${categoryColors[plant.category]}`}>
          {plant.category}
        </span>
      </div>
      <div className={styles.infoRow}>
        <span className={styles.infoLabel}>上次浇水</span>
        <span className={styles.infoValue}>
          {formatDate(lastWatering?.timestamp || null)}
        </span>
      </div>
      <div className={styles.infoRow}>
        <span className={styles.infoLabel}>上次施肥</span>
        <span className={styles.infoValue}>
          {formatDate(lastFertilizing?.timestamp || null)}
        </span>
      </div>
      <div className={styles.infoRow}>
        <span className={styles.infoLabel}>初始高度</span>
        <span className={styles.infoValue}>{plant.initialHeight} cm</span>
      </div>
      <div className={styles.infoRow}>
        <span className={styles.infoLabel}>初始叶片</span>
        <span className={styles.infoValue}>{plant.initialLeaves} 片</span>
      </div>
    </div>
  );
});

export default PlantCard;

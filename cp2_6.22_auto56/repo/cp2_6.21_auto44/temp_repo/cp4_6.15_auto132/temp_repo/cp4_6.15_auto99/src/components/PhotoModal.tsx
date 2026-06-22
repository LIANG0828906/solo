import { useEffect, useCallback } from 'react';
import styles from './PhotoModal.module.css';

interface PhotoModalProps {
  photos: { url: string; note?: string }[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function PhotoModal({ photos, currentIndex, onClose, onNavigate }: PhotoModalProps) {
  const photo = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrev) onNavigate(currentIndex - 1);
          break;
        case 'ArrowRight':
          if (hasNext) onNavigate(currentIndex + 1);
          break;
      }
    },
    [onClose, onNavigate, currentIndex, hasPrev, hasNext]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
        ×
      </button>

      {hasPrev && (
        <button
          className={styles.prevBtn}
          onClick={() => onNavigate(currentIndex - 1)}
          aria-label="上一张"
        >
          ‹
        </button>
      )}

      <div className={styles.imageContainer}>
        <img
          src={photo.url}
          alt={photo.note || '植物照片'}
          className={styles.image}
          draggable={false}
        />
      </div>

      {hasNext && (
        <button
          className={styles.nextBtn}
          onClick={() => onNavigate(currentIndex + 1)}
          aria-label="下一张"
        >
          ›
        </button>
      )}

      {photo.note && (
        <div className={styles.caption}>{photo.note}</div>
      )}

      {photos.length > 1 && (
        <div className={styles.counter}>
          {currentIndex + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}

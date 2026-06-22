import React, { memo, useCallback, useRef } from 'react';
import type { ImageItem } from '../../types';
import styles from './GalleryGrid.module.css';

interface GalleryGridProps {
  images: ImageItem[];
  selectedImageId: string | null;
  compareSelectedIds: string[];
  onImageSelect: (id: string) => void;
  onCompareToggle: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onEnterCompare: () => void;
}

interface ImageCardProps {
  image: ImageItem;
  isSelected: boolean;
  isCompareSelected: boolean;
  onSelect: (id: string) => void;
  onCompareToggle: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  dragOverId: string | null;
  draggingId: string | null;
}

const ImageCard: React.FC<ImageCardProps> = memo(({
  image,
  isSelected,
  isCompareSelected,
  onSelect,
  onCompareToggle,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  dragOverId,
  draggingId,
}) => {
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(`.${styles.checkbox}`) ||
        (e.target as HTMLElement).closest(`.${styles.dragHandle}`)) {
      return;
    }
    onSelect(image.id);
  }, [onSelect, image.id, styles.checkbox, styles.dragHandle]);

  const handleCompareToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCompareToggle(image.id);
  }, [onCompareToggle, image.id]);

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''} ${
        draggingId === image.id ? styles.cardDragging : ''
      } ${dragOverId === image.id ? styles.cardDragOver : ''}`}
      onClick={handleCardClick}
      draggable
      onDragStart={(e) => onDragStart(e, image.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, image.id)}
      onDrop={(e) => onDrop(e, image.id)}
      role="button"
      tabIndex={0}
    >
      <div className={styles.imageWrap}>
        <div
          className={`${styles.checkbox} ${isCompareSelected ? styles.checkboxChecked : ''}`}
          onClick={handleCompareToggle}
          role="checkbox"
          aria-checked={isCompareSelected}
        >
          {isCompareSelected && <span className={styles.checkmark}>✓</span>}
        </div>
        <div className={styles.dragHandle} title="拖拽排序">⋮⋮</div>
        <img
          src={image.url}
          alt={image.name}
          className={styles.image}
          loading="lazy"
          style={{ aspectRatio: `${image.width} / ${image.height}` }}
        />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardTitle} title={image.name}>{image.name}</div>
        <div className={styles.colorRow}>
          {image.colors.map((color, idx) => (
            <div
              key={idx}
              className={styles.colorDot}
              style={{ backgroundColor: color.hex }}
              title={`${color.hex} ${color.ratio}%`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

ImageCard.displayName = 'ImageCard';

const GalleryGrid: React.FC<GalleryGridProps> = ({
  images,
  selectedImageId,
  compareSelectedIds,
  onImageSelect,
  onCompareToggle,
  onReorder,
  onEnterCompare,
}) => {
  const draggingIdRef = useRef<string | null>(null);
  const dragOverIdRef = useRef<string | null>(null);
  const [, forceUpdate] = React.useState(0);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    draggingIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    if (e.dataTransfer.setDragImage) {
      const target = e.currentTarget as HTMLElement;
      e.dataTransfer.setDragImage(target, 100, 60);
    }
    forceUpdate(n => n + 1);
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const fromId = draggingIdRef.current;
    const toId = dragOverIdRef.current;

    if (fromId && toId && fromId !== toId) {
      const fromIndex = images.findIndex(img => img.id === fromId);
      const toIndex = images.findIndex(img => img.id === toId);
      if (fromIndex !== -1 && toIndex !== -1) {
        onReorder(fromIndex, toIndex);
      }
    }

    draggingIdRef.current = null;
    dragOverIdRef.current = null;
    forceUpdate(n => n + 1);
  }, [images, onReorder]);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdRef.current !== id) {
      dragOverIdRef.current = id;
      forceUpdate(n => n + 1);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    dragOverIdRef.current = id;
  }, []);

  if (images.length === 0) {
    return (
      <div className={styles.gridContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🖼️</div>
          <div className={styles.emptyText}>暂无图片素材</div>
          <div className={styles.emptyHint}>拖拽或点击左侧上传区域添加图片，自动分析配色方案</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gridContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>灵感图库 ({images.length})</h2>
        <div className={styles.actions}>
          <span className={styles.selectedCount}>
            已选择 {compareSelectedIds.length}/4 张用于对比
          </span>
          <button
            className={styles.compareBtn}
            onClick={onEnterCompare}
            disabled={compareSelectedIds.length < 2 || compareSelectedIds.length > 4}
          >
            <span>⚖️</span>
            对比配色
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {images.map(image => (
          <ImageCard
            key={image.id}
            image={image}
            isSelected={selectedImageId === image.id}
            isCompareSelected={compareSelectedIds.includes(image.id)}
            onSelect={onImageSelect}
            onCompareToggle={onCompareToggle}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            dragOverId={dragOverIdRef.current}
            draggingId={draggingIdRef.current}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(GalleryGrid);

import React, { useMemo, useState } from 'react';
import type { MaterialItem } from '../types';
import { MaterialManager } from './MaterialManager';
import styles from './MaterialSidebar.module.css';

interface MaterialSidebarProps {
  materialManager: MaterialManager;
}

export const MaterialSidebar: React.FC<MaterialSidebarProps> = ({
  materialManager,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const materials = useMemo(() => materialManager.getMaterials(), [materialManager]);

  const handleDragStart = (e: React.DragEvent, item: MaterialItem) => {
    materialManager.handleDragStart(e, item);
  };

  const imageMaterials = materials.filter((m) => m.type === 'image');
  const textMaterials = materials.filter((m) => m.type === 'text');

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>素材库</h2>
        <div className={styles.subtitle}>拖拽到画布使用</div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>图片素材</div>
        <div className={styles.grid}>
          {imageMaterials.map((item) => (
            <div
              key={item.id}
              className={`${styles.card} ${
                hoveredId === item.id ? styles.hovered : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <img
                src={item.thumbnail}
                alt={item.name}
                className={styles.cardImage}
                draggable={false}
              />
              {hoveredId === item.id && (
                <div className={styles.cardLabel}>{item.name}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>文字素材</div>
        <div className={styles.grid}>
          {textMaterials.map((item) => (
            <div
              key={item.id}
              className={`${styles.card} ${styles.textCard} ${
                hoveredId === item.id ? styles.hovered : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className={styles.cardText}>{item.content}</div>
              {hoveredId === item.id && (
                <div className={styles.cardLabel}>{item.name}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
